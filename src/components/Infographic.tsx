"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/schema";
import { formatDay } from "@/lib/text";

type Row = { category: string; projects: Project[] };

type Quote = { price: string; change: string; down: boolean } | null;

export function Infographic({
  title,
  updated,
  chain,
  projects,
  total,
  rows,
  filterLabel,
}: {
  title: string;
  updated: string;
  chain: string;
  projects: Project[];
  total: number;
  rows: Row[];
  filterLabel: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setUrl(null);
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [url]);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      await document.fonts.ready;
      const quote = await loadQuote();
      const logos = await loadLogos(projects);
      setUrl(draw({ title, updated, chain, projects, total, rows, filterLabel, quote, logos }));
    } catch {
      setError("Could not draw the infographic.");
    } finally {
      setBusy(false);
    }
  }

  const fileName = `gnoland-ecosystem-${updated}.png`;

  return (
    <>
      <button className="ghost" type="button" onClick={() => void create()} disabled={busy || projects.length === 0}>
        {busy ? "Drawing..." : "Infographic"}
      </button>
      {error ? <p className="form-error">{error}</p> : null}
      {url ? (
        <div className="info-root">
          <button className="overlay" type="button" aria-label="Close infographic" onClick={() => setUrl(null)} />
          <div className="info-panel" role="dialog" aria-modal="true" aria-label="Infographic preview">
            <img src={url} alt="Gnoland ecosystem infographic" />
            <div className="info-actions">
              <a className="primary" href={url} download={fileName}>
                Download PNG
              </a>
              <button className="ghost" type="button" onClick={() => setUrl(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

async function loadQuote(): Promise<Quote> {
  try {
    const response = await fetch("/api/gnot-market");
    if (!response.ok) return null;
    const body = (await response.json()) as {
      ok?: boolean;
      exchanges?: Array<{ name: string; price: number | null; change: number | null }>;
    };
    const kucoin = body.exchanges?.find((item) => item.name === "KuCoin");
    if (!body.ok || kucoin?.price == null || kucoin.change == null) return null;
    const pct = kucoin.change * 100;
    const sign = pct > 0 ? "+" : "";
    return {
      price: `$${kucoin.price.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`,
      change: `${sign}${pct.toFixed(1)}%`,
      down: pct < 0,
    };
  } catch {
    return null;
  }
}

const COLS = 8;
const CELL_W = 118;
const CELL_H = 108;
const LOGO = 52;

async function loadLogos(projects: Project[]): Promise<Map<string, CanvasImageSource>> {
  const sources = [...new Set(projects.map((project) => project.logo).filter((logo) => logo !== ""))];
  const loaded = await Promise.all(sources.map((src) => loadImage(src)));
  const logos = new Map<string, CanvasImageSource>();
  loaded.forEach((image, index) => {
    const src = sources[index];
    if (image && src) logos.set(src, image);
  });
  return logos;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function draw(input: {
  title: string;
  updated: string;
  chain: string;
  projects: Project[];
  total: number;
  rows: Row[];
  filterLabel: string;
  quote: Quote;
  logos: Map<string, CanvasImageSource>;
}): string {
  const width = 1080;
  const blocks = input.rows.map((row) => 52 + Math.ceil(row.projects.length / COLS) * CELL_H);
  const height = 430 + blocks.reduce((sum, block) => sum + block, 0) + 80;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";

  ctx.fillStyle = "#0a0a0c";
  ctx.fillRect(0, 0, width, height);
  round(ctx, 36, 28, width - 72, height - 56, 28);
  ctx.fillStyle = "#101114";
  ctx.fill();

  ctx.fillStyle = "#3ee08f";
  ctx.beginPath();
  ctx.arc(78, 78, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = `500 14px ${font}`;
  ctx.fillStyle = "#8b93a7";
  ctx.fillText(input.chain.toUpperCase(), 96, 84);

  ctx.fillStyle = "#f4f4f5";
  ctx.font = `600 42px ${font}`;
  ctx.fillText(input.title, 64, 140);
  ctx.font = `400 18px ${font}`;
  ctx.fillStyle = "#8b93a7";
  const scope = input.projects.length === input.total ? `${input.projects.length} projects` : `${input.projects.length} of ${input.total}`;
  ctx.fillText(`${scope}${input.filterLabel ? ` · ${input.filterLabel}` : ""}`, 64, 176);
  ctx.fillText(`Updated ${formatDay(input.updated)}`, 64, 204);

  if (input.quote) {
    ctx.fillStyle = "#f4f4f5";
    ctx.font = `600 28px ${font}`;
    const priceText = `GNOT ${input.quote.price}`;
    ctx.fillText(priceText, 64, 258);
    const priceWidth = ctx.measureText(priceText).width;
    ctx.font = `600 18px ${font}`;
    ctx.fillStyle = input.quote.down ? "#ff6b81" : "#3ee08f";
    ctx.fillText(input.quote.change, 64 + priceWidth + 14, 258);
    ctx.font = `400 14px ${font}`;
    ctx.fillStyle = "#8b93a7";
    ctx.fillText("KuCoin spot · not a tracker estimate", 64, 284);
  }

  const mainnet = input.projects.filter((project) => project.network === "mainnet").length;
  const testnet = input.projects.filter((project) => project.network === "testnet").length;
  const live = input.projects.filter((project) => project.status === "Live").length;
  const stats = [
    [String(input.projects.length), "Projects"],
    [String(live), "Live"],
    [String(mainnet), "Mainnet"],
    [String(testnet), "Testnet"],
    [String(input.rows.length), "Categories"],
  ];
  stats.forEach(([value, label], index) => {
    const x = 64 + index * 190;
    ctx.fillStyle = "#181b20";
    round(ctx, x, 312, 174, 78, 14);
    ctx.fill();
    ctx.fillStyle = "#f4f4f5";
    ctx.font = `600 28px ${font}`;
    ctx.fillText(value, x + 16, 350);
    ctx.fillStyle = "#8b93a7";
    ctx.font = `400 14px ${font}`;
    ctx.fillText(label, x + 16, 372);
  });

  let cursor = 420;
  input.rows.forEach((row) => {
    ctx.fillStyle = "#f4f4f5";
    ctx.font = `600 20px ${font}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(row.category, 64, cursor + 22);
    const titleWidth = ctx.measureText(row.category).width;
    ctx.fillStyle = "#8b93a7";
    ctx.font = `400 14px ${font}`;
    ctx.fillText(String(row.projects.length), 64 + titleWidth + 12, cursor + 22);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(64, cursor + 36);
    ctx.lineTo(width - 64, cursor + 36);
    ctx.stroke();
    row.projects.forEach((project, index) => {
      const col = index % COLS;
      const line = Math.floor(index / COLS);
      const x = 64 + col * CELL_W;
      const y = cursor + 52 + line * CELL_H;
      drawMark(ctx, project, input.logos.get(project.logo) ?? null, x + (CELL_W - LOGO) / 2, y, font);
      ctx.fillStyle = "#e4e4e7";
      ctx.font = `500 13px ${font}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(trim(ctx, project.name, CELL_W - 10), x + CELL_W / 2, y + LOGO + 20);
    });
    cursor += 52 + Math.ceil(row.projects.length / COLS) * CELL_H;
  });
  ctx.textAlign = "left";

  ctx.fillStyle = "#8b93a7";
  ctx.font = `400 14px ${font}`;
  ctx.fillText("Gnoland Ecosystem Tracker · Not investment advice", 64, height - 48);
  return canvas.toDataURL("image/png");
}

function drawMark(
  ctx: CanvasRenderingContext2D,
  project: Project,
  logo: CanvasImageSource | null,
  x: number,
  y: number,
  font: string,
) {
  const cx = x + LOGO / 2;
  const cy = y + LOGO / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, LOGO / 2, 0, Math.PI * 2);
  ctx.clip();
  if (logo) {
    ctx.drawImage(logo, x, y, LOGO, LOGO);
  } else {
    const tone = letterColor(project.id);
    ctx.fillStyle = tone.bg;
    ctx.fillRect(x, y, LOGO, LOGO);
    ctx.fillStyle = tone.fg;
    ctx.font = `600 22px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(firstLetter(project.name), cx, cy);
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, LOGO / 2 - 1, 0, Math.PI * 2);
  ctx.stroke();
  if (project.network === "mainnet" || project.network === "testnet") {
    ctx.fillStyle = "#0c0c0f";
    ctx.beginPath();
    ctx.arc(x + LOGO - 6, y + LOGO - 6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = project.network === "mainnet" ? "#3ee08f" : "#f5b942";
    ctx.beginPath();
    ctx.arc(x + LOGO - 6, y + LOGO - 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function firstLetter(name: string): string {
  const letter = name.match(/\p{L}/u);
  if (letter) return letter[0];
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0) : "?";
}

function letterColor(id: string): { bg: string; fg: string } {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const tones = [
    { bg: "#ff2d78", fg: "#ffffff" },
    { bg: "#f5a524", fg: "#1a1204" },
    { bg: "#22d3a6", fg: "#04241c" },
    { bg: "#3b82f6", fg: "#ffffff" },
    { bg: "#a78bfa", fg: "#160d28" },
    { bg: "#fb7185", fg: "#2a0a12" },
    { bg: "#14b8a6", fg: "#04221e" },
    { bg: "#f97316", fg: "#2a1204" },
    { bg: "#38bdf8", fg: "#04202c" },
    { bg: "#e879f9", fg: "#2a0a2e" },
    { bg: "#eab308", fg: "#1c1604" },
    { bg: "#818cf8", fg: "#0c1028" },
  ];
  return tones[(hash >>> 0) % tones.length] ?? tones[0];
}

function trim(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let next = text;
  while (next.length > 0 && ctx.measureText(`${next}…`).width > max) next = next.slice(0, -1);
  return `${next}…`;
}

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
