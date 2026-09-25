"use client";

import { useEffect, useRef, useState } from "react";
import { ProjectFace, VerifiedMark } from "@/components/Logo";
import type { Project } from "@/lib/schema";
import { teamParts } from "@/lib/board";
import { externalHref, formatDay, linkify, pathKind, realmHref } from "@/lib/text";

export function Drawer({
  project,
  related,
  onClose,
  onOpen,
  onTeam,
}: {
  project: Project;
  related: Project[];
  onClose: () => void;
  onOpen: (id: string) => void;
  onTeam: (team: string) => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState("");
  const [copyError, setCopyError] = useState(false);
  useEffect(() => {
    const app = document.getElementById("app");
    app?.setAttribute("inert", "");
    const dialog = dialogRef.current;
    dialog?.parentElement?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => app?.removeAttribute("inert");
  }, []);

  useEffect(() => {
    const root = dialogRef.current?.parentElement;
    if (!root) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Tab" || !root) return;
      const items = root.querySelectorAll<HTMLElement>("a[href], button, input, textarea, select");
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function copyPath(value: string) {
    try {
      await copyText(value);
      setCopied(value);
      setCopyError(false);
      window.setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <div className="modal-root">
      <button className="overlay" type="button" aria-label="Close details" onClick={onClose} />
      <button className="modal-close" type="button" data-autofocus aria-label="Close" onClick={onClose}>
        ×
      </button>
      <div ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
        <ProjectFace project={project} markOnly />
        <p className="drawer-kicker">{project.categories.join(" · ")}</p>
        <h2 id="drawer-title">
          {project.name}
          {project.verified ? <VerifiedMark /> : null}
        </h2>
        <p className="modal-score">
          {project.score}
          <span>/100</span>
        </p>
        <span className="badge-row">
          <span className="badge" data-status={project.status}>
            {project.status}
          </span>
          {project.network === "mainnet" ? <span className="net-word">Mainnet</span> : null}
          {project.network === "testnet" ? <span className="net-word">Testnet</span> : null}
        </span>
        {project.riskFlag ? (
          <div className="risk-banner" role="note">
            <strong>Community risk</strong>
            <p>{project.riskNote}</p>
          </div>
        ) : null}
        <p className="one-liner">{project.oneLiner}</p>
        {related.length > 0 ? (
          <p className="works-with">
            Works with{" "}
            {related.map((item) => (
              <button key={item.id} type="button" onClick={() => onOpen(item.id)}>
                {item.name}
              </button>
            ))}
          </p>
        ) : null}
        <SocialRow project={project} />
        <dl className="meta-list">
          <div>
            <dt>Team</dt>
            <dd>
              {teamParts(project.team).length === 0
                ? "—"
                : teamParts(project.team).map((part) => (
                    <button key={part} className="text-link" type="button" onClick={() => onTeam(part)}>
                      {part}
                    </button>
                  ))}
            </dd>
          </div>
          {project.realm || project.alsoPath ? (
            <>
              {project.realm ? <PathRow path={project.realm} copied={copied} failed={copyError} onCopy={copyPath} /> : null}
              {project.alsoPath ? <PathRow path={project.alsoPath} copied={copied} failed={copyError} onCopy={copyPath} /> : null}
            </>
          ) : (
            <div>
              <dt>Off-chain</dt>
              <dd>No realm or package path.</dd>
            </div>
          )}
          <div>
            <dt>Updated</dt>
            <dd>{formatDay(project.lastUpdated)}</dd>
          </div>
          <div>
            <dt>Notes</dt>
            <dd className="notes">
              <RichText text={project.notes} />
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function PathRow({
  path,
  copied,
  failed,
  onCopy,
}: {
  path: string;
  copied: string;
  failed: boolean;
  onCopy: (value: string) => void;
}) {
  const href = realmHref(path);
  const label = pathKind(path);
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer">
            {path}
          </a>
        ) : (
          path
        )}
        <div>
          <button className="ghost copy-btn" type="button" onClick={() => onCopy(path)}>
            {copied === path ? "Copied" : `Copy ${label.toLowerCase()}`}
          </button>
        </div>
        {failed ? <p className="form-error">Could not copy.</p> : null}
      </dd>
    </div>
  );
}

function SocialRow({ project }: { project: Project }) {
  const links = [
    { label: "Website", href: externalHref(project.website), icon: <GlobeIcon /> },
    { label: "GitHub", href: externalHref(project.github), icon: <GitHubIcon /> },
    { label: "X", href: externalHref(project.x), icon: <XIcon /> },
    { label: "Docs", href: externalHref(project.docs), icon: <DocsIcon /> },
    { label: "Discord", href: externalHref(project.discord), icon: <DiscordIcon /> },
    { label: "Telegram", href: externalHref(project.telegram), icon: <TelegramIcon /> },
  ].filter((link) => link.href);
  if (links.length === 0) return null;
  return (
    <div className="socials">
      {links.map((link) => (
        <a key={link.label} href={link.href ?? undefined} target="_blank" rel="noreferrer" aria-label={link.label} title={link.label}>
          {link.icon}
        </a>
      ))}
    </div>
  );
}

function DocsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M4 2.5h5.2L12 5.2V13.5H4v-11Z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9 2.6V5.4h2.8M5.6 8h4.8M5.6 10.4h3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.6 8h10.8M8 2.6c1.6 1.5 2.4 3.4 2.4 5.4S9.6 11.9 8 13.4C6.4 11.9 5.6 10 5.6 8S6.4 4.1 8 2.6Z" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 1.4A6.6 6.6 0 0 0 5.7 14.2c.3.1.4-.1.4-.3v-1.1c-1.7.4-2-.8-2-.8-.3-.7-.7-.9-.7-.9-.6-.4 0-.4 0-.4.6 0 1 .6 1 .6.5.9 1.4.7 1.7.5.1-.4.2-.7.4-.8-1.4-.2-2.8-.7-2.8-3.1 0-.7.2-1.2.6-1.7-.1-.2-.3-.8.1-1.7 0 0 .5-.2 1.8.7a6 6 0 0 1 3.2 0c1.2-.9 1.8-.7 1.8-.7.4.9.2 1.5.1 1.7.4.5.6 1 .6 1.7 0 2.4-1.4 2.9-2.8 3.1.2.2.4.6.4 1.2v1.7c0 .2.1.4.4.3A6.6 6.6 0 0 0 8 1.4Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M9.3 7.1 14.2 1.5h-1.2L8.8 6.3 5.3 1.5H1.6l5.1 7.4L1.6 14.5h1.2l4.5-5.2 3.6 5.2h3.7L9.3 7.1Zm-1.6 1.8-.5-.7-4.1-5.9h1.8l3.3 4.8.5.7 4.3 6.2H11L7.7 8.9Z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M13.2 3.4A12 12 0 0 0 10.3 2.5l-.2.4a11 11 0 0 1 2.6.8 10 10 0 0 0-8.4 0 8 8 0 0 1 2.6-.8l-.2-.4a12 12 0 0 0-2.9.9C1.6 6.2 1 8.9 1.2 11.6a12 12 0 0 0 3.6 1.8l.5-.8a8 8 0 0 1-1.3-.6l.3-.2a8.6 8.6 0 0 0 7.4 0l.3.2a8 8 0 0 1-1.3.6l.5.8a12 12 0 0 0 3.6-1.8c.4-3-.7-5.6-1.6-8.2ZM6.1 10.3c-.7 0-1.3-.7-1.3-1.5s.6-1.5 1.3-1.5 1.3.7 1.3 1.5-.6 1.5-1.3 1.5Zm3.8 0c-.7 0-1.3-.7-1.3-1.5s.6-1.5 1.3-1.5 1.3.7 1.3 1.5-.6 1.5-1.3 1.5Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M14.6 2.3 1.8 7.2c-.9.3-.9.8-.2 1l3.3 1 7.6-4.8c.4-.2.7 0 .4.2l-6.2 5.6-.2 3.2c.3 0 .5-.1.6-.3l1.6-1.5 3.3 2.4c.6.3 1 .2 1.2-.6l2.1-10c.2-.9-.3-1.3-.9-1.1Z" />
    </svg>
  );
}

async function copyText(value: string): Promise<void> {
  const write = navigator.clipboard?.writeText(value);
  if (write) {
    const result = await Promise.race([
      write.then(() => "ok" as const).catch(() => "fail" as const),
      new Promise<"fail">((resolve) => window.setTimeout(() => resolve("fail"), 700)),
    ]);
    if (result === "ok") return;
  }
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "0";
  area.style.top = "0";
  document.body.appendChild(area);
  area.focus();
  area.select();
  const ok = document.execCommand("copy");
  area.remove();
  if (!ok) throw new Error("copy failed");
}

function RichText({ text }: { text: string }) {
  if (!text) return "—";
  const parts = linkify(text);
  return parts.map((part, index) =>
    part.type === "link" ? (
      <a key={`${part.value}-${index}`} href={part.value} target="_blank" rel="noreferrer">
        {part.value}
      </a>
    ) : (
      <span key={`${index}-${part.value.slice(0, 16)}`}>{part.value}</span>
    ),
  );
}
