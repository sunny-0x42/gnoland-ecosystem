"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  authState,
  clearFailures,
  clearSession,
  createAdmin,
  isAuthed,
  markFailure,
  passwordMatches,
  rateLimited,
  usernameMatches,
  writeSession,
} from "@/lib/auth";
import {
  categoryNameSchema,
  issueMessage,
  pageSchema,
  projectSchema,
  storeSchema,
  submissionInputSchema,
  type ActionResult,
  type AuthResult,
  type Submission,
} from "@/lib/schema";
import { addSubmission, removeSubmission, renameSubmissionCategory } from "@/lib/submissions";
import { readStore, updateStore, withDefaultCategories } from "@/lib/store";
import { todayInSaigon, trimDeep } from "@/lib/text";

function refresh(): void {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/submit");
}

const submissionHits: number[] = [];

function submissionLimited(): boolean {
  const now = Date.now();
  const recent = submissionHits.filter((stamp) => now - stamp < 10 * 60 * 1000);
  submissionHits.length = 0;
  submissionHits.push(...recent);
  return recent.length >= 6;
}

export type SubmissionResult = { ok: true; submissions: Submission[] } | { ok: false; error: string };

export async function submitProjectAction(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  if (submissionLimited()) return { ok: false, error: "Too many submissions. Try again in a few minutes." };
  const record = input && typeof input === "object" ? (input as { company?: unknown }) : {};
  if (typeof record.company === "string" && record.company.trim() !== "") return { ok: true };
  submissionHits.push(Date.now());
  const parsed = submissionInputSchema.safeParse(trimDeep(input));
  if (!parsed.success) return { ok: false, error: issueMessage(parsed.error) };
  try {
    const store = await readStore();
    const known = new Set(store.categories);
    for (const category of parsed.data.categories) {
      if (!known.has(category)) return { ok: false, error: `Unknown category: ${category}` };
    }
    await addSubmission(parsed.data);
    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not submit." };
  }
}

export async function dismissSubmissionAction(id: string): Promise<SubmissionResult> {
  const denied = await gate();
  if (denied) return { ok: false, error: denied };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return { ok: false, error: "Invalid submission." };
  try {
    const submissions = await removeSubmission(id);
    refresh();
    return { ok: true, submissions };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not dismiss." };
  }
}

async function gate(): Promise<string | null> {
  if (await isAuthed()) return null;
  return "Sign in required.";
}

export async function setupAction(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  void _prev;
  if ((await authState()) !== "setup") return { ok: false, error: "Admin login already exists." };
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!usernameMatches(username)) return { ok: false, error: "The admin account name is admin." };
  if (password.length < 8 || password.length > 200) {
    return { ok: false, error: "Password must be 8 to 200 characters." };
  }
  if (password !== confirm) return { ok: false, error: "Passwords do not match." };
  try {
    await createAdmin(password);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save the password." };
  }
  await writeSession();
  redirect("/admin");
}

export async function loginAction(_prev: AuthResult | null, formData: FormData): Promise<AuthResult> {
  void _prev;
  if (rateLimited()) return { ok: false, error: "Sign-in is paused for a few minutes." };
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 1 || password.length > 200) {
    markFailure();
    return { ok: false, error: "Wrong account or password." };
  }
  const passOk = await passwordMatches(password);
  const userOk = usernameMatches(username);
  if (!passOk || !userOk) {
    markFailure();
    return { ok: false, error: "Wrong account or password." };
  }
  clearFailures();
  await writeSession();
  redirect("/admin");
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  redirect("/");
}

export async function savePageAction(input: unknown): Promise<ActionResult> {
  const denied = await gate();
  if (denied) return { ok: false, error: denied };
  const parsed = pageSchema.safeParse(trimDeep(input));
  if (!parsed.success) return { ok: false, error: issueMessage(parsed.error) };
  try {
    const store = await updateStore((draft) => {
      draft.meta = parsed.data.meta;
      draft.copy = parsed.data.copy;
      draft.sources = parsed.data.sources;
    });
    refresh();
    return { ok: true, store };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save." };
  }
}

