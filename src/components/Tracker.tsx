"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Drawer } from "@/components/Drawer";
import { GnotTape } from "@/components/GnotTape";
import { Infographic } from "@/components/Infographic";
import { ProjectFace } from "@/components/Logo";
import { categoryRows, filterProjects } from "@/lib/board";
import { CATEGORY_BLURBS } from "@/lib/constants";
import type { Store } from "@/lib/schema";
import { formatDay } from "@/lib/text";

export function Tracker({ store }: { store: Store }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [team, setTeam] = useState("");
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const lastCard = useRef<HTMLButtonElement | null>(null);

  const visible = useMemo(
    () => filterProjects(store.projects, query, category, flaggedOnly, verifiedOnly, team),
    [store.projects, query, category, flaggedOnly, verifiedOnly, team],
  );
  const rows = useMemo(
    () => categoryRows(store.categories, visible, category),
    [store.categories, visible, category],
  );
  const total = store.projects.length;
  const open = openId ? (store.projects.find((project) => project.id === openId) ?? null) : null;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target;
      const typing =
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (event.key === "/" && !typing && !openId) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key === "Escape" && openId) {
        event.preventDefault();
        setOpenId(null);
        lastCard.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openId]);

  useEffect(() => {
    if (category !== "All" && !store.categories.includes(category)) setCategory("All");
  }, [category, store.categories]);

  function openProject(id: string, card?: HTMLButtonElement) {
    if (card) lastCard.current = card;
    setOpenId(id);
  }

  function chooseTeam(name: string) {
    setTeam(name);
    setCategory("All");
    setOpenId(null);
  }

  function closeDrawer() {
    setOpenId(null);
    lastCard.current?.focus();
  }

  return (
    <div className="page">
      <a className="skip" href="#board">
        Skip to board
      </a>
      <div id="app">
        <main className="sheet" id="board">
          <GnotTape />
          <div className="board">
            <header className="board-head">
              <div>
                <p className="eyebrow">
                  <i className="dot" aria-hidden />
                  {store.copy.eyebrow}
                </p>
                <h1>{store.copy.title}</h1>
                <p className="subtitle">
                  {store.copy.subtitle}{" "}
                  <span className="tally">
                    {visible.length === total ? `${total} projects` : `${visible.length} of ${total}`}
                  </span>
                </p>
                <div className="chain-strip">
                  <p>
                    <b>{store.meta.chain}</b>
                    <span>RPC {store.meta.rpc}</span>
                    <span>Mainnet {formatDay(store.meta.mainnet)}</span>
                  </p>
                  <p>Mainnet has no faucet. Test coins come from Faucet Hub or a local gnodev chain.</p>
                </div>
                <p className="primer">
                  Gno.land is a smart-contract network. Gno is a blockchain interpretation of Go: realms under /r/ keep
                  state, and pure packages under /p/ are libraries.
                </p>
                <p className="primer">
                  To build, install the toolchain and run gnodev locally. Community examples are not an official API.{" "}
                  <a href="https://docs.gno.land/builders/install" target="_blank" rel="noreferrer">
                    Install
                  </a>
                  {" · "}
                  <a href="https://docs.gno.land/builders/getting-started" target="_blank" rel="noreferrer">
                    Getting started
                  </a>
                </p>
              </div>
              <div className="updated">
                <span className="label">Updated</span>
                <time dateTime={store.meta.updated}>{formatDay(store.meta.updated)}</time>
                <Infographic
                  title={store.copy.title}
                  updated={store.meta.updated}
                  chain={store.meta.chain}
                  projects={visible}
                  total={total}
                  rows={rows}
                  filterLabel={[category !== "All" ? category : "", team ? `Team ${team}` : "", query.trim()].filter(Boolean).join(" · ")}
                />
              </div>
            </header>
            <nav className="start-row" aria-label="Start here">
              <span>Start here</span>
              <button type="button" onClick={() => openProject("adena")}>Adena</button>
              <a href="https://docs.gno.land/" target="_blank" rel="noreferrer">Docs</a>
              <button type="button" onClick={() => openProject("playground")}>Playground</button>
              <button type="button" onClick={() => openProject("faucet")}>Faucet Hub</button>
              <button type="button" onClick={() => openProject("gnoscan")}>Gnoscan</button>
            </nav>
            <div className="toolbar">
              <form className="search" role="search" onSubmit={(event) => event.preventDefault()}>
                <label className="sr-only" htmlFor="q">
                  {store.copy.searchPlaceholder}
                </label>
                <SearchIcon />
                <input
                  id="q"
                  ref={searchRef}
                  value={query}
                  placeholder={store.copy.searchPlaceholder}
                  onChange={(event) => setQuery(event.target.value)}
                  autoComplete="off"
                />
                <span className="kbd-hint">
                  <kbd>/</kbd>
                </span>
              </form>
              <div className="chips" role="toolbar" aria-label="Filter">
                {team ? (
                  <button className="chip on" type="button" onClick={() => setTeam("")}>
                    Team: {team}
                  </button>
                ) : null}
                {["All", ...store.categories].map((item) => (
                  <button
                    key={item}
                    className="chip"
                    type="button"
                    aria-pressed={category === item}
                    onClick={() => setCategory(item)}
                  >
                    {item === "All" ? "All" : item}
                  </button>
                ))}
                <button
                  className="chip verified"
                  type="button"
                  aria-pressed={verifiedOnly}
                  onClick={() => setVerifiedOnly((current) => !current)}
                >
                  Verified
                </button>
                <button
                  className="chip risk"
                  type="button"
                  aria-pressed={flaggedOnly}
                  onClick={() => setFlaggedOnly((current) => !current)}
                >
                  Flagged
                </button>
              </div>
            </div>
            {visible.length === 0 ? (
              <p className="empty" role="status">
                {store.copy.empty}
              </p>
            ) : null}
            {rows.map((row) => (
              <section key={row.category} className="cat-row" aria-label={row.category}>
                <div className="mark">
                  <strong>{row.category}</strong>
                  <em>{row.projects.length}</em>
                </div>
                <div className="lane">
                  {CATEGORY_BLURBS[row.category] ? <p className="lane-blurb">{CATEGORY_BLURBS[row.category]}</p> : null}
                  {row.projects.map((project) => (
                    <button
                      key={project.id}
                      className="proj"
                      type="button"
                      aria-current={openId === project.id ? "true" : undefined}
                      aria-label={`${project.name}, ${project.status}${project.network === "mainnet" ? ", live on mainnet" : ""}${project.network === "testnet" ? ", on testnet" : ""}${project.verified ? ", verified" : ""}${project.riskFlag ? ", community risk flag" : ""}`}
                      onClick={(event) => openProject(project.id, event.currentTarget)}
                    >
                      <ProjectFace project={project} />
                    </button>
                  ))}
                </div>
              </section>
            ))}
            <div className="legend">
              <p>{store.copy.legend}</p>
              <p className="guide-links">
                <a href="/networks">Networks</a>
                <a href="/tokens">Tokens</a>
                <a href="/glossary">Glossary</a>
                <span>{store.copy.footerNote}</span>
              </p>
            </div>
          </div>
          <section className="submit-cta">
            <div>
              <h2>Submit a project</h2>
              <p>Teams can send public details for a Gno.land project. A listing stays off the board until it is reviewed.</p>
            </div>
            <a className="primary" href="/submit">
              Submit
            </a>
          </section>
        </main>
        <footer className="foot sheet">
          {store.copy.updateHint && store.copy.updateHint !== "Sign in as admin to add or edit projects." ? (
            <p className="hint">{store.copy.updateHint}</p>
          ) : null}
          <ul className="sources">
            {store.sources.map((source) => (
              <li key={`${source.label}-${source.href}`}>
                <a href={source.href} target="_blank" rel="noreferrer">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </footer>
      </div>
      {open ? (
        <Drawer
          key={open.id}
          project={open}
          related={open.worksWith.flatMap((id) => {
            const found = store.projects.find((item) => item.id === id);
            return found ? [found] : [];
          })}
          onClose={closeDrawer}
          onOpen={openProject}
          onTeam={chooseTeam}
        />
      ) : null}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.5 10.5 L14 14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
