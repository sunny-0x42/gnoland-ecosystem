import "server-only";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { connection } from "next/server";
import { CATEGORIES } from "@/lib/constants";
import { SEED } from "@/lib/seed";
import { issueMessage, storeSchema, type Store } from "@/lib/schema";

const dataDir = path.join(process.cwd(), "data");
const storePath = path.join(dataDir, "store.json");

let queue: Promise<unknown> = Promise.resolve();

async function atomicWrite(store: Store): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  const tmp = path.join(dataDir, `store.${process.pid}.tmp`);
  await writeFile(tmp, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  try {
    await rename(tmp, storePath);
  } catch {
    await unlink(storePath).catch(() => undefined);
    await rename(tmp, storePath);
  }
}

export function isReadOnlyFs(error: unknown): boolean {
  const err = error as NodeJS.ErrnoException;
  if (err?.code === "EROFS" || err?.code === "EACCES" || err?.code === "ENOTSUP") return true;
  return typeof err?.message === "string" && /read-only file system/i.test(err.message);
}

export const READ_ONLY_SAVE = "This copy of the site cannot save files. Edit the catalog on the machine that keeps data/store.json.";

async function writeOrKeep(store: Store): Promise<Store> {
  try {
    await atomicWrite(store);
  } catch (error) {
    if (!isReadOnlyFs(error)) throw error;
  }
  return store;
}

const STAND_IN_LOGOS = new Set([
  "/logos/gnolove.svg",
  "/logos/gnochess.svg",
  "/logos/openocean.svg",
  "/logos/gnomputer.svg",
  "/logos/dsocial.svg",
  "/logos/memeland.svg",
]);

function migrateProject(item: unknown): unknown {
  if (!item || typeof item !== "object") return item;
  const record = item as Record<string, unknown>;
  const listed = Array.isArray(record.categories) ? record.categories.filter((value) => typeof value === "string") : [];
  const single = typeof record.category === "string" ? [record.category] : [];
  const categories = listed.length > 0 ? listed : single;
  const logo = typeof record.logo === "string" && !STAND_IN_LOGOS.has(record.logo) ? record.logo : "";
  const rest = { ...record };
  delete rest.category;
  delete rest.tier;
  return {
    ...rest,
    categories,
    logo,
    verified: record.verified === true,
    network: record.network === "mainnet" || record.network === "testnet" ? record.network : "",
    discord: typeof record.discord === "string" ? record.discord : "",
    telegram: typeof record.telegram === "string" ? record.telegram : "",
    docs: typeof record.docs === "string" ? record.docs : "",
    alsoPath: typeof record.alsoPath === "string" ? record.alsoPath : "",
    worksWith: Array.isArray(record.worksWith) ? record.worksWith.filter((item) => typeof item === "string") : [],
    riskFlag: record.riskFlag === true,
    riskNote: typeof record.riskNote === "string" ? record.riskNote : "",
  };
}

export function withDefaultCategories(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const record = raw as { categories?: unknown };
  if (Array.isArray(record.categories) && record.categories.length > 0) return raw;
  return { ...(raw as Record<string, unknown>), categories: [...CATEGORIES] };
}

function migrateStore(raw: unknown): unknown {
  const prepared = withDefaultCategories(raw);
  if (!prepared || typeof prepared !== "object") return prepared;
  const record = prepared as { projects?: unknown };
  const projects = Array.isArray(record.projects) ? record.projects.map(migrateProject) : record.projects;
  return { ...record, projects };
}

async function loadFresh(): Promise<Store> {
  try {
    const rawText = await readFile(storePath, "utf8");
    const raw = JSON.parse(rawText) as unknown;
    const direct = storeSchema.safeParse(withDefaultCategories(raw));
    if (direct.success) {
      assertUnique(direct.data.projects);
      return direct.data;
    }
    const migrated = storeSchema.safeParse(migrateStore(raw));
    if (!migrated.success) throw new Error(issueMessage(migrated.error));
    assertUnique(migrated.data.projects);
    return writeOrKeep(migrated.data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      const seeded = storeSchema.parse(SEED);
      assertUnique(seeded.projects);
      return writeOrKeep(seeded);
    }
    throw error;
  }
}

function assertUnique(projects: Store["projects"]): void {
  const seen = new Set<string>();
  for (const project of projects) {
    if (seen.has(project.id)) throw new Error(`Duplicate id: ${project.id}`);
    seen.add(project.id);
  }
}

export const readStore = cache(async (): Promise<Store> => {
  await connection();
  return loadFresh();
});

export function updateStore(mutate: (store: Store) => void): Promise<Store> {
  const run = async () => {
    const next = structuredClone(await loadFresh());
    mutate(next);
    const parsed = storeSchema.safeParse(next);
    if (!parsed.success) throw new Error(issueMessage(parsed.error));
    assertUnique(parsed.data.projects);
    try {
      await atomicWrite(parsed.data);
    } catch (error) {
      if (isReadOnlyFs(error)) throw new Error(READ_ONLY_SAVE);
      throw error;
    }
    return parsed.data;
  };
  const job = queue.then(run, run);
  queue = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}
