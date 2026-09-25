"use client";

import { useState } from "react";
import type { Project } from "@/lib/schema";

const LETTER_COLORS = [
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
] as const;

export function ProjectFace({ project, markOnly = false }: { project: Project; markOnly?: boolean }) {
  const [broken, setBroken] = useState(false);
  const showLogo = project.logo !== "" && !broken;
  const tone = letterColor(project.id);
  return (
    <span className="face">
      <span className="logo-wrap">
        <span
          className={project.riskFlag ? "avatar is-flagged" : "avatar"}
          style={showLogo ? undefined : { background: tone.bg, color: tone.fg }}
        >
          {showLogo ? (
            <img src={project.logo} alt="" onError={() => setBroken(true)} />
          ) : (
            <span className="letter" aria-hidden>
              {firstLetter(project.name)}
            </span>
          )}
        </span>
        <NetworkDot network={project.network} />
        {project.riskFlag ? (
          <span className="flag-pin" aria-hidden>
            <FlagIcon />
          </span>
        ) : null}
      </span>
      {markOnly ? null : (
        <span className="name">
          <span className="name-text" title={project.name}>
            {project.name}
          </span>
          {project.verified ? <VerifiedMark /> : null}
        </span>
      )}
    </span>
  );
}

function firstLetter(name: string): string {
  const letter = name.match(/\p{L}/u);
  if (letter) return letter[0];
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0) : "?";
}

function colorIndex(id: string): number {
  let hash = 2166136261;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % LETTER_COLORS.length;
}

function letterColor(id: string): { bg: string; fg: string } {
  return LETTER_COLORS[colorIndex(id)];
}

export function projectTone(id: string): { bg: string; fg: string; mate: string } {
  const index = colorIndex(id);
  const tone = LETTER_COLORS[index];
  const mate = LETTER_COLORS[(index + 5) % LETTER_COLORS.length];
  return { bg: tone.bg, fg: tone.fg, mate: mate.bg };
}

export function NetworkDot({ network }: { network: Project["network"] }) {
  if (network !== "mainnet" && network !== "testnet") return null;
  const label = network === "mainnet" ? "Mainnet" : "Testnet";
  return (
    <span className={network === "mainnet" ? "net-dot net-main" : "net-dot net-test"} data-label={label}>
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function VerifiedMark() {
  return (
    <span className="verified-mark" title="Verified">
      <CheckIcon />
    </span>
  );
}

function FlagIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M2 1.2v7.6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M2.4 1.6h5.2L6.2 3.6l1.4 2H2.4" fill="currentColor" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.4 6.2 5 8.7 9.6 3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
