import { z } from "zod";
import { STATUSES } from "@/lib/constants";
import { isHttpUrl } from "@/lib/text";

export const categoryNameSchema = z
  .string()
  .trim()
  .min(1, "Category name is required")
  .max(24, "Category name must be 24 characters or fewer")
  .regex(/^[A-Za-z0-9][A-Za-z0-9+&/ -]*$/, "Use letters, numbers, and simple punctuation")
  .refine((value) => value.toLowerCase() !== "all", "All is reserved");

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const optionalHttp = z
  .string()
  .max(300)
  .refine((value) => value === "" || isHttpUrl(value), "URL must start with http:// or https://");

const logoSchema = z
  .string()
  .max(300)
  .refine(
    (value) => value === "" || isHttpUrl(value) || /^\/logos\/[a-z0-9][a-z0-9.-]*\.(png|svg|jpe?g|webp|gif|ico)$/.test(value),
    "Logo must be an http(s) URL or a /logos file",
  );

export const projectSchema = z
  .object({
    id: z
      .string()
      .max(48)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "ID may only use lowercase letters, numbers, and hyphens"),
    name: z.string().min(1, "Name is required").max(120),
    status: z.enum(STATUSES),
    categories: z.array(categoryNameSchema).min(1, "Pick at least one category").max(12, "Pick at most 12 categories"),
    score: z.number().int("Sort score must be an integer").min(0).max(100),
    oneLiner: z.string().min(1, "One-line summary is required").max(400),
    team: z.string().max(80),
    website: optionalHttp,
    github: optionalHttp,
    x: optionalHttp,
    discord: optionalHttp.default(""),
    telegram: optionalHttp.default(""),
    docs: optionalHttp.default(""),
    worksWith: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).max(8).default([]),
    realm: z.string().max(200),
    alsoPath: z.string().max(200).default(""),
    lastUpdated: day,
    notes: z.string().max(4000),
    logo: logoSchema,
    verified: z.boolean(),
    network: z.union([z.literal(""), z.literal("mainnet"), z.literal("testnet")]),
    riskFlag: z.boolean(),
    riskNote: z.string().max(800),
  })
  .superRefine((project, ctx) => {
    if (project.riskFlag && project.riskNote.trim().length < 8) {
      ctx.addIssue({
        code: "custom",
        message: "Describe the community-risk concern.",
        path: ["riskNote"],
      });
    }
  });

export const metaSchema = z.object({
  updated: day,
  chain: z.string().min(1, "Chain id is required").max(40),
  rpc: optionalHttp,
  mainnet: day,
  revision: z.number().int().min(1).max(99),
});

export const copySchema = z.object({
  title: z.string().min(1, "Title is required").max(80),
  eyebrow: z.string().min(1, "Eyebrow is required").max(180),
  subtitle: z.string().min(1, "Subtitle is required").max(320),
  legend: z.string().min(1).max(280),
  footerNote: z.string().min(1).max(180),
  updateHint: z.string().max(220),
  searchPlaceholder: z.string().min(1).max(80),
  empty: z.string().min(1).max(140),
});

export const sourceSchema = z.object({
  label: z.string().min(1, "Source label is required").max(40),
  href: z.string().max(300).refine(isHttpUrl, "Source must be an http(s) URL"),
});

export const storeSchema = z
  .object({
    meta: metaSchema,
    categories: z.array(categoryNameSchema).min(1, "Add at least one category").max(40, "Category limit reached"),
    copy: copySchema,
    sources: z.array(sourceSchema).max(12),
    projects: z.array(projectSchema).max(200),
  })
  .superRefine((store, ctx) => {
    const seen = new Set<string>();
    store.categories.forEach((name, index) => {
      const key = name.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({ code: "custom", message: "That category already exists.", path: ["categories", index] });
      }
      seen.add(key);
    });
    const known = new Set(store.categories);
    store.projects.forEach((project, index) => {
      for (const category of project.categories) {
        if (!known.has(category)) {
          ctx.addIssue({
            code: "custom",
            message: `Unknown category: ${category}`,
            path: ["projects", index, "categories"],
          });
        }
      }
    });
  });

const publicLogo = z
  .string()
  .max(300)
  .refine((value) => value === "" || isHttpUrl(value), "Logo must be an http(s) URL");

const submissionFields = {
  name: z.string().trim().min(1, "Name is required").max(120),
  status: z.enum(STATUSES),
  categories: z.array(categoryNameSchema).min(1, "Pick at least one category").max(12),
  oneLiner: z.string().trim().min(1, "One-line summary is required").max(400),
  team: z.string().trim().max(80),
  website: optionalHttp,
  github: optionalHttp,
  x: optionalHttp,
  discord: optionalHttp.default(""),
  telegram: optionalHttp.default(""),
  docs: optionalHttp.default(""),
  realm: z.string().trim().max(200),
  alsoPath: z.string().trim().max(200).default(""),
  notes: z.string().trim().max(4000),
  logo: publicLogo,
  network: z.union([z.literal(""), z.literal("mainnet"), z.literal("testnet")]),
};

function requireSource(value: { website: string; github: string; realm: string }, ctx: z.RefinementCtx) {
  if (!value.website && !value.github && !value.realm) {
    ctx.addIssue({
      code: "custom",
      message: "Add a website, GitHub, or realm.",
      path: ["website"],
    });
  }
}

export const submissionInputSchema = z.object(submissionFields).superRefine(requireSource);

export const submissionSchema = z
  .object({
    id: z
      .string()
      .max(48)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid submission id"),
    submittedAt: z.string().datetime(),
    ...submissionFields,
  })
  .superRefine(requireSource);

export const pageSchema = z.object({
  meta: metaSchema,
  copy: copySchema,
  sources: z.array(sourceSchema).max(12),
});

export type Project = z.infer<typeof projectSchema>;
export type Submission = z.infer<typeof submissionSchema>;
export type SubmissionInput = z.infer<typeof submissionInputSchema>;
export type Meta = z.infer<typeof metaSchema>;
export type Copy = z.infer<typeof copySchema>;
export type SourceLink = z.infer<typeof sourceSchema>;
export type Store = z.infer<typeof storeSchema>;
export type PageDraft = z.infer<typeof pageSchema>;

export type ActionResult = { ok: true; store: Store } | { ok: false; error: string };
export type AuthResult = { ok: true } | { ok: false; error: string };

export function issueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid data.";
}
