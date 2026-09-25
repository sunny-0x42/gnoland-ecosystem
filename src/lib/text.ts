const MARKS = /\p{M}/gu;

export function fold(value: string): string {
  return value.normalize("NFD").replace(MARKS, "").toLowerCase();
}

export function formatDay(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function localDay(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayInSaigon(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function slugify(input: string): string {
  return fold(input)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function initials(name: string): string {
  const words = name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter((word) => word.length > 0);
  const first = words[0];
  if (!first) return "?";
  const second = words[1];
  if (!second) return first.slice(0, 2).toUpperCase();
  return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase();
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function externalHref(raw: string): string | null {
  const value = raw.trim();
  if (!isHttpUrl(value)) return null;
  return value;
}

export function pathKind(path: string): "Realm" | "Package" | "Off-chain" {
  const value = path.trim();
  if (!value) return "Off-chain";
  if (/(^|\/)p\//.test(value)) return "Package";
  return "Realm";
}

export function realmHref(realm: string): string | null {
  const value = realm.trim();
  if (!value) return null;
  if (isHttpUrl(value)) return value;
  if (value.startsWith("gno.land/")) return `https://${value}`;
  if (value.startsWith("/")) {
    if (value.includes("\\") || value.includes("://")) return null;
    return value === "/" ? "https://gno.land" : `https://gno.land${value}`;
  }
  if (/^[pr]\/[A-Za-z0-9._/-]+$/.test(value)) return `https://gno.land/${value}`;
  return null;
}

export function trimDeep(value: unknown): unknown {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(trimDeep);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) out[key] = trimDeep(item);
    return out;
  }
  return value;
}

const URL_RE = /https?:\/\/[^\s]+/g;

export type TextPart = { type: "text" | "link"; value: string };

export function linkify(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_RE)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ type: "text", value: text.slice(last, start) });
    let url = match[0];
    let trail = "";
    while (/[).,]$/.test(url)) {
      trail = url.slice(-1) + trail;
      url = url.slice(0, -1);
    }
    if (isHttpUrl(url)) parts.push({ type: "link", value: url });
    else parts.push({ type: "text", value: url });
    if (trail) parts.push({ type: "text", value: trail });
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts;
}
