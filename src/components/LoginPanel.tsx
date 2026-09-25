"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions";

export function LoginPanel({ mode }: { mode: "setup" | "ready" | "broken" }) {
  if (mode === "broken") {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <p className="eyebrow">
            <i className="dot" /> Gnoland Ecosystem Tracker
          </p>
          <h1>Admin lock is unreadable</h1>
          <p>data/auth.json is damaged, so the existing admin accounts cannot sign in from this page.</p>
          <p>
            <a className="ghost" href="/">
              Back to the board
            </a>
          </p>
        </section>
      </main>
    );
  }
  if (mode === "setup") {
    return (
      <main className="auth-screen">
        <section className="auth-card">
          <p className="eyebrow">
            <i className="dot" /> Gnoland Ecosystem Tracker
          </p>
          <h1>Admin sign in</h1>
          <p>This copy has no admin accounts. New accounts cannot be created here.</p>
          <p>
            <a className="ghost" href="/">
              Back to the board
            </a>
          </p>
        </section>
      </main>
    );
  }
  return <AuthForm />;
}

function AuthForm() {
  const [state, formAction, pending] = useActionState(loginAction, null);
  const failed = state && !state.ok ? state.error : null;

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <p className="eyebrow">
          <i className="dot" /> Gnoland Ecosystem Tracker
        </p>
        <h1>Admin sign in</h1>
        <p>Only an existing admin account can sign in. The public board stays open.</p>
        <form action={formAction}>
          <label className="field">
            <span>Account</span>
            <input name="username" autoComplete="username" required minLength={2} maxLength={32} />
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" required minLength={1} maxLength={200} />
          </label>
          {failed ? <p className="auth-error">{failed}</p> : null}
          <button className="primary" type="submit" disabled={pending}>
            {pending ? "Checking..." : "Sign in"}
          </button>
        </form>
        <p>
          <a href="/">Back to the board</a>
        </p>
      </section>
    </main>
  );
}
