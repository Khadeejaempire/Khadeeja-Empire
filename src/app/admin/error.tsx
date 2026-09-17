"use client";

import { adminActionMessage } from "@/lib/admin/errors";

const CONFIG_HINTS = ["not configured", "configuration is incomplete", "credentials", "missing required"];

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const message = adminActionMessage(error, "Something went wrong loading this page. Please try again.");
  const looksLikeConfigIssue = message ? CONFIG_HINTS.some((hint) => message.toLowerCase().includes(hint)) : false;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf6f0] p-6 text-[#2c221e]">
      <section className="max-w-xl rounded-2xl border border-[#e5dbcb] bg-white p-8 text-center shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9c5247]">Something went wrong</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">
          {looksLikeConfigIssue ? "Check the data setup" : "That action didn't go through"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-stone-600">
          {message || "An unexpected error occurred."}
        </p>
        {looksLikeConfigIssue ? (
          <p className="mt-3 text-sm leading-6 text-stone-500">
            When Supabase credentials are configured, the dashboard requires the schema in <code>database/schema.sql</code>. Apply it manually and follow <code>database/README.md</code>; remote migrations are never run automatically.
          </p>
        ) : null}
        <button onClick={reset} className="mt-6 min-h-10 rounded-lg bg-[#9c5247] px-5 text-sm font-semibold text-white">Try again</button>
      </section>
    </main>
  );
}
