import "server-only";
import { get, put } from "@vercel/blob";

export function usesDurableStore(): boolean {
  return process.env.VERCEL === "1" && Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
}

export async function readDurableJson(pathname: string): Promise<unknown | null> {
  try {
    const result = await get(pathname, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const text = await new Response(result.stream).text();
    if (!text.trim()) return null;
    return JSON.parse(text) as unknown;
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    const message = error instanceof Error ? error.message : "";
    if (name === "BlobNotFoundError" || /not found/i.test(message)) return null;
    throw error;
  }
}

export async function writeDurableJson(pathname: string, value: unknown): Promise<void> {
  await put(pathname, JSON.stringify(value), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}
