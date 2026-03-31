"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MessageSquareWarning, Send, ShieldAlert, ShieldCheck, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge } from "@/components/admin/ModerationBadge";
import { showNotice } from "@/lib/clientNotice";

type AppealStatus = "pending" | "approved" | "rejected";

type AppealItem = {
  id: string;
  message: string;
  status: AppealStatus;
  createdAt: string;
  reviewedAt: string | null;
  decisionNote: string | null;
  ban: {
    id: string;
    reason: string;
    status: string;
    createdAt: string;
  };
  reviewedByAdmin: { id: string; username: string | null } | null;
};

type AppealsResponse = {
  data: AppealItem[];
  isCurrentlyBanned?: boolean;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
};

function authHeaders(token: string | null): HeadersInit {
  if (!token) return { "Content-Type": "application/json" };
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

function statusIcon(status: AppealStatus) {
  if (status === "approved") return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
  if (status === "rejected") return <ShieldAlert className="w-4 h-4 text-rose-400" />;
  return <Clock className="w-4 h-4 text-amber-400" />;
}

export default function AppealsPage() {
  const { user, accessToken, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [appeals, setAppeals] = useState<AppealItem[]>([]);
  const [isCurrentlyBanned, setIsCurrentlyBanned] = useState<boolean | null>(null);

  const loadAppeals = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/appeals?limit=20", {
        method: "GET",
        headers: authHeaders(token),
        cache: "no-store",
      });
      const payload = (await res.json().catch(() => ({}))) as AppealsResponse & { message?: string };
      if (!res.ok) throw new Error(payload.message ?? "Could not load appeals");
      setAppeals(payload.data ?? []);
      setIsCurrentlyBanned(
        typeof payload.isCurrentlyBanned === "boolean" ? payload.isCurrentlyBanned : null
      );
    } catch (error) {
      // Silently ignore errors that happen after the user has logged out
      if (!accessToken) return;
      showNotice({
        tone: "error",
        title: "Load failed",
        message: error instanceof Error ? error.message : "Could not load your appeals.",
      });
      setAppeals([]);
      setIsCurrentlyBanned(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (isLoading || !accessToken) return;
    void loadAppeals(accessToken);
  }, [accessToken, isLoading, loadAppeals]);

  const submitAppeal = useCallback(async () => {
    if (!accessToken || !message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/appeals", {
        method: "POST",
        headers: authHeaders(accessToken),
        body: JSON.stringify({ message: message.trim() }),
      });
      const payload = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) throw new Error(payload.message ?? "Could not submit appeal");
      setMessage("");
      showNotice({ tone: "success", title: "Appeal submitted", message: "Your appeal has been sent for review." });
      await loadAppeals(accessToken);
    } catch (error) {
      showNotice({
        tone: "error",
        title: "Submission failed",
        message: error instanceof Error ? error.message : "Could not submit appeal.",
      });
    } finally {
      setSubmitting(false);
    }
  }, [accessToken, loadAppeals, message]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-main">
        <div className="flex items-center gap-3 text-text-secondary">
          <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-bg-main">
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 pt-16">
          <div className="rounded-2xl border border-border bg-bg-surface p-8 text-center max-w-sm w-full shadow-card">
            <ShieldAlert className="mx-auto mb-4 w-10 h-10 text-text-muted" />
            <h2 className="text-lg font-bold text-text-primary mb-2">Sign in required</h2>
            <p className="text-sm text-text-secondary mb-5">You must be logged in to view or submit appeals.</p>
            <Link
              href="/login"
              className="inline-block rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary shadow-glow hover:opacity-90 transition"
            >
              Go to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const effectiveBanState = isCurrentlyBanned ?? user.isBanned;

  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      {/* Top glow accent */}
      <div className="pointer-events-none fixed inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />

      <div className="mx-auto max-w-3xl px-4 pt-24 pb-12 space-y-5">
        {/* ── Header ── */}
        <header className="rounded-2xl border border-border bg-bg-surface p-6 shadow-card">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
              <MessageSquareWarning className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Ban Appeal Center</h1>
              <p className="mt-1 text-sm text-text-secondary">
                Submit an appeal request if your account was banned. Approved appeals will restore account access.
              </p>
            </div>
          </div>

          {/* Ban status banner */}
          <div className="mt-4">
            {!effectiveBanState ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-200">
                  Your account is in good standing. You can still view your past appeals below.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/8 px-4 py-3">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <p className="text-sm text-rose-200">
                  Your account is currently banned. Submit an appeal message for admin review.
                </p>
              </div>
            )}
          </div>
        </header>

        {/* ── Submit appeal ── */}
        <section className="rounded-2xl border border-border bg-bg-surface p-5 shadow-soft">
          <p className="mb-3 text-sm font-semibold text-text-primary">Submit New Appeal</p>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explain why your ban should be lifted. Be specific and honest — admins review every appeal."
            className="h-32 w-full resize-none rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-primary-500 transition"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-text-muted">{message.trim().length} / 1000 characters</p>
            <button
              type="button"
              onClick={() => void submitAppeal()}
              disabled={submitting || message.trim().length === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary shadow-glow hover:opacity-90 transition disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Submitting..." : "Submit Appeal"}
            </button>
          </div>
        </section>

        {/* ── Appeal history ── */}
        <section className="rounded-2xl border border-border bg-bg-surface p-5 shadow-soft">
          <p className="mb-4 text-sm font-semibold text-text-primary">Appeal History</p>
          {loading ? (
            <div className="flex items-center gap-2 text-text-secondary py-4">
              <div className="w-4 h-4 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Loading appeals...</p>
            </div>
          ) : appeals.length === 0 ? (
            <div className="rounded-xl border border-border-subtle bg-bg-glass px-4 py-6 text-center">
              <MessageSquareWarning className="mx-auto mb-2 w-7 h-7 text-text-muted" />
              <p className="text-sm text-text-secondary">No appeals submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appeals.map((appeal) => (
                <article
                  key={appeal.id}
                  className={`rounded-xl border bg-bg-elevated p-4 transition ${
                    appeal.status === "approved"
                      ? "border-emerald-500/20"
                      : appeal.status === "rejected"
                      ? "border-rose-500/20"
                      : "border-amber-500/20"
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {statusIcon(appeal.status)}
                    <StatusBadge status={appeal.status} />
                    <span className="text-xs text-text-muted">
                      Submitted {new Date(appeal.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary">{appeal.message}</p>
                  <p className="mt-2 text-xs text-text-muted">
                    Ban reason: <span className="text-text-secondary">{appeal.ban.reason}</span>
                  </p>
                  {appeal.decisionNote ? (
                    <div className="mt-3 rounded-lg border border-border-subtle bg-bg-glass px-3 py-2 text-xs text-text-secondary">
                      <span className="text-text-muted font-medium">Admin note: </span>
                      {appeal.decisionNote}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
