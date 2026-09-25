"use client";

import { useState, useTransition, type FormEvent } from "react";
import { changePasswordAction } from "@/app/actions";

export function AccountsPanel({ usernames, currentUser }: { usernames: string[]; currentUser: string }) {
  const [accounts, setAccounts] = useState(usernames);
  const [target, setTarget] = useState(currentUser);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [nextConfirm, setNextConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const self = target === currentUser;

  function savePassword(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await changePasswordAction(target, self ? currentPassword : "", nextPassword, nextConfirm);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setAccounts(result.usernames);
      setCurrentPassword("");
      setNextPassword("");
      setNextConfirm("");
      setNotice(self ? "Your password was changed." : `Password updated for ${target}.`);
    });
  }

  return (
    <div className="desk-stack">
      <section className="category-bar">
        <div>
          <p className="category-label">Accounts</p>
          <p className="hint-line">Signed in as {currentUser}. Only these accounts can sign in.</p>
        </div>
        <div className="chips" aria-label="Admin accounts">
          {accounts.map((name) => (
            <span className="chip static" key={name}>
              {name}
              {name === currentUser ? <span className="you">You</span> : null}
            </span>
          ))}
        </div>
      </section>
      {notice ? <p className="notice">{notice}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <form className="editor account-form" onSubmit={savePassword}>
        <h2>Change password</h2>
        <label className="field">
          <span>Account</span>
          <select value={target} onChange={(event) => setTarget(event.target.value)}>
            {accounts.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        {self ? (
          <label className="field">
            <span>Current password</span>
            <input
              type="password"
              value={currentPassword}
              autoComplete="current-password"
              required
              maxLength={200}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </label>
        ) : (
          <p className="hint-line">Setting a new password for another admin does not ask for their current one.</p>
        )}
        <label className="field">
          <span>New password</span>
          <input
            type="password"
            value={nextPassword}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={200}
            onChange={(event) => setNextPassword(event.target.value)}
          />
        </label>
        <label className="field">
          <span>Confirm new password</span>
          <input
            type="password"
            value={nextConfirm}
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={200}
            onChange={(event) => setNextConfirm(event.target.value)}
          />
        </label>
        <button className="primary" type="submit" disabled={pending}>
          Save password
        </button>
      </form>
    </div>
  );
}
