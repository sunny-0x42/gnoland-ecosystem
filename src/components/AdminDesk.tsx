"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import {
  addCategoryAction,
  deleteProjectAction,
  renameCategoryAction,
  dismissSubmissionAction,
  logoutAction,
  removeCategoryAction,
  replaceStoreAction,
  savePageAction,
  upsertProjectAction,
} from "@/app/actions";
import { STATUSES } from "@/lib/constants";
import type { Copy, Meta, PageDraft, Project, SourceLink, Store, Submission } from "@/lib/schema";
import { fold, formatDay, localDay, slugify } from "@/lib/text";

type Tab = "projects" | "page" | "submissions";
type PendingNav = { kind: "tab"; tab: Tab } | { kind: "project"; id: string | null };

function blankProject(): Project {
  return {
    id: "",
    name: "",
    status: "Announced",
    categories: ["Community"],
    score: 40,
    oneLiner: "",
    team: "",
    website: "",
    github: "",
    x: "",
    discord: "",
    telegram: "",
    docs: "",
    worksWith: [],
    realm: "",
    alsoPath: "",
    lastUpdated: localDay(),
    notes: "",
    logo: "",
    verified: false,
    network: "",
    riskFlag: false,
    riskNote: "",
  };
}

function pickPage(store: Store): PageDraft {
  return { meta: store.meta, copy: store.copy, sources: store.sources };
}

