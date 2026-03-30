"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type DigestResponse = {
  date: string;
  content: string | null;
  generatedAt: string | null;
  message?: string;
};

export default function DailyDigestPage() {
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDigest = useCallback(async (force = false) => {
    const controller = new AbortController();
    const clientTimeoutMs = 120_000;
    const timeoutId = window.setTimeout(() => controller.abort(), clientTimeoutMs);

    try {
      if (force) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const res = await fetch(`/api/digest${force ? "?force=true" : ""}`, {
        credentials: "include",
        signal: controller.signal,
      });
      const payload = (await res.json().catch(() => ({}))) as DigestResponse & { error?: string };

      if (!res.ok) {
        throw new Error(payload.error ?? "Failed to fetch daily digest");
      }

      setDigest(payload);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError(
          "Request timed out. The digest service may be slow; try Regenerate in a moment."
        );
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch daily digest");
      }
      setDigest(null);
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDigest();
  }, [loadDigest]);

  return (
    <div className="px-4 py-5 md:px-6 md:py-6 lg:px-8">
      <div className="mx-auto max-w-[980px] space-y-4">
        <section className="rounded-2xl border border-border-subtle bg-bg-surface p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.12em] text-text-muted">AI-generated summary</p>
              <h1 className="mt-1 text-xl font-semibold text-white md:text-2xl">Daily Digest</h1>
            </div>
            <button
              onClick={() => loadDigest(true)}
              disabled={refreshing}
              className="rounded-xl border border-border-subtle bg-white/[0.03] px-4 py-2 text-sm text-text-primary transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {refreshing ? "Refreshing..." : "Regenerate"}
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-soft">
          {loading ? (
            <div className="space-y-2 text-sm text-text-secondary">
              <p>Loading digest…</p>
              <p className="text-xs text-text-muted">
                First load may take up to a minute while we gather matches, standings, and
                discussions. If this stays here too long, use Regenerate or refresh the page.
              </p>
            </div>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : !digest?.content ? (
            <p className="text-sm text-text-secondary">{digest?.message ?? "No digest available yet."}</p>
          ) : (
            <>
              <div className="mb-6 rounded-xl border border-border-subtle bg-white/[0.03] px-4 py-3 text-xs text-text-muted">
                Date: {digest.date} {digest.generatedAt ? `· Generated ${new Date(digest.generatedAt).toLocaleString()}` : ""}
              </div>
              <article className="prose prose-invert prose-sm md:prose-base max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => (
                      <h1 className="mb-4 text-2xl font-bold text-white md:text-3xl">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-3 mt-6 text-xl font-semibold text-white md:text-2xl">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-2 mt-4 text-lg font-semibold text-text-primary">{children}</h3>
                    ),
                    a: ({ href, children }) => (
                      <Link
                        href={href ?? "#"}
                        className="font-medium text-primary-400 underline underline-offset-2 hover:text-primary-300 transition-colors"
                      >
                        {children}
                      </Link>
                    ),
                    p: ({ children }) => (
                      <p className="mb-4 leading-7 text-text-secondary">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-4 ml-5 list-disc space-y-2 text-text-secondary">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-4 ml-5 list-decimal space-y-2 text-text-secondary">{children}</ol>
                    ),
                    li: ({ children }) => <li className="leading-6">{children}</li>,
                    table: ({ children }) => (
                      <div className="mb-4 overflow-x-auto">
                        <table className="w-full border-collapse rounded-xl border border-border-subtle">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-white/[0.05]">{children}</thead>
                    ),
                    tbody: ({ children }) => <tbody>{children}</tbody>,
                    tr: ({ children }) => (
                      <tr className="border-b border-border-subtle last:border-0">{children}</tr>
                    ),
                    th: ({ children }) => (
                      <th className="px-4 py-3 text-left text-sm font-semibold text-white">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-4 py-3 text-sm text-text-secondary">{children}</td>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-white">{children}</strong>
                    ),
                    em: ({ children }) => <em className="italic text-text-primary">{children}</em>,
                    code: ({ children }) => (
                      <code className="rounded bg-white/[0.08] px-1.5 py-0.5 text-xs font-mono text-accent-300">
                        {children}
                      </code>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="mb-4 border-l-4 border-primary-500/50 bg-white/[0.03] pl-4 py-2 italic text-text-secondary">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {digest.content}
                </ReactMarkdown>
              </article>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
