"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  RefreshCw,
  Clock,
  CalendarDays,
  ArrowRight,
} from "lucide-react";

type DigestResponse = {
  date: string;
  content: string | null;
  generatedAt: string | null;
  message?: string;
};

function cx(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

export default function DailyDigestPage() {
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDigest = useCallback(async (force = false) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
      force ? setRefreshing(true) : setLoading(true);
      setError(null);

      const res = await fetch(`/api/digest${force ? "?force=true" : ""}`, {
        credentials: "include",
        signal: controller.signal,
      });

      const payload = await res.json();

      if (!res.ok) throw new Error(payload.error || "Failed to fetch digest");

      setDigest(payload);
    } catch (err: any) {
      setError(err.message || "Failed to fetch digest");
      setDigest(null);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDigest();
  }, [loadDigest]);

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px] space-y-6">

        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden rounded-[28px] border border-border-subtle bg-bg-surface shadow-card">
          <div className="absolute inset-0 bg-gradient-glow opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_30%)]" />

          <div className="relative flex flex-col gap-6 p-6 md:p-8 md:flex-row md:items-center md:justify-between">

            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-400/10 px-3 py-1 text-xs text-accent-300">
                <Sparkles size={14} />
                AI Daily Digest
              </div>

              <h1 className="mt-3 text-3xl font-semibold text-text-primary">
                Your SportsDeck Briefing
              </h1>

              <p className="mt-2 text-text-secondary max-w-xl">
                A curated, AI-generated summary of everything happening across matches,
                standings, and conversations.
              </p>
            </div>

            <button
              onClick={() => loadDigest(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-white shadow-glow hover:scale-[1.02] transition"
            >
              <RefreshCw size={16} />
              {refreshing ? "Regenerating..." : "Regenerate"}
            </button>
          </div>
        </section>

        {/* ================= META BAR ================= */}
        {digest && !loading && !error && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border-subtle bg-white/[0.03] px-4 py-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <CalendarDays size={14} /> {digest.date}
            </span>

            {digest.generatedAt && (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {new Date(digest.generatedAt).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* ================= MAIN ================= */}
        <section className="rounded-[28px] border border-border-subtle bg-bg-card p-6 shadow-card">

          {/* LOADING */}
          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-6 w-40 bg-white/10 rounded" />
              <div className="h-4 w-full bg-white/10 rounded" />
              <div className="h-4 w-5/6 bg-white/10 rounded" />
              <div className="h-4 w-2/3 bg-white/10 rounded" />
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          {/* EMPTY */}
          {!loading && !error && !digest?.content && (
            <p className="text-text-secondary text-sm">
              {digest?.message || "No digest available yet."}
            </p>
          )}

          {/* CONTENT */}
          {digest?.content && (
            <article className="prose prose-invert max-w-none">

              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-primary mb-4">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold text-primary mt-8 mb-3">
                      {children}
                    </h2>
                  ),
                  p: ({ children }) => (
                    <p className="text-text-secondary leading-7 mb-4">
                      {children}
                    </p>
                  ),
                  a: ({ href, children }) => (
                    <Link
                      href={href || "#"}
                      className="text-primary-400 hover:text-primary-300 underline"
                    >
                      {children}
                    </Link>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc ml-5 space-y-2 text-text-secondary mb-4">
                      {children}
                    </ul>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto">
                      <table className="w-full border border-border-subtle rounded-xl">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-3 text-primary text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-4 py-3 text-text-secondary">
                      {children}
                    </td>
                  ),
                }}
              >
                {digest.content}
              </ReactMarkdown>
            </article>
          )}
        </section>

        {/* ================= CTA ================= */}
        <div className="flex justify-between items-center rounded-2xl border border-border-subtle bg-white/[0.03] px-5 py-4">
          <div>
            <p className="text-sm font-medium text-text-primary">
              Want deeper discussion?
            </p>
            <p className="text-xs text-text-muted">
              Jump into threads and live conversations.
            </p>
          </div>

          <Link
            href="/community"
            className="inline-flex items-center gap-2 rounded-xl border border-border-subtle px-4 py-2 text-sm hover:bg-white/[0.06]"
          >
            Community
            <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
}