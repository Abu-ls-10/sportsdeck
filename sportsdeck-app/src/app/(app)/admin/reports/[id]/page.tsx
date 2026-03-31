"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bot, Users, ClipboardList, ShieldBan, EyeOff, XCircle, RefreshCw } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { StatusBadge, VerdictBadge, scoreLabel } from "@/components/admin/ModerationBadge";
import { useAuth } from "@/contexts/AuthContext";
import { showNotice } from "@/lib/clientNotice";

type DetailReport = {
  id: string;
  reason: string;
  createdAt: string;
  reporter: {
    id: string;
    username: string | null;
  };
};

type AdminAction = {
  id: string;
  actionType: string;
  notes: string | null;
  createdAt: string;
  admin: {
    id: string;
    username: string | null;
  };
};

type ContentPreview = {
  id: string;
  title?: string;
  content?: string;
  isHidden?: boolean;
  author?: { id: string; username: string | null; isBanned?: boolean };
  thread?: { id: string; title: string };
  post?: { id: string; thread: { id: string; title: string } };
};

type ReportedItemDetail = {
  id: string;
  status: string;
  contentType: string;
  contentId: string;
  reportCount: number;
  aiScore: number | null;
  aiLabel: string | null;
  aiExplanation: string | null;
  aiModel: string | null;
  lastReportedAt: string;
  reports: DetailReport[];
  adminActions: AdminAction[];
  contentPreview: ContentPreview | null;
  aiVerdict: {
    score: number;
    label: string | null;
    explanation: string | null;
    model: string | null;
    analyzedAt: string | null;
    recommendation: string;
  } | null;
};

