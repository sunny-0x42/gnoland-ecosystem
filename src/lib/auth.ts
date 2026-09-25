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
const USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{1,31}$/;
const MAX_ACCOUNTS = 20;

const userSchema = z.object({
  username: z.string().regex(USERNAME_PATTERN),
  salt: z.string().min(16),
  hash: z.string().min(16),
});

const authSchema = z.object({
  secret: z.string().min(32),
  users: z.array(userSchema).min(1).max(MAX_ACCOUNTS),
});

const legacySchema = z.object({
  salt: z.string().min(16),
  hash: z.string().min(16),
  secret: z.string().min(32),
});

type AuthUser = z.infer<typeof userSchema>;
type AuthFile = z.infer<typeof authSchema>;

const fails: number[] = [];
let queue: Promise<unknown> = Promise.resolve();

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

export function passwordError(password: string): string | null {
  if (password.length < 8 || password.length > 200) return "Password must be 8 to 200 characters.";
  return null;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  return ((await scryptAsync(password, salt, 32)) as Buffer).toString("hex");
}

async function writeAuth(auth: AuthFile): Promise<void> {
  await mkdir(path.dirname(authPath), { recursive: true });
  const tmp = `${authPath}.${process.pid}.tmp`;
  await writeFile(tmp, `${JSON.stringify(auth, null, 2)}\n`, "utf8");
  try {
    await rename(tmp, authPath);
  } catch {
    await unlink(authPath).catch(() => undefined);
    await rename(tmp, authPath);
  }
}

function saveError(error: unknown): Error {
  if (isReadOnlyFs(error)) {
    return new Error("This copy of the site cannot save a password. Admin login stays on the machine that keeps data/auth.json.");
  }
  return error instanceof Error ? error : new Error("Could not save the password.");
}

async function loadAuthFile(): Promise<AuthFile | null | "broken"> {
  let text: string;
  try {
    text = await readFile(authPath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    return "broken";
  }
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    return "broken";
  }
  const modern = authSchema.safeParse(raw);
  if (modern.success) return modern.data;
  const legacy = legacySchema.safeParse(raw);
  if (!legacy.success) return "broken";
  const migrated: AuthFile = {
    secret: legacy.data.secret,
    users: [{ username: ADMIN_USERNAME, salt: legacy.data.salt, hash: legacy.data.hash }],
  };
  try {
    await writeAuth(migrated);
  } catch (error) {
    if (!isReadOnlyFs(error)) return "broken";
  }
  return migrated;
}

export async function authState(): Promise<"setup" | "ready" | "broken"> {
  const auth = await loadAuthFile();
  if (auth === "broken") return "broken";
  return auth ? "ready" : "setup";
}

async function readAuth(): Promise<AuthFile | null> {
  const auth = await loadAuthFile();
  return auth && auth !== "broken" ? auth : null;
}

function findUser(auth: AuthFile, username: string): AuthUser | undefined {
  return auth.users.find((user) => user.username === username);
}

export async function listUsernames(): Promise<string[]> {
  const auth = await readAuth();
  return auth ? auth.users.map((user) => user.username) : [];
}

export async function changePassword(actor: string, username: string, currentPassword: string, nextPassword: string): Promise<void> {
  const passError = passwordError(nextPassword);
  if (passError) throw new Error(passError);
  await updateAuth(
    (auth) => {
      if (!findUser(auth, actor) || !findUser(auth, username)) throw new Error("Account not found.");
    },
    async (auth) => {
      const target = findUser(auth, username);
      if (!target) throw new Error("Account not found.");
      if (actor === username) {
        const matches = await passwordsEqual(target, currentPassword);
        if (!matches) throw new Error("Current password is wrong.");
      }
      target.salt = randomBytes(16).toString("hex");
      target.hash = await hashPassword(nextPassword, target.salt);
    },
  );
}

async function updateAuth(check: (auth: AuthFile) => void, mutate: (auth: AuthFile) => void | Promise<void>): Promise<string[]> {
  const run = async () => {
    const current = await readAuth();
    if (!current) throw new Error("Admin login is not set up.");
    const next = structuredClone(current);
    check(next);
    await mutate(next);
    const parsed = authSchema.safeParse(next);
    if (!parsed.success) throw new Error("Could not save the account.");
    try {
      await writeAuth(parsed.data);
    } catch (error) {
      throw saveError(error);
    }
    return parsed.data.users.map((user) => user.username);
  };
  const job = queue.then(run, run);
  queue = job.then(
    () => undefined,
    () => undefined,
  );
  return job;
}

async function passwordsEqual(user: AuthUser, password: string): Promise<boolean> {
  const next = Buffer.from(await hashPassword(password, user.salt), "hex");
  const prev = Buffer.from(user.hash, "hex");
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
}

export async function passwordMatches(username: string, password: string): Promise<boolean> {
  const auth = await readAuth();
  if (!auth) return false;
  const user = findUser(auth, username);
  if (!user) return false;
  return passwordsEqual(user, password);
}

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

export async function writeSession(username: string): Promise<void> {
  const auth = await readAuth();
  const user = auth ? findUser(auth, username) : undefined;
  if (!auth || !user) throw new Error("Admin login is not set up.");
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + SESSION_MS, username, salt: user.salt }), "utf8").toString("base64url");
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

async function readPayload(): Promise<{ exp: number; username: string } | null> {
  const auth = await readAuth();
  if (!auth) return null;
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const parts = token.split(".");
  const body = parts[0];
  const sig = parts[1];
  if (!body || !sig || parts.length !== 2) return null;
  const expected = sign(body, auth.secret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      exp?: unknown;
      username?: unknown;
      salt?: unknown;
    };
    if (typeof payload.exp !== "number" || payload.exp <= Date.now()) return null;
    if (typeof payload.username !== "string" || typeof payload.salt !== "string") return null;
    const user = findUser(auth, payload.username);
    if (!user || user.salt !== payload.salt) return null;
    return { exp: payload.exp, username: payload.username };
  } catch {
    return null;
  }
}

export async function sessionUsername(): Promise<string | null> {
  const payload = await readPayload();
  return payload?.username ?? null;
}

export async function isAuthed(): Promise<boolean> {
  return (await sessionUsername()) !== null;
}
