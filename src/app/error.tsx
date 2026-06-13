"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="journal-page flex min-h-screen items-center justify-center bg-[var(--color-page)] px-6 text-[var(--color-ink)]">
      <section className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-app)] p-7 text-center shadow-xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Wren&apos;s Adventure
        </p>
        <h1 className="mt-3 text-3xl font-semibold">The adventure is taking a detour</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">
          The app could not load the latest itinerary. Please try again in a moment.
        </p>
        <button
          className="mt-6 h-11 w-full rounded-lg bg-[var(--color-green)] px-4 font-semibold text-white"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
