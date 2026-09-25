"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="auth-screen">
      <section className="auth-card">
        <p className="eyebrow">
          <i className="dot" /> Data error
        </p>
        <h1>The tracker could not open</h1>
        <p>{error.message}</p>
        <button className="primary" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
