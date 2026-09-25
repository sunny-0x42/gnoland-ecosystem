"use client";

import { useActionState } from "react";
import { loginAction, setupAction } from "@/app/actions";
import { ADMIN_USERNAME } from "@/lib/constants";

export function LoginPanel({ mode }: { mode: "setup" | "ready" | "broken" }) {
  if (mode === "broken") {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <p className="eyebrow">
            <i className="dot" /> Gnoland Ecosystem Tracker
          </p>
          <h1>Admin lock is unreadable</h1>
          <p>
            data/auth.json is damaged. Delete that file and reload to choose a new password. Project data lives in
            data/store.json.
          </p>
          <p>
            <a className="ghost" href="/">
              Back to the board
            </a>
          </p>
        </section>
      </main>
    );
  }
  return <AuthForm mode={mode} />;
}

function AuthForm({ mode }: { mode: "setup" | "ready" }) {
  const action = mode === "setup" ? setupAction : loginAction;
  const [state, formAction, pending] = useActionState(action, null);
  const failed = state && !state.ok ? state.error : null;

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <p className="eyebrow">
          <i className="dot" /> Gnoland Ecosystem Tracker
        </p>
        <h1>{mode === "setup" ? "Create admin login" : "Admin sign in"}</h1>
        <p>
          {mode === "setup"
            ? "The password is stored only on this machine, as a hash. It edits the project list and the page copy."
            : "The admin account edits tracker content. The public board stays open."}
        </p>
        <form action={formAction}>
          <label className="field">
            <span>Account</span>
            <input name="username" defaultValue={ADMIN_USERNAME} autoComplete="username" required readOnly={mode === "setup"} />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              autoComplete={mode === "setup" ? "new-password" : "current-password"}
              required
              minLength={mode === "setup" ? 8 : 1}
              maxLength={200}
            />
          </label>
          {mode === "setup" ? (
            <label className="field">
              <span>Confirm password</span>
              <input name="confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={200} />
            </label>
          ) : null}
          {failed ? <p className="auth-error">{failed}</p> : null}
          <button className="primary" type="submit" disabled={pending}>
            {pending ? "Checking..." : mode === "setup" ? "Create and enter" : "Sign in"}
          </button>
        </form>
        <p>
          <a href="/">Back to the board</a>
        </p>
      </section>
    </main>
  );
}
