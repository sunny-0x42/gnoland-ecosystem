"use client";

import { useState, type FormEvent } from "react";
import { submitProjectAction } from "@/app/actions";
import { STATUSES } from "@/lib/constants";
import type { SubmissionInput } from "@/lib/schema";

const EMPTY: SubmissionInput = {
  name: "",
  status: "Announced",
  categories: [],
  oneLiner: "",
  team: "",
  website: "",
  github: "",
  x: "",
  discord: "",
  telegram: "",
  docs: "",
  realm: "",
  alsoPath: "",
  notes: "",
  logo: "",
  network: "",
};

export function SubmitForm({ categories }: { categories: string[] }) {
  const [draft, setDraft] = useState<SubmissionInput>(EMPTY);
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);

  function toggleCategory(category: string) {
    setDraft((current) => {
      const selected = current.categories.includes(category);
      const next = selected
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category];
      return { ...current, categories: next };
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await submitProjectAction({ ...draft, company });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="submit-done" role="status">
        <h2>Submission received</h2>
        <p>The project stays off the board until it is reviewed.</p>
        <a className="primary" href="/">
          Back to the board
        </a>
      </div>
    );
  }

  return (
    <form className="submit-form" onSubmit={(event) => void onSubmit(event)}>
      <label className="hp" aria-hidden="true">
        Company
        <input tabIndex={-1} autoComplete="off" value={company} onChange={(event) => setCompany(event.target.value)} />
      </label>
      <label className="field">
        <span>Project name</span>
        <input value={draft.name} required maxLength={120} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      </label>
      <label className="field">
        <span>One-line summary</span>
        <input
          value={draft.oneLiner}
          required
          maxLength={400}
          onChange={(event) => setDraft({ ...draft, oneLiner: event.target.value })}
        />
      </label>
      <div className="field">
        <span>Categories</span>
        <div className="chips" role="group" aria-label="Categories">
          {categories.map((category) => (
            <button
              key={category}
              className="chip"
              type="button"
              aria-pressed={draft.categories.includes(category)}
              onClick={() => toggleCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div className="form-grid">
        <label className="field">
          <span>Status</span>
          <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as SubmissionInput["status"] })}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Network</span>
          <select
            value={draft.network}
            onChange={(event) => setDraft({ ...draft, network: event.target.value as SubmissionInput["network"] })}
          >
            <option value="">Not set</option>
            <option value="mainnet">Mainnet</option>
            <option value="testnet">Testnet</option>
          </select>
        </label>
        <label className="field">
          <span>Team</span>
          <input value={draft.team} maxLength={80} onChange={(event) => setDraft({ ...draft, team: event.target.value })} />
        </label>
        <label className="field">
          <span>Logo URL</span>
          <input
            value={draft.logo}
            maxLength={300}
            placeholder="https://"
            onChange={(event) => setDraft({ ...draft, logo: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Website</span>
          <input value={draft.website} maxLength={300} onChange={(event) => setDraft({ ...draft, website: event.target.value })} />
        </label>
        <label className="field">
          <span>GitHub</span>
          <input value={draft.github} maxLength={300} onChange={(event) => setDraft({ ...draft, github: event.target.value })} />
        </label>
        <label className="field">
          <span>X</span>
          <input value={draft.x} maxLength={300} onChange={(event) => setDraft({ ...draft, x: event.target.value })} />
        </label>
        <label className="field">
          <span>Discord</span>
          <input value={draft.discord} maxLength={300} onChange={(event) => setDraft({ ...draft, discord: event.target.value })} />
        </label>
        <label className="field">
          <span>Telegram</span>
          <input value={draft.telegram} maxLength={300} onChange={(event) => setDraft({ ...draft, telegram: event.target.value })} />
        </label>
        <label className="field">
          <span>Docs</span>
          <input value={draft.docs} maxLength={300} onChange={(event) => setDraft({ ...draft, docs: event.target.value })} />
        </label>
        <label className="field">
          <span>Realm or package path</span>
          <input value={draft.realm} maxLength={200} placeholder="gno.land/r/… or gno.land/p/…" onChange={(event) => setDraft({ ...draft, realm: event.target.value })} />
        </label>
        <label className="field">
          <span>Second path</span>
          <input value={draft.alsoPath} maxLength={200} placeholder="gno.land/r/… or gno.land/p/…" onChange={(event) => setDraft({ ...draft, alsoPath: event.target.value })} />
        </label>
      </div>
      <label className="field">
        <span>Notes</span>
        <textarea value={draft.notes} maxLength={4000} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
      </label>
      <p className="hint-line">Add a website, GitHub, or realm. The listing is not public until it is reviewed.</p>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="primary" type="submit" disabled={pending}>
        {pending ? "Sending..." : "Submit project"}
      </button>
    </form>
  );
}
