"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { StatusBadge, VerdictBadge, scoreLabel } from "@/components/admin/ModerationBadge";
import { useAuth } from "@/contexts/AuthContext";
import { showNotice } from "@/lib/clientNotice";

type QueueStatus = "pending" | "dismissed" | "approved";
type SortMode = "ai" | "reports" | "recent";

type QueueReporter = {
  reporter: { id: string; username: string | null };
  reason: string;
};

type QueueItem = {
  id: string;
  contentType: string;
  contentId: string;
  status: QueueStatus;
  reportCount: number;
  aiScore: number | null;
  aiLabel: string | null;
  aiExplanation: string | null;
  contentPreviewText?: string | null;
  lastReportedAt: string;
  reports: QueueReporter[];
};

type QueueResponse = {
  data: QueueItem[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

function authHeaders(token: string | null): HeadersInit {
  if (!token) return { "Content-Type": "application/json" };
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function aiRecommendation(score: number | null): string {
  if (score == null) return "UNKNOWN";
  if (score >= 0.7) return "LIKELY_INAPPROPRIATE";
  if (score >= 0.4) return "NEEDS_REVIEW";
  return "LIKELY_SAFE";
}

function scoreColor(score: number | null): string {
  if (score == null) return "text-text-muted";
  if (score >= 0.7) return "text-rose-300";
  if (score >= 0.4) return "text-amber-300";
  return "text-emerald-300";
}

export default function AdminReportsPage() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [status, setStatus] = useState<QueueStatus>("pending");
  const [sort, setSort] = useState<SortMode>("ai");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState<QueueResponse["pagination"] | null>(null);

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status,
        sort,
        page: String(page),
        limit: "10",
      });
      const res = await fetch(`/api/admin/reports?${params.toString()}`, {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      });
      const payload = (await res.json().catch(() => ({}))) as QueueResponse & { message?: string };
      if (!res.ok) {
        throw new Error(payload.message ?? "Failed to load moderation queue");
      }
      setItems(payload.data ?? []);
      setPagination(payload.pagination ?? null);
    } catch (error) {
      showNotice({
        tone: "error",
        title: "Queue load failed",
        message: error instanceof Error ? error.message : "Could not load moderation queue.",
      });
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, sort, status]);

  useEffect(() => {
    if (authLoading) return;
    void fetchQueue();
  }, [authLoading, fetchQueue]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchQueue();
    setIsRefreshing(false);
  }, [fetchQueue]);

  const highPriorityCount = useMemo(
    () => items.filter((item) => (item.aiScore ?? 0) >= 0.7).length,
    [items]
  );

  const selectClass =
    "rounded-xl border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none transition appearance-none cursor-pointer";

  return (
    <AdminShell
      title="Moderation Queue"
      subtitle={`${pagination?.totalCount ?? 0} ${status} reports. Sort by AI risk, reports, or recency.`}
    >
      <div className="space-y-4">
        {/* ── Filters bar ── */}
        <section className="rounded-2xl border border-border bg-bg-surface p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={status}
                onChange={(e) => { setPage(1); setStatus(e.target.value as QueueStatus); }}
                className={selectClass}
              >
                <option value="pending">Pending</option>
                <option value="dismissed">Dismissed</option>
                <option value="approved">Approved</option>
              </select>
              <select
                value={sort}
                onChange={(e) => { setPage(1); setSort(e.target.value as SortMode); }}
                className={selectClass}
              >
                <option value="ai">Sort: AI risk</option>
                <option value="reports">Sort: Report count</option>
                <option value="recent">Sort: Most recent</option>
              </select>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={isRefreshing}
              className="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-2 text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {/* ── Stats row ── */}
        <section className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-bg-surface p-4 shadow-soft">
            <p className="text-xs text-text-muted uppercase tracking-wide">Visible Items</p>
            <p className="mt-1.5 text-3xl font-bold text-text-primary">{items.length}</p>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-soft">
            <p className="text-xs text-text-muted uppercase tracking-wide">High AI Risk</p>
            <p className="mt-1.5 text-3xl font-bold text-rose-300">{highPriorityCount}</p>
          </div>
          <div className="rounded-2xl border border-primary-500/20 bg-primary-500/5 p-4 shadow-soft">
            <p className="text-xs text-text-muted uppercase tracking-wide">Total In Filter</p>
            <p className="mt-1.5 text-3xl font-bold text-primary-300">{pagination?.totalCount ?? 0}</p>
          </div>
        </section>

        {/* ── Queue items ── */}
        <section className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-border bg-bg-surface p-8 text-center">
              <div className="mx-auto w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-text-secondary">Loading queue...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-border bg-bg-surface p-8 text-center">
              <AlertTriangle className="mx-auto mb-3 w-8 h-8 text-text-muted" />
              <p className="text-sm text-text-secondary">No items found for this filter.</p>
            </div>
          ) : (
            items.map((item) => {
              const recommendation = aiRecommendation(item.aiScore);
              const latestReason = item.reports[0]?.reason ?? "No reason provided";
              const isHighRisk = (item.aiScore ?? 0) >= 0.7;
              const reportedText = item.contentPreviewText ?? "Reported content not available.";
              return (
                <article
                  key={item.id}
                  className={`rounded-2xl border bg-bg-surface p-4 shadow-soft transition hover:border-border-strong ${
                    isHighRisk ? "border-rose-500/25" : "border-border"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <StatusBadge status={item.status} />
                        <span className="rounded-md border border-border px-2 py-0.5 text-xs text-text-secondary">
                          {item.contentType}
                        </span>
                        <VerdictBadge recommendation={recommendation} />
                      </div>
                      <blockquote className="mt-2 border-l-2 border-primary-500/50 pl-3 italic text-sm text-text-primary">
                        &ldquo;{reportedText}&rdquo;
                      </blockquote>
                      <p className="mt-1 text-xs text-text-muted">
                        Most recent report reason: {latestReason}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">
                        Reports: {item.reportCount} · Last reported:{" "}
                        {new Date(item.lastReportedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-text-muted uppercase tracking-wide">Toxicity Score</p>
                      <p className={`text-3xl font-bold ${scoreColor(item.aiScore)}`}>
                        {scoreLabel(item.aiScore)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-border-subtle bg-bg-glass px-3 py-2.5 text-sm text-text-secondary">
                    {item.aiExplanation ?? "No AI explanation available yet."}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-text-dim truncate max-w-[60%]">ID: {item.id}</p>
                    <Link
                      href={`/admin/reports/${item.id}`}
                      className="rounded-xl bg-gradient-primary px-4 py-1.5 text-sm font-semibold text-primary shadow-glow hover:opacity-90 transition"
                    >
                      Review →
                    </Link>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* ── Pagination ── */}
        {pagination ? (
          <section className="flex items-center justify-between rounded-2xl border border-border bg-bg-surface p-4">
            <p className="text-sm text-text-secondary">
              Page {pagination.page} of {pagination.totalPages || 1}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                type="button"
                disabled={page >= (pagination.totalPages || 1)}
                onClick={() => setPage((prev) => prev + 1)}
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition disabled:opacity-40"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
