"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertTriangle, MessageSquareWarning } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/ModerationBadge";
import { useAuth } from "@/contexts/AuthContext";
import { showNotice } from "@/lib/clientNotice";

type AppealStatus = "pending" | "approved" | "rejected";

type AppealItem = {
  id: string;
  message: string;
  status: AppealStatus;
  createdAt: string;
  reviewedAt: string | null;
  decisionNote: string | null;
  appealer: { id: string; username: string | null; email: string };
  ban: {
    id: string;
    reason: string;
    status: string;
    createdAt: string;
    bannedByAdmin: { id: string; username: string | null };
  };
  reviewedByAdmin: { id: string; username: string | null } | null;
};

type AppealsResponse = {
  data: AppealItem[];
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

function getInitials(name?: string | null): string {
  if (!name) return "?";
  return name.slice(0, 1).toUpperCase();
}

export default function AdminAppealsPage() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<AppealStatus>("pending");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AppealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<AppealsResponse["pagination"] | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  // Decision note modal state
  const [decisionModal, setDecisionModal] = useState<{
    appealId: string;
    nextStatus: "approved" | "rejected";
  } | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const decisionInputRef = useRef<HTMLTextAreaElement>(null);

  const loadAppeals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, page: String(page), limit: "10" });
      const res = await fetch(`/api/admin/appeals?${params.toString()}`, {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      });
      const payload = (await res.json().catch(() => ({}))) as AppealsResponse & { message?: string };
      if (!res.ok) throw new Error(payload.message ?? "Could not load appeals");
      setItems(payload.data ?? []);
      setPagination(payload.pagination ?? null);
    } catch (error) {
      showNotice({
        tone: "error",
        title: "Load failed",
        message: error instanceof Error ? error.message : "Could not fetch appeals.",
      });
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, status]);

  useEffect(() => {
    if (authLoading) return;
    void loadAppeals();
  }, [authLoading, loadAppeals]);

  const openDecisionModal = useCallback((appealId: string, nextStatus: "approved" | "rejected") => {
    setDecisionNote("");
    setDecisionModal({ appealId, nextStatus });
    setTimeout(() => decisionInputRef.current?.focus(), 50);
  }, []);

  const confirmDecision = useCallback(async () => {
    if (!decisionModal) return;
    const { appealId, nextStatus } = decisionModal;
    setDecisionModal(null);
    setResolvingId(appealId);
    try {
      const res = await fetch(`/api/admin/appeals/${appealId}`, {
        method: "PATCH",
        headers: authHeaders(accessToken),
        body: JSON.stringify({ status: nextStatus, decisionNote: decisionNote.trim() || undefined }),
      });
      const payload = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(payload.message ?? "Could not resolve appeal");
      showNotice({
        tone: "success",
        title: `Appeal ${nextStatus}`,
        message: payload.message ?? "Appeal updated successfully.",
      });
      await loadAppeals();
    } catch (error) {
      showNotice({
        tone: "error",
        title: "Resolve failed",
        message: error instanceof Error ? error.message : "Could not update appeal.",
      });
    } finally {
      setResolvingId(null);
    }
  }, [accessToken, decisionModal, decisionNote, loadAppeals]);

  const selectClass =
    "rounded-xl border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none transition appearance-none cursor-pointer";

  return (
    <AdminShell title="Appeals Inbox" subtitle="Review ban appeals and approve or reject each case.">
      <div className="space-y-4">
        {/* ── Filter bar ── */}
        <section className="rounded-2xl border border-border bg-bg-surface p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <select
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value as AppealStatus); }}
              className={selectClass}
            >
              <option value="pending">Pending appeals</option>
              <option value="approved">Approved appeals</option>
              <option value="rejected">Rejected appeals</option>
            </select>
            <button
              type="button"
              onClick={() => void loadAppeals()}
              className="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-2 text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </section>

        {/* ── Appeals list ── */}
        <section className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-border bg-bg-surface p-8 text-center">
              <div className="mx-auto w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-text-secondary">Loading appeals...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-border bg-bg-surface p-8 text-center">
              <AlertTriangle className="mx-auto mb-3 w-8 h-8 text-text-muted" />
              <p className="text-sm text-text-secondary">No appeals found for this filter.</p>
            </div>
          ) : (
            items.map((appeal) => (
              <article
                key={appeal.id}
                className={`rounded-2xl border bg-bg-surface p-4 shadow-soft transition hover:border-border-strong ${
                  appeal.status === "pending"
                    ? "border-amber-500/20"
                    : appeal.status === "approved"
                    ? "border-emerald-500/20"
                    : "border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-white shadow-glow">
                    {getInitials(appeal.appealer.username)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge status={appeal.status} />
                      <span className="font-semibold text-text-primary text-sm">
                        @{appeal.appealer.username ?? "unknown"}
                      </span>
                      <span className="text-xs text-text-muted">{appeal.appealer.email}</span>
                    </div>

                    {/* Appeal message */}
                    <div className="rounded-xl border border-border-subtle bg-bg-glass px-3 py-2.5 text-sm text-text-primary">
                      {appeal.message}
                    </div>

                    <p className="mt-2 text-xs text-text-muted">
                      Ban reason:{" "}
                      <span className="text-text-secondary">{appeal.ban.reason}</span> · Filed on{" "}
                      {new Date(appeal.createdAt).toLocaleString()}
                    </p>

                    {appeal.reviewedByAdmin ? (
                      <p className="mt-1 text-xs text-text-muted">
                        Reviewed by @{appeal.reviewedByAdmin.username ?? "admin"} on{" "}
                        {appeal.reviewedAt ? new Date(appeal.reviewedAt).toLocaleString() : "N/A"}
                      </p>
                    ) : null}

                    {appeal.decisionNote ? (
                      <div className="mt-2 rounded-xl border border-border-subtle bg-bg-glass px-3 py-2 text-xs text-text-secondary">
                        <span className="text-text-muted">Admin note: </span>
                        {appeal.decisionNote}
                      </div>
                    ) : null}

                    {appeal.status === "pending" ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openDecisionModal(appeal.id, "approved")}
                          disabled={resolvingId === appeal.id}
                          className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 transition disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve Appeal
                        </button>
                        <button
                          type="button"
                          onClick={() => openDecisionModal(appeal.id, "rejected")}
                          disabled={resolvingId === appeal.id}
                          className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject Appeal
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
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
      {/* ── Decision note modal ── */}
      {decisionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setDecisionModal(null); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-bg-surface shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                decisionModal.nextStatus === "approved"
                  ? "bg-emerald-500/15 border-emerald-500/30"
                  : "bg-rose-500/15 border-rose-500/30"
              }`}>
                <MessageSquareWarning className={`w-4 h-4 ${
                  decisionModal.nextStatus === "approved" ? "text-emerald-300" : "text-rose-300"
                }`} />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary capitalize">
                  {decisionModal.nextStatus} Appeal
                </h2>
                <p className="text-xs text-text-muted">Add an optional note for the user</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Decision note <span className="normal-case font-normal text-text-muted">(optional)</span>
              </label>
              <textarea
                ref={decisionInputRef}
                value={decisionNote}
                onChange={(e) => setDecisionNote(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") setDecisionModal(null); }}
                rows={3}
                className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary-500/60 focus:outline-none focus:ring-1 focus:ring-primary-500/30 transition resize-none"
                placeholder="Leave a note explaining your decision…"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setDecisionModal(null)}
                className="rounded-xl border border-border bg-bg-elevated px-4 py-2 text-sm font-semibold text-text-secondary hover:border-border-strong hover:text-text-primary transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmDecision()}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  decisionModal.nextStatus === "approved"
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25"
                    : "border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
                }`}
              >
                Confirm {decisionModal.nextStatus === "approved" ? "Approval" : "Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
