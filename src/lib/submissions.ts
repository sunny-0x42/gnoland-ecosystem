import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { connection } from "next/server";
import { issueMessage, submissionSchema, type Submission } from "@/lib/schema";
import { isReadOnlyFs, READ_ONLY_SAVE } from "@/lib/store";

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "submissions.json");
const listSchema = submissionSchema.array().max(80);

let queue: Promise<unknown> = Promise.resolve();

async function atomicWrite(submissions: Submission[]): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  const tmp = path.join(dataDir, `submissions.${process.pid}.tmp`);
  await writeFile(tmp, `${JSON.stringify(submissions, null, 2)}\n`, "utf8");
  try {
    await rename(tmp, filePath);
  } catch {
    await unlink(filePath).catch(() => undefined);
    await rename(tmp, filePath);
  }
}

export async function readSubmissions(): Promise<Submission[]> {
  await connection();
  try {
    const raw = JSON.parse(await readFile(filePath, "utf8")) as unknown;
    const parsed = listSchema.safeParse(raw);
    if (!parsed.success) throw new Error(issueMessage(parsed.error));
    return parsed.data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

function updateSubmissions(mutate: (submissions: Submission[]) => void): Promise<Submission[]> {
  const run = async () => {
    const next = structuredClone(await readSubmissions());
    mutate(next);
    const parsed = listSchema.safeParse(next);
    if (!parsed.success) throw new Error(issueMessage(parsed.error));
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

export function addSubmission(input: Omit<Submission, "id" | "submittedAt">): Promise<Submission[]> {
  return updateSubmissions((submissions) => {
    if (submissions.length >= 80) throw new Error("The submission queue is full.");
    submissions.unshift({
      ...input,
      id: `sub-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}`,
      submittedAt: new Date().toISOString(),
    });
  });
}

export function renameSubmissionCategory(from: string, to: string): Promise<Submission[]> {
  return updateSubmissions((submissions) => {
    for (const submission of submissions) {
      submission.categories = submission.categories.map((category) => (category === from ? to : category));
    }
  });
}

export function removeSubmission(id: string): Promise<Submission[]> {
  return updateSubmissions((submissions) => {
    const next = submissions.filter((item) => item.id !== id);
    if (next.length === submissions.length) throw new Error("Submission not found.");
    submissions.splice(0, submissions.length, ...next);
  });
}