export function AdminDesk({ initial, initialSubmissions }: { initial: Store; initialSubmissions: Submission[] }) {
  const first = initial.projects[0] ?? blankProject();
  const [store, setStore] = useState(initial);
  const [tab, setTab] = useState<Tab>("projects");
  const [editingId, setEditingId] = useState<string | null>(initial.projects[0]?.id ?? null);
  const [draft, setDraft] = useState<Project>(first);
  const [base, setBase] = useState<Project>(first);
  const [idTouched, setIdTouched] = useState(Boolean(initial.projects[0]));
  const [pageDraft, setPageDraft] = useState<PageDraft>(pickPage(initial));
  const [pageBase, setPageBase] = useState<PageDraft>(pickPage(initial));
  const [listQuery, setListQuery] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pendingNav, setPendingNav] = useState<PendingNav | null>(null);
  const [pending, startTransition] = useTransition();

  const projectDirty = JSON.stringify(draft) !== JSON.stringify(base);
  const pageDirty = JSON.stringify(pageDraft) !== JSON.stringify(pageBase);
  const listed = useMemo(() => {
    const needle = fold(listQuery.trim());
    return store.projects
      .filter((project) => !needle || fold(`${project.name}\n${project.id}`).includes(needle))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "en"));
  }, [store.projects, listQuery]);

  function selectProject(id: string | null, source: Store) {
    setConfirmDelete(false);
    setReviewingId(null);
    setError(null);
    if (!id) {
      const next = blankProject();
      setEditingId(null);
      setDraft(next);
      setBase(next);
      setIdTouched(false);
      return;
    }
    const found = source.projects.find((project) => project.id === id);
    if (!found) return;
    setEditingId(found.id);
    setDraft(found);
    setBase(found);
    setIdTouched(true);
  }

  function requestProject(id: string | null) {
    if (projectDirty) setPendingNav({ kind: "project", id });
    else selectProject(id, store);
  }

  function tabDirty(which: Tab): boolean {
    if (which === "projects") return projectDirty;
    if (which === "page") return pageDirty;
    return false;
  }

  function requestTab(next: Tab) {
    if (next === tab) return;
    if (tabDirty(tab)) setPendingNav({ kind: "tab", tab: next });
    else setTab(next);
  }

  function discardAndGo() {
    if (!pendingNav) return;
    if (pendingNav.kind === "tab") {
      if (tab === "projects") setDraft(base);
      if (tab === "page") setPageDraft(pageBase);
      setTab(pendingNav.tab);
    } else {
      selectProject(pendingNav.id, store);
    }
    setPendingNav(null);
  }

  function saveProject() {
    if (!Number.isInteger(draft.score) || draft.score < 0 || draft.score > 100) {
      setError("Sort score must be an integer from 0 to 100.");
      setNotice(null);
      return;
    }
    if (draft.riskFlag && draft.riskNote.trim().length < 8) {
      setError("Describe the community-risk concern.");
      setNotice(null);
      return;
    }
    setError(null);
    const pendingReview = reviewingId;
    const creating = editingId === null;
    startTransition(async () => {
      const result = await upsertProjectAction(draft, editingId);
      if (!result.ok) {
        setError(result.error);
        setNotice(null);
        return;
      }
      let cleared = false;
      if (creating && pendingReview) {
        const removed = await dismissSubmissionAction(pendingReview);
        if (removed.ok) {
          setSubmissions(removed.submissions);
          setReviewingId(null);
          cleared = true;
        }
      }
      const saved = result.store.projects.find((project) => project.id === draft.id) ?? null;
      setStore(result.store);
      if (saved) {
        setEditingId(saved.id);
        setDraft(saved);
        setBase(saved);
        setIdTouched(true);
      }
      if (!pageDirty) {
        const page = pickPage(result.store);
        setPageDraft(page);
        setPageBase(page);
      }
      setNotice(cleared ? "Project saved. The submission was cleared." : "Project saved.");
      setConfirmDelete(false);
    });
  }

  function removeProject() {
    if (!editingId) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProjectAction(editingId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setStore(result.store);
      selectProject(result.store.projects[0]?.id ?? null, result.store);
      if (!pageDirty) {
        const page = pickPage(result.store);
        setPageDraft(page);
        setPageBase(page);
      }
      setNotice("Project deleted.");
    });
  }

  function savePage() {
    setError(null);
    startTransition(async () => {
      const result = await savePageAction(pageDraft);
      if (!result.ok) {
        setError(result.error);
        setNotice(null);
        return;
      }
      setStore(result.store);
      const page = pickPage(result.store);
      setPageDraft(page);
      setPageBase(page);
      setNotice("Page content saved.");
    });
  }

  function exportStore() {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gnoland-ecosystem-tracker.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importStore(file: File) {
    if (file.size > 1_000_000) {
      setError("File is larger than 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      let data: unknown;
      try {
        data = JSON.parse(String(reader.result ?? ""));
      } catch {
        setError("File is not JSON.");
        return;
      }
      startTransition(async () => {
        const result = await replaceStoreAction(data);
        if (!result.ok) {
          setError(result.error);
          setNotice(null);
          return;
        }
        setStore(result.store);
        const page = pickPage(result.store);
        setPageDraft(page);
        setPageBase(page);
        selectProject(result.store.projects[0]?.id ?? null, result.store);
        setNotice("Data imported.");
        setError(null);
      });
    };
    reader.readAsText(file);
  }

  function openSubmission(submission: Submission) {
    if (projectDirty) {
      setError("Save or discard the open project before reviewing a submission.");
      setNotice(null);
      return;
    }
    const baseId = slugify(submission.name) || "project";
    let id = baseId;
    let suffix = 2;
    while (store.projects.some((project) => project.id === id)) {
      id = `${baseId}-${suffix}`.slice(0, 48);
      suffix += 1;
    }
    const next: Project = {
      ...blankProject(),
      id,
      name: submission.name,
      status: submission.status,
      categories: submission.categories.filter((category) => store.categories.includes(category)),
      oneLiner: submission.oneLiner,
      team: submission.team,
      website: submission.website,
      github: submission.github,
      x: submission.x,
      discord: submission.discord,
      telegram: submission.telegram,
      docs: submission.docs,
      worksWith: [],
      realm: submission.realm,
      alsoPath: submission.alsoPath,
      notes: submission.notes,
      logo: submission.logo,
      network: submission.network,
      lastUpdated: localDay(),
    };
    if (next.categories.length === 0) next.categories = [store.categories[0] ?? "Community"];
    setConfirmDelete(false);
    setEditingId(null);
    setDraft(next);
    setBase(blankProject());
    setIdTouched(true);
    setReviewingId(submission.id);
    setTab("projects");
    setError(null);
    setNotice(`Reviewing ${submission.name}. Save the project to list it.`);
  }

  function dismissSubmission(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await dismissSubmissionAction(id);
      if (!result.ok) {
        setError(result.error);
        setNotice(null);
        return;
      }
      setSubmissions(result.submissions);
      if (reviewingId === id) setReviewingId(null);
      setNotice("Submission dismissed.");
      setError(null);
    });
  }

  function addCategory(event: FormEvent) {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      const result = await addCategoryAction(name);
      if (!result.ok) {
        setError(result.error);
        setNotice(null);
        return;
      }
      setStore(result.store);
      setCategoryName("");
      setNotice(`Added ${name}.`);
      setError(null);
    });
  }

  function startRename(name: string) {
    setEditingCategory(name);
    setCategoryDraft(name);
    setError(null);
  }

  function saveRename(event: FormEvent) {
    event.preventDefault();
    if (!editingCategory) return;
    const from = editingCategory;
    const next = categoryDraft.trim();
    if (!next || next === from) {
      setEditingCategory(null);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await renameCategoryAction(from, next);
      if (!result.ok) {
        setError(result.error);
        setNotice(null);
        return;
      }
      const saved = result.store.categories.find((item) => item.toLowerCase() === next.toLowerCase()) ?? next;
      const rewrite = (categories: string[]) => categories.map((item) => (item === from ? saved : item));
      setStore(result.store);
      setDraft((current) => ({ ...current, categories: rewrite(current.categories) }));
      setBase((current) => ({ ...current, categories: rewrite(current.categories) }));
      setSubmissions((current) =>
        current.map((submission) => ({ ...submission, categories: rewrite(submission.categories) })),
      );
      setEditingCategory(null);
      setNotice(`Renamed ${from} to ${saved}.`);
      setError(null);
    });
  }

  function removeCategory(name: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeCategoryAction(name);
      if (!result.ok) {
        setError(result.error);
        setNotice(null);
        return;
      }
      setStore(result.store);
      setDraft((current) => {
        if (!current.categories.includes(name)) return current;
        const remaining = current.categories.filter((item) => item !== name);
        return { ...current, categories: remaining.length > 0 ? remaining : [result.store.categories[0]] };
      });
      setNotice(`Removed ${name}.`);
      setError(null);
    });
  }

  return (
    <div className="page">
      <header className="hero hero-admin">
        <div className="wrap">
          <div className="title-row">
            <div>
              <p className="eyebrow">
                <i className="dot" /> Admin
              </p>
              <h1>Edit tracker</h1>
              <p className="subtitle">Saved data updated {formatDay(store.meta.updated)}.</p>
            </div>
            <div className="admin-actions">
              <a className="ghost" href="/">
                View site
              </a>
              <form action={logoutAction}>
                <button className="ghost" type="submit">
                  Log out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
      <main className="wrap admin-main">
        <div className="tabs" role="tablist" aria-label="Editor sections">
          <button className="tab" type="button" role="tab" aria-selected={tab === "projects"} onClick={() => requestTab("projects")}>
            Projects ({store.projects.length})
          </button>
          <button className="tab" type="button" role="tab" aria-selected={tab === "page"} onClick={() => requestTab("page")}>
            Page content
          </button>
          <button className="tab" type="button" role="tab" aria-selected={tab === "submissions"} onClick={() => requestTab("submissions")}>
            Submissions ({submissions.length})
          </button>
        </div>
        {pendingNav ? (
          <div className="confirm-bar" role="alertdialog" aria-label="Unsaved changes">
            <p>Unsaved changes will be lost.</p>
            <button className="ghost" type="button" onClick={() => setPendingNav(null)}>
              Stay
            </button>
            <button className="danger" type="button" onClick={discardAndGo}>
              Discard and leave
            </button>
          </div>
        ) : null}
        {notice ? <p className="notice">{notice}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        {tab === "projects" ? (
          <div className="desk-stack">
            <section className="category-bar" aria-label="Categories">
              <div>
                <p className="category-label">Categories</p>
                <p className="hint-line">Add a name, or edit one. Renaming updates every project in that category.</p>
              </div>
              <div className="chips">
                {store.categories.map((name) => {
                  const used = store.projects.some((project) => project.categories.includes(name));
                  if (editingCategory === name) {
                    return (
                      <form className="category-edit" key={name} onSubmit={saveRename}>
                        <label className="sr-only" htmlFor="rename-category">
                          Rename {name}
                        </label>
                        <input
                          id="rename-category"
                          value={categoryDraft}
                          maxLength={24}
                          autoFocus
                          onChange={(event) => setCategoryDraft(event.target.value)}
                        />
                        <button className="primary" type="submit" disabled={pending || categoryDraft.trim() === ""}>
                          Save
                        </button>
                        <button className="ghost" type="button" onClick={() => setEditingCategory(null)}>
                          Cancel
                        </button>
                      </form>
                    );
                  }
                  return (
                    <span className="chip static" key={name}>
                      {name}
                      <button className="chip-x" type="button" aria-label={`Rename ${name}`} onClick={() => startRename(name)}>
                        Edit
                      </button>
                      {used ? null : (
                        <button className="chip-x" type="button" aria-label={`Remove ${name}`} onClick={() => removeCategory(name)}>
                          ×
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
              <form className="category-add" onSubmit={addCategory}>
                <label className="sr-only" htmlFor="new-category">
                  New category
                </label>
                <input
                  id="new-category"
                  value={categoryName}
                  maxLength={24}
                  placeholder="New category"
                  onChange={(event) => setCategoryName(event.target.value)}
                />
                <button className="primary" type="submit" disabled={pending || categoryName.trim() === ""}>
                  Add
                </button>
              </form>
            </section>
          <div className="desk">
            <aside className="plist">
              <button className="primary" type="button" onClick={() => requestProject(null)}>
                Add project
              </button>
              <input
                className="plist-search"
                value={listQuery}
                placeholder="Filter the list"
                aria-label="Filter the list"
                onChange={(event) => setListQuery(event.target.value)}
              />
              {listed.map((project) => (
                <button
                  key={project.id}
                  className="row-btn"
                  type="button"
                  aria-current={editingId === project.id ? "true" : undefined}
                  onClick={() => requestProject(project.id)}
                >
                  <span>
                    <strong>{project.name}</strong>
                    <small>{project.status}</small>
                  </span>
                </button>
              ))}
            </aside>
            <ProjectForm
              categoryOptions={store.categories}
              draft={draft}
              isNew={editingId === null}
              pending={pending}
              confirmDelete={confirmDelete}
              onDraft={setDraft}
              onName={(name) =>
                setDraft((current) => {
                  const next = { ...current, name };
                  if (!idTouched) next.id = slugify(name);
                  return next;
                })
              }
              onId={(id) => {
                setIdTouched(true);
                setDraft((current) => ({ ...current, id }));
              }}
              onSave={saveProject}
              onAskDelete={() => setConfirmDelete(true)}
              onCancelDelete={() => setConfirmDelete(false)}
              onDelete={removeProject}
            />
          </div>
          </div>
        ) : tab === "page" ? (
          <PageForm
            draft={pageDraft}
            pending={pending}
            onChange={setPageDraft}
            onSave={savePage}
            onExport={exportStore}
            onImport={importStore}
          />
        ) : (
          <SubmissionInbox items={submissions} pending={pending} onOpen={openSubmission} onDismiss={dismissSubmission} />
        )}
      </main>
    </div>
  );
}

function ProjectForm({
  categoryOptions,
  draft,
  isNew,
  pending,
  confirmDelete,
  onDraft,
  onName,
  onId,
  onSave,
  onAskDelete,
  onCancelDelete,
  onDelete,
}: {
  categoryOptions: string[];
  draft: Project;
  isNew: boolean;
  pending: boolean;
  confirmDelete: boolean;
  onDraft: (project: Project) => void;
  onName: (name: string) => void;
  onId: (id: string) => void;
  onSave: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  return (
    <form
      className="editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <h2>{isNew ? "New project" : draft.name || "Edit project"}</h2>
      <div className="form-grid">
        <label className="field">
          <span>Name</span>
          <input value={draft.name} onChange={(event) => onName(event.target.value)} required maxLength={120} />
        </label>
        <label className="field">
          <span>ID</span>
          <input value={draft.id} onChange={(event) => onId(event.target.value)} required maxLength={48} spellCheck={false} />
        </label>
        <label className="field">
          <span>Status</span>
          <select
            value={draft.status}
            onChange={(event) => onDraft({ ...draft, status: event.target.value as Project["status"] })}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <div className="field span-2">
          <span>Categories</span>
          <div className="chips" role="group" aria-label="Categories">
            {categoryOptions.map((category) => {
              const selected = draft.categories.includes(category);
              return (
                <button
                  key={category}
                  className="chip"
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    if (selected && draft.categories.length === 1) return;
                    const categories = selected
                      ? draft.categories.filter((item) => item !== category)
                      : categoryOptions.filter((item) => item === category || draft.categories.includes(item));
                    onDraft({ ...draft, categories });
                  }}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
        <label className="field">
          <span>Sort score (0–100)</span>
          <input
            type="number"
            min={0}
            max={100}
            step={1}
            value={draft.score}
            onChange={(event) => onDraft({ ...draft, score: Number(event.target.value) })}
          />
        </label>
        <label className="field">
          <span>Team</span>
          <input value={draft.team} maxLength={80} onChange={(event) => onDraft({ ...draft, team: event.target.value })} />
        </label>
        <label className="field">
          <span>Last updated</span>
          <input
            type="date"
            value={draft.lastUpdated}
            onChange={(event) => onDraft({ ...draft, lastUpdated: event.target.value })}
            required
          />
        </label>
        <label className="field span-2">
          <span>One-line summary</span>
          <input
            value={draft.oneLiner}
            maxLength={400}
            onChange={(event) => onDraft({ ...draft, oneLiner: event.target.value })}
            required
          />
        </label>
        <label className="field">
          <span>Website</span>
          <input
            value={draft.website}
            placeholder="https://"
            onChange={(event) => onDraft({ ...draft, website: event.target.value })}
          />
        </label>
        <label className="field">
          <span>GitHub</span>
          <input value={draft.github} placeholder="https://" onChange={(event) => onDraft({ ...draft, github: event.target.value })} />
        </label>
        <label className="field">
          <span>X</span>
          <input value={draft.x} placeholder="https://" onChange={(event) => onDraft({ ...draft, x: event.target.value })} />
        </label>
        <label className="field">
          <span>Discord</span>
          <input value={draft.discord} placeholder="https://" onChange={(event) => onDraft({ ...draft, discord: event.target.value })} />
        </label>
        <label className="field">
          <span>Telegram</span>
          <input value={draft.telegram} placeholder="https://" onChange={(event) => onDraft({ ...draft, telegram: event.target.value })} />
        </label>
        <label className="field">
          <span>Docs</span>
          <input value={draft.docs} placeholder="https://" onChange={(event) => onDraft({ ...draft, docs: event.target.value })} />
        </label>
        <label className="field span-2">
          <span>Works with (project ids, comma separated)</span>
          <input
            value={draft.worksWith.join(", ")}
            onChange={(event) =>
              onDraft({
                ...draft,
                worksWith: event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter((item) => item.length > 0),
              })
            }
          />
        </label>
        <label className="field">
          <span>Realm or package path</span>
          <input value={draft.realm} placeholder="gno.land/r/… or gno.land/p/…" onChange={(event) => onDraft({ ...draft, realm: event.target.value })} />
        </label>
        <label className="field">
          <span>Second path</span>
          <input value={draft.alsoPath} placeholder="gno.land/r/… or gno.land/p/…" onChange={(event) => onDraft({ ...draft, alsoPath: event.target.value })} />
        </label>
        <label className="field span-2">
          <span>Notes</span>
          <textarea value={draft.notes} maxLength={4000} onChange={(event) => onDraft({ ...draft, notes: event.target.value })} />
        </label>
        <label className="field span-2">
          <span>Logo</span>
          <input
            value={draft.logo}
            placeholder="https://… or /logos/name.png"
            onChange={(event) => onDraft({ ...draft, logo: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Network</span>
          <select
            value={draft.network}
            onChange={(event) => onDraft({ ...draft, network: event.target.value as Project["network"] })}
          >
            <option value="">Not set</option>
            <option value="mainnet">Mainnet</option>
            <option value="testnet">Testnet</option>
          </select>
        </label>
        <label className="check span-2">
          <input
            type="checkbox"
            checked={draft.verified}
            onChange={(event) => onDraft({ ...draft, verified: event.target.checked })}
          />
          <span>Verified — green check on the public board</span>
        </label>
        <label className="check span-2">
          <input
            type="checkbox"
            checked={draft.riskFlag}
            onChange={(event) => onDraft({ ...draft, riskFlag: event.target.checked })}
          />
          <span>Red flag — suspected risk to the community</span>
        </label>
        {draft.riskFlag ? (
          <label className="field span-2">
            <span>Why this flag is on</span>
            <textarea
              value={draft.riskNote}
              maxLength={800}
              required
              onChange={(event) => onDraft({ ...draft, riskNote: event.target.value })}
            />
          </label>
        ) : null}
      </div>
      <p className="hint-line">
        Sort score only orders projects inside a category. It is not an investment score, TVL, or price. A project keeps at
        least one category. Leave the logo blank and the board shows the first letter on a colored circle. The green check means the project is
        verified. Turn the red flag on only for a concrete concern, and write the reason. The note is public.
      </p>
      <div className="row-actions">
        <button className="primary" type="submit" disabled={pending}>
          {pending ? "Saving..." : isNew ? "Create project" : "Save changes"}
        </button>
        {isNew ? null : confirmDelete ? (
          <>
            <button className="danger" type="button" disabled={pending} onClick={onDelete}>
              Delete forever
            </button>
            <button className="ghost" type="button" onClick={onCancelDelete}>
              Cancel
            </button>
          </>
        ) : (
          <button className="danger" type="button" onClick={onAskDelete}>
            Delete project
          </button>
        )}
      </div>
    </form>
  );
}

function SubmissionInbox({
  items,
  pending,
  onOpen,
  onDismiss,
}: {
  items: Submission[];
  pending: boolean;
  onOpen: (submission: Submission) => void;
  onDismiss: (id: string) => void;
}) {
  if (items.length === 0) return <p className="empty">No submissions.</p>;
  return (
    <div className="submission-list">
      {items.map((submission) => (
        <article className="submission" key={submission.id}>
          <h2>{submission.name}</h2>
          <p>
            {submission.categories.join(" · ")} · {submission.status}
            {submission.network ? ` · ${submission.network}` : ""}
          </p>
          <p>{submission.oneLiner}</p>
          {submission.team ? <p>Team: {submission.team}</p> : null}
          <div className="links">
            {submission.website ? (
              <a href={submission.website} target="_blank" rel="noreferrer">
                Website
              </a>
            ) : null}
            {submission.github ? (
              <a href={submission.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
            ) : null}
            {submission.x ? (
              <a href={submission.x} target="_blank" rel="noreferrer">
                X
              </a>
            ) : null}
            {submission.realm ? <span>Realm: {submission.realm}</span> : null}
          </div>
          {submission.notes ? <p className="notes">{submission.notes}</p> : null}
          <div className="row-actions">
            <button className="primary" type="button" disabled={pending} onClick={() => onOpen(submission)}>
              Open in editor
            </button>
            <button className="ghost" type="button" disabled={pending} onClick={() => onDismiss(submission.id)}>
              Dismiss
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function PageForm({
  draft,
  pending,
  onChange,
  onSave,
  onExport,
  onImport,
}: {
  draft: PageDraft;
  pending: boolean;
  onChange: (draft: PageDraft) => void;
  onSave: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}) {
  function setMeta(patch: Partial<Meta>) {
    onChange({ ...draft, meta: { ...draft.meta, ...patch } });
  }
  function setCopy(patch: Partial<Copy>) {
    onChange({ ...draft, copy: { ...draft.copy, ...patch } });
  }
  function setSource(index: number, patch: Partial<SourceLink>) {
    const sources = draft.sources.map((source, item) => (item === index ? { ...source, ...patch } : source));
    onChange({ ...draft, sources });
  }

  return (
    <form
      className="editor"
      onSubmit={(event) => {
        event.preventDefault();
        onSave();
      }}
    >
      <h2>Page content</h2>
      <div className="form-grid">
        <label className="field">
          <span>Title</span>
          <input value={draft.copy.title} maxLength={80} onChange={(event) => setCopy({ title: event.target.value })} />
        </label>
        <label className="field">
          <span>Displayed update date</span>
          <input type="date" value={draft.meta.updated} onChange={(event) => setMeta({ updated: event.target.value })} />
        </label>
        <label className="field span-2">
          <span>Eyebrow</span>
          <input value={draft.copy.eyebrow} maxLength={180} onChange={(event) => setCopy({ eyebrow: event.target.value })} />
        </label>
        <label className="field span-2">
          <span>Subtitle</span>
          <textarea value={draft.copy.subtitle} maxLength={320} onChange={(event) => setCopy({ subtitle: event.target.value })} />
        </label>
        <label className="field span-2">
          <span>Legend</span>
          <input value={draft.copy.legend} maxLength={280} onChange={(event) => setCopy({ legend: event.target.value })} />
        </label>
        <label className="field">
          <span>Search placeholder</span>
          <input
            value={draft.copy.searchPlaceholder}
            maxLength={80}
            onChange={(event) => setCopy({ searchPlaceholder: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Empty-state sentence</span>
          <input value={draft.copy.empty} maxLength={140} onChange={(event) => setCopy({ empty: event.target.value })} />
        </label>
        <label className="field">
          <span>Footer line</span>
          <input value={draft.copy.footerNote} maxLength={180} onChange={(event) => setCopy({ footerNote: event.target.value })} />
        </label>
        <label className="field">
          <span>Update hint</span>
          <input value={draft.copy.updateHint} maxLength={220} onChange={(event) => setCopy({ updateHint: event.target.value })} />
        </label>
        <label className="field">
          <span>Chain</span>
          <input value={draft.meta.chain} maxLength={40} onChange={(event) => setMeta({ chain: event.target.value })} />
        </label>
        <label className="field">
          <span>Mainnet</span>
          <input type="date" value={draft.meta.mainnet} onChange={(event) => setMeta({ mainnet: event.target.value })} />
        </label>
        <label className="field span-2">
          <span>RPC</span>
          <input value={draft.meta.rpc} onChange={(event) => setMeta({ rpc: event.target.value })} />
        </label>
      </div>
      <h2>Sources</h2>
      <div className="stack">
        {draft.sources.map((source, index) => (
          <div className="source-row" key={index}>
            <input
              aria-label={`Source label ${index + 1}`}
              value={source.label}
              onChange={(event) => setSource(index, { label: event.target.value })}
            />
            <input
              aria-label={`Source URL ${index + 1}`}
              value={source.href}
              onChange={(event) => setSource(index, { href: event.target.value })}
            />
            <button
              className="ghost"
              type="button"
              onClick={() => onChange({ ...draft, sources: draft.sources.filter((_, item) => item !== index) })}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          className="ghost"
          type="button"
          onClick={() => onChange({ ...draft, sources: [...draft.sources, { label: "", href: "" }] })}
        >
          Add source
        </button>
      </div>
      <div className="row-actions">
        <button className="primary" type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save page content"}
        </button>
        <button className="ghost" type="button" onClick={onExport}>
          Export JSON
        </button>
        <label className="ghost">
          Import JSON
          <input
            className="sr-only"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              if (!window.confirm("Replace all saved data with this file?")) return;
              onImport(file);
            }}
          />
        </label>
      </div>
    </form>
  );
}
