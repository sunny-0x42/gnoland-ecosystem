import "server-only";
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { z } from "zod";
import { ADMIN_USERNAME, COOKIE_NAME, SESSION_MS } from "@/lib/constants";
import { isReadOnlyFs } from "@/lib/store";

const scryptAsync = promisify(scrypt);
const authPath = path.join(process.cwd(), "data", "auth.json");

const authSchema = z.object({
  salt: z.string().min(16),
  hash: z.string().min(16),
  secret: z.string().min(32),
});

type AuthFile = z.infer<typeof authSchema>;

const fails: number[] = [];

export function rateLimited(): boolean {
  const now = Date.now();
  const recent = fails.filter((stamp) => now - stamp < 10 * 60 * 1000);
  fails.length = 0;
  fails.push(...recent);
  return fails.length >= 8;
}

export function markFailure(): void {
  fails.push(Date.now());
}

export function clearFailures(): void {
  fails.length = 0;
}

export async function authState(): Promise<"setup" | "ready" | "broken"> {
  try {
    const raw = await readFile(authPath, "utf8");
    const parsed = authSchema.safeParse(JSON.parse(raw));
    return parsed.success ? "ready" : "broken";
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "setup";
    return "broken";
  }
}

async function readAuth(): Promise<AuthFile | null> {
  const state = await authState();
  if (state !== "ready") return null;
  const raw = await readFile(authPath, "utf8");
  return authSchema.parse(JSON.parse(raw));
}

export async function createAdmin(password: string): Promise<void> {
  const salt = randomBytes(16).toString("hex");
  const hash = ((await scryptAsync(password, salt, 32)) as Buffer).toString("hex");
  const secret = randomBytes(32).toString("hex");
  try {
    await mkdir(path.dirname(authPath), { recursive: true });
    const tmp = `${authPath}.${process.pid}.tmp`;
    await writeFile(tmp, `${JSON.stringify({ salt, hash, secret }, null, 2)}\n`, "utf8");
    try {
      await rename(tmp, authPath);
    } catch {
      await unlink(authPath).catch(() => undefined);
      await rename(tmp, authPath);
    }
  } catch (error) {
    if (isReadOnlyFs(error)) {
      throw new Error("This copy of the site cannot save a password. Admin login stays on the machine that keeps data/auth.json.");
    }
    throw error;
  }
}

export async function passwordMatches(password: string): Promise<boolean> {
  const auth = await readAuth();
  if (!auth) return false;
  const next = (await scryptAsync(password, auth.salt, 32)) as Buffer;
  const prev = Buffer.from(auth.hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

function sameText(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function usernameMatches(username: string): boolean {
  return sameText(username, ADMIN_USERNAME);
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export async function writeSession(): Promise<void> {
  const auth = await readAuth();
  if (!auth) throw new Error("Admin login is not set up.");
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_MS }), "utf8").toString("base64url");
  const token = `${body}.${sign(body, auth.secret)}`;
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MS / 1000,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function isAuthed(): Promise<boolean> {
  const auth = await readAuth();
  if (!auth) return false;
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const parts = token.split(".");
  const body = parts[0];
  const sig = parts[1];
  if (!body || !sig || parts.length !== 2) return false;
  const expected = sign(body, auth.secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { exp?: unknown };
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}