export async function upsertProjectAction(input: unknown, previousId: string | null): Promise<ActionResult> {
  const denied = await gate();
  if (denied) return { ok: false, error: denied };
  if (previousId !== null && (typeof previousId !== "string" || previousId.length > 48)) {
    return { ok: false, error: "Invalid data." };
  }
  const parsed = projectSchema.safeParse(trimDeep(input));
  if (!parsed.success) return { ok: false, error: issueMessage(parsed.error) };
  const project = parsed.data;
  const prior = previousId || null;
  try {
    const store = await updateStore((draft) => {
      for (const category of project.categories) {
        if (!draft.categories.includes(category)) throw new Error(`Unknown category: ${category}`);
      }
      const projects = draft.projects.slice();
      const index = prior ? projects.findIndex((item) => item.id === prior) : -1;
      if (prior && index === -1) throw new Error("Project not found.");
      const duplicate = projects.findIndex((item) => item.id === project.id);
      if (duplicate !== -1 && duplicate !== index) throw new Error("That ID already exists.");
      if (index === -1) projects.push(project);
      else projects[index] = project;
      draft.projects = projects;
      draft.meta.updated = todayInSaigon();
    });
    refresh();
    return { ok: true, store };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not save." };
  }
}

export async function addCategoryAction(name: string): Promise<ActionResult> {
  const denied = await gate();
  if (denied) return { ok: false, error: denied };
  const parsed = categoryNameSchema.safeParse(name);
  if (!parsed.success) return { ok: false, error: issueMessage(parsed.error) };
  try {
    const store = await updateStore((draft) => {
      const exists = draft.categories.some((item) => item.toLowerCase() === parsed.data.toLowerCase());
      if (exists) throw new Error("That category already exists.");
      draft.categories = [...draft.categories, parsed.data];
    });
    refresh();
    return { ok: true, store };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not add the category." };
  }
}

export async function renameCategoryAction(from: string, to: string): Promise<ActionResult> {
  const denied = await gate();
  if (denied) return { ok: false, error: denied };
  const parsed = categoryNameSchema.safeParse(to);
  if (!parsed.success) return { ok: false, error: issueMessage(parsed.error) };
  try {
    const store = await updateStore((draft) => {
      const index = draft.categories.indexOf(from);
      if (index < 0) throw new Error("Category not found.");
      const nextName = parsed.data;
      if (from === nextName) return;
      const clash = draft.categories.some((item, itemIndex) => itemIndex !== index && item.toLowerCase() === nextName.toLowerCase());
      if (clash) throw new Error("That category already exists.");
      const categories = draft.categories.slice();
      categories[index] = nextName;
      draft.categories = categories;
      draft.projects = draft.projects.map((project) => ({
        ...project,
        categories: project.categories.map((category) => (category === from ? nextName : category)),
      }));
    });
    await renameSubmissionCategory(from, parsed.data);
    refresh();
    return { ok: true, store };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not rename the category." };
  }
}

export async function removeCategoryAction(name: string): Promise<ActionResult> {
  const denied = await gate();
  if (denied) return { ok: false, error: denied };
  try {
    const store = await updateStore((draft) => {
      if (!draft.categories.includes(name)) throw new Error("Category not found.");
      if (draft.categories.length === 1) throw new Error("Keep at least one category.");
      const used = draft.projects.some((project) => project.categories.includes(name));
      if (used) throw new Error("Move projects out of this category before removing it.");
      draft.categories = draft.categories.filter((item) => item !== name);
    });
    refresh();
    return { ok: true, store };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not remove the category." };
  }
}

export async function deleteProjectAction(id: string): Promise<ActionResult> {
  const denied = await gate();
  if (denied) return { ok: false, error: denied };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) return { ok: false, error: "Invalid ID." };
  try {
    const store = await updateStore((draft) => {
      const next = draft.projects.filter((item) => item.id !== id);
      if (next.length === draft.projects.length) throw new Error("Project not found.");
      draft.projects = next;
      draft.meta.updated = todayInSaigon();
    });
    refresh();
    return { ok: true, store };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not delete." };
  }
}

export async function replaceStoreAction(input: unknown): Promise<ActionResult> {
  const denied = await gate();
  if (denied) return { ok: false, error: denied };
  const parsed = storeSchema.safeParse(withDefaultCategories(trimDeep(input)));
  if (!parsed.success) return { ok: false, error: "File must be a tracker JSON export." };
  try {
    const store = await updateStore((draft) => {
      draft.meta = parsed.data.meta;
      draft.categories = parsed.data.categories;
      draft.copy = parsed.data.copy;
      draft.sources = parsed.data.sources;
      draft.projects = parsed.data.projects;
    });
    refresh();
    return { ok: true, store };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not import." };
  }
}