function authHeaders(token: string | null): HeadersInit {
  if (!token) return { "Content-Type": "application/json" };
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function contentText(detail: ReportedItemDetail): string {
  if (!detail.contentPreview) return "Content preview not available.";
  if (detail.contentType === "THREAD") return detail.contentPreview.title ?? "Untitled thread";
  return detail.contentPreview.content ?? "No text content found.";
}

function authorFromPreview(detail: ReportedItemDetail): { id: string; username: string | null } | null {
  if (!detail.contentPreview) return null;
  return detail.contentPreview.author ?? null;
}

function scoreColor(score: number | null | undefined): string {
  if (score == null) return "text-text-muted";
  if (score >= 0.7) return "text-rose-300";
  if (score >= 0.4) return "text-amber-300";
  return "text-emerald-300";
}

export default function AdminReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, isLoading: authLoading } = useAuth();

  const [detail, setDetail] = useState<ReportedItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banReason, setBanReason] = useState("Violation confirmed through moderation review.");
  const banInputRef = useRef<HTMLInputElement>(null);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      });
      const payload = (await res.json().catch(() => ({}))) as ReportedItemDetail & { message?: string };
      if (!res.ok) throw new Error(payload.message ?? "Failed to load report detail");
      setDetail(payload);
    } catch (error) {
      showNotice({
        tone: "error",
        title: "Load failed",
        message: error instanceof Error ? error.message : "Could not fetch report detail.",
      });
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, id]);

  useEffect(() => {
    if (authLoading) return;
    void loadDetail();
  }, [authLoading, loadDetail]);

  const runAction = useCallback(
    async (action: "dismiss" | "approve") => {
      if (!id) return;
      setBusyAction(action);
      try {
        const res = await fetch(`/api/admin/reports/${id}`, {
          method: "PATCH",
          headers: authHeaders(accessToken),
          body: JSON.stringify({ action }),
        });
        const payload = (await res.json().catch(() => ({}))) as { message?: string };
        if (!res.ok) throw new Error(payload.message ?? `Failed to ${action} report`);
        showNotice({
          tone: "success",
          title: action === "approve" ? "Content hidden" : "Report dismissed",
          message: payload.message ?? "Action completed.",
        });
        await loadDetail();
      } catch (error) {
        showNotice({
          tone: "error",
          title: "Action failed",
          message: error instanceof Error ? error.message : "Could not update report.",
        });
      } finally {
        setBusyAction(null);
      }
    },
    [accessToken, id, loadDetail]
  );

  const rerunAnalysis = useCallback(async () => {
    if (!id) return;
    setBusyAction("analyze");
    try {
      const res = await fetch(`/api/admin/reports/${id}/analyze`, {
        method: "POST",
        headers: authHeaders(accessToken),
      });
      const payload = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(payload.message ?? "Could not re-run AI analysis");
      showNotice({ tone: "success", title: "AI analysis complete", message: payload.message ?? "Verdict updated." });
      await loadDetail();
    } catch (error) {
      showNotice({
        tone: "error",
        title: "Analyze failed",
        message: error instanceof Error ? error.message : "Could not analyze report.",
      });
    } finally {
      setBusyAction(null);
    }
  }, [accessToken, id, loadDetail]);

  const openBanModal = useCallback(() => {
    if (!detail) return;
    const author = authorFromPreview(detail);
    if (!author) {
      showNotice({ tone: "warning", title: "No author found", message: "Could not infer content author to ban." });
      return;
    }
    setBanReason("Violation confirmed through moderation review.");
    setBanModalOpen(true);
    setTimeout(() => banInputRef.current?.select(), 50);
  }, [detail]);

  const confirmBan = useCallback(async () => {
    if (!detail || !banReason.trim()) return;
    const author = authorFromPreview(detail);
    if (!author) return;
    setBanModalOpen(false);
    setBusyAction("ban");
    try {
      const res = await fetch("/api/admin/bans", {
        method: "POST",
        headers: authHeaders(accessToken),
        body: JSON.stringify({ userId: author.id, reason: banReason.trim(), reportedItemId: detail.id }),
      });
      const payload = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(payload.message ?? "Failed to ban user");
      showNotice({ tone: "success", title: "User banned", message: "Ban has been applied successfully." });
      await loadDetail();
    } catch (error) {
      showNotice({
        tone: "error",
        title: "Ban failed",
        message: error instanceof Error ? error.message : "Could not ban user.",
      });
    } finally {
      setBusyAction(null);
    }
  }, [accessToken, banReason, detail, loadDetail]);

  const canResolve = detail?.status === "pending";
  const recommendation = useMemo(
    () => detail?.aiVerdict?.recommendation ?? "UNKNOWN",
    [detail?.aiVerdict?.recommendation]
  );
  const author = detail ? authorFromPreview(detail) : null;
  const authorAlreadyBanned = author != null && (detail?.contentPreview?.author?.isBanned ?? false);
  const aiScore = detail?.aiVerdict?.score ?? detail?.aiScore ?? null;

  return (
    <AdminShell title="Report Review" subtitle="Inspect report context, AI verdict, and apply moderation actions.">
      {loading ? (
        <div className="rounded-2xl border border-border bg-bg-surface p-8 text-center">
          <div className="mx-auto w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-text-secondary">Loading report detail...</p>
        </div>
      ) : !detail ? (
        <div className="rounded-2xl border border-border bg-bg-surface p-8 text-center">
          <p className="text-sm text-text-secondary">Report not found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── Back button ── */}
          <button
            type="button"
            onClick={() => router.push("/admin/reports")}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-bg-surface px-3 py-2 text-sm text-text-secondary hover:border-border-strong hover:bg-bg-elevated hover:text-text-primary transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Queue
          </button>

          {/* ── Overview card ── */}
          <section className="rounded-2xl border border-border bg-bg-surface p-5 shadow-soft">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={detail.status} />
              <span className="rounded-md border border-border px-2 py-0.5 text-xs text-text-secondary">
                {detail.contentType}
              </span>
              <VerdictBadge recommendation={recommendation} />
              <span className="rounded-md border border-border px-2 py-0.5 text-xs text-text-secondary">
                {detail.reportCount} report{detail.reportCount !== 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-text-muted">
              Reported: {new Date(detail.lastReportedAt).toLocaleString()} · Content ID:{" "}
              <span className="font-mono text-text-dim">{detail.contentId}</span>
            </p>

            {/* Content preview */}
            <div className="mt-4 rounded-xl border border-border-subtle bg-bg-glass p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                Reported Content
              </p>
              <p className="text-base italic text-text-primary leading-relaxed">{contentText(detail)}</p>
              {author ? (
                <p className="mt-3 text-sm text-text-secondary">
                  Author:{" "}
                  <span className="font-semibold text-text-primary">@{author.username ?? "unknown"}</span>
                </p>
              ) : null}
            </div>
          </section>

          {/* ── AI verdict + score ── */}
          <section className="grid gap-4 lg:grid-cols-[1fr_200px]">
            <div className="rounded-2xl border border-border bg-bg-surface p-5 shadow-soft">
              <div className="mb-3 flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary-400" />
                <p className="text-sm font-semibold text-text-primary">AI Analysis Verdict</p>
              </div>
              <div className="rounded-xl border border-border-subtle bg-bg-glass p-4 space-y-2">
                <p className="text-sm text-text-secondary">
                  Label:{" "}
                  <span className="font-semibold text-text-primary">
                    {detail.aiVerdict?.label ?? detail.aiLabel ?? "N/A"}
                  </span>
                </p>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {detail.aiVerdict?.explanation ?? detail.aiExplanation ?? "No explanation yet."}
                </p>
                <p className="text-xs text-text-muted">
                  Model: {detail.aiVerdict?.model ?? detail.aiModel ?? "N/A"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-bg-surface p-5 shadow-soft flex flex-col items-center justify-center text-center">
              <p className="text-[10px] uppercase tracking-widest text-text-muted">Toxicity Score</p>
              <p className={`mt-2 text-6xl font-bold ${scoreColor(aiScore)}`}>{scoreLabel(aiScore)}</p>
              <p className="mt-2 text-xs text-text-secondary">{recommendation.replaceAll("_", " ")}</p>
            </div>
          </section>

          {/* ── Reports + Actions log ── */}
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-border bg-bg-surface p-5 shadow-soft">
              <div className="mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-text-muted" />
                <p className="text-sm font-semibold text-text-primary">User Reports</p>
              </div>
              <div className="space-y-2">
                {detail.reports.length === 0 ? (
                  <p className="text-sm text-text-secondary">No report records found.</p>
                ) : (
                  detail.reports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-xl border border-border-subtle bg-bg-glass p-3"
                    >
                      <p className="text-sm text-text-primary">{report.reason}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        by @{report.reporter.username ?? "unknown"} ·{" "}
                        {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-bg-surface p-5 shadow-soft">
              <div className="mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-text-muted" />
                <p className="text-sm font-semibold text-text-primary">Admin Action Log</p>
              </div>
              <div className="space-y-2">
                {detail.adminActions.length === 0 ? (
                  <p className="text-sm text-text-secondary">No admin actions yet.</p>
                ) : (
                  detail.adminActions.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-border-subtle bg-bg-glass p-3"
                    >
                      <p className="text-sm font-medium text-text-primary">{entry.actionType}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        @{entry.admin.username ?? "admin"} · {new Date(entry.createdAt).toLocaleString()}
                      </p>
                      {entry.notes ? (
                        <p className="mt-1 text-xs text-text-secondary">{entry.notes}</p>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* ── Action bar ── */}
          <section className="rounded-2xl border border-border bg-bg-surface p-4 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void runAction("dismiss")}
                  disabled={!canResolve || Boolean(busyAction)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-2 text-sm font-semibold text-text-secondary hover:border-border-strong hover:text-text-primary transition disabled:opacity-40"
                >
                  <XCircle className="w-4 h-4" />
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => void runAction("approve")}
                  disabled={!canResolve || Boolean(busyAction)}
                  className="flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary shadow-glow hover:opacity-90 transition disabled:opacity-40"
                >
                  <EyeOff className="w-4 h-4" />
                  Approve & Hide Content
                </button>
                <button
                  type="button"
                  onClick={openBanModal}
                  disabled={Boolean(busyAction) || authorAlreadyBanned}
                  title={authorAlreadyBanned ? "This user is already banned" : undefined}
                  className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShieldBan className="w-4 h-4" />
                  {authorAlreadyBanned ? "Already Banned" : "Ban User"}
                </button>
                <button
                  type="button"
                  onClick={() => void rerunAnalysis()}
                  disabled={Boolean(busyAction)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-2 text-sm font-semibold text-text-secondary hover:border-border-strong hover:text-text-primary transition disabled:opacity-40"
                >
                  <RefreshCw className={`w-4 h-4 ${busyAction === "analyze" ? "animate-spin" : ""}`} />
                  Re-run AI Analysis
                </button>
              </div>
              <button
                type="button"
                onClick={() => router.push("/admin/reports")}
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-text-secondary hover:bg-bg-elevated hover:text-text-primary transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Queue
              </button>
            </div>
          </section>
        </div>
      )}
      {/* ── Ban reason modal ── */}
      {banModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setBanModalOpen(false); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-bg-surface shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15 border border-rose-500/30">
                <ShieldBan className="w-4 h-4 text-rose-300" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-primary">Ban User</h2>
                <p className="text-xs text-text-muted">
                  @{authorFromPreview(detail!)?.username ?? "unknown"}
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Ban reason
              </label>
              <input
                ref={banInputRef}
                type="text"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void confirmBan(); if (e.key === "Escape") setBanModalOpen(false); }}
                className="w-full rounded-xl border border-border bg-bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-rose-500/60 focus:outline-none focus:ring-1 focus:ring-rose-500/30 transition"
                placeholder="Enter ban reason…"
                autoFocus
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setBanModalOpen(false)}
                className="rounded-xl border border-border bg-bg-elevated px-4 py-2 text-sm font-semibold text-text-secondary hover:border-border-strong hover:text-text-primary transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmBan()}
                disabled={!banReason.trim()}
                className="rounded-xl border border-rose-500/40 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/25 transition disabled:opacity-40"
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
