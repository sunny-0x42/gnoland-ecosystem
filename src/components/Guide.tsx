import type { ReactNode } from "react";

export function Guide({ title, lede, children }: { title: string; lede: string; children: ReactNode }) {
  return (
    <main className="sheet guide">
      <p className="eyebrow">
        <i className="dot" aria-hidden />
        Gnoland Ecosystem Tracker
      </p>
      <h1>{title}</h1>
      <p className="subtitle">{lede}</p>
      <article className="guide-body">{children}</article>
      <p className="guide-links">
        <a href="/networks">Networks</a>
        <a href="/tokens">Tokens</a>
        <a href="/glossary">Glossary</a>
        <a href="/">Back to the board</a>
      </p>
    </main>
  );
}
