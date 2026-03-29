"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ChevronLeft, ChevronRight, Gavel, ShieldCheck, AlertTriangle } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/ModerationBadge";
import { useAuth } from "@/contexts/AuthContext";
import { showNotice } from "@/lib/clientNotice";

type BanStatus = "active" | "lifted";

type BanItem = {
  id: string;
  reason: string;
  status: BanStatus;
  createdAt: string;
  liftedAt: string | null;
  user: { id: string; username: string | null; email: string };
  bannedByAdmin: { id: string; username: string | null };
  reportedItem: { id: string; contentType: string; contentId: string } | null;
};

type BansResponse = {
  data: BanItem[];
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

export default function AdminBansPage() {
  const { accessToken, isLoading: authLoading } = useAuth();
  const [status, setStatus] = useState<BanStatus>("active");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<BanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<BansResponse["pagination"] | null>(null);
  const [liftingId, setLiftingId] = useState<string | null>(null);

  const loadBans = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, page: String(page), limit: "10" });
      const res = await fetch(`/api/admin/bans?${params.toString()}`, {
        method: "GET",
        headers: authHeaders(accessToken),
        cache: "no-store",
      });
      const payload = (await res.json().catch(() => ({}))) as BansResponse & { message?: string };
      if (!res.ok) throw new Error(payload.message ?? "Could not load bans");
      setItems(payload.data ?? []);
      setPagination(payload.pagination ?? null);
    } catch (error) {
      showNotice({
        tone: "error",
        title: "Load failed",
        message: error instanceof Error ? error.message : "Failed to fetch bans.",
      });
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, status]);

  useEffect(() => {
    if (authLoading) return;
    void loadBans();
  }, [authLoading, loadBans]);

  const liftBan = useCallback(
    async (banId: string) => {
      setLiftingId(banId);
      try {
        const res = await fetch(`/api/admin/bans/${banId}/lift`, {
          method: "PATCH",
          headers: authHeaders(accessToken),
        });
        const payload = (await res.json().catch(() => ({}))) as { message?: string };
        if (!res.ok) throw new Error(payload.message ?? "Could not lift ban");
        showNotice({ tone: "success", title: "Ban lifted", message: payload.message ?? "User has been unbanned." });
        await loadBans();
      } catch (error) {
        showNotice({
          tone: "error",
          title: "Lift failed",
          message: error instanceof Error ? error.message : "Could not lift ban.",
        });
      } finally {
        setLiftingId(null);
      }
    },
    [accessToken, loadBans]
  );

  const selectClass =
    "rounded-xl border border-border bg-bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary-500 focus:outline-none transition appearance-none cursor-pointer";

  return (
    <AdminShell title="Ban Management" subtitle="Manage active bans and lift restrictions when needed.">
      <div className="space-y-4">
        {/* ── Filter bar ── */}
        <section className="rounded-2xl border border-border bg-bg-surface p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <select
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value as BanStatus); }}
              className={selectClass}
            >
              <option value="active">Active bans</option>
              <option value="lifted">Lifted bans</option>
            </select>
            <button
              type="button"
              onClick={() => void loadBans()}
              className="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-4 py-2 text-sm text-text-secondary hover:border-border-strong hover:text-text-primary transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </section>

        {/* ── Ban list ── */}
        <section className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-border bg-bg-surface p-8 text-center">
              <div className="mx-auto w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm text-text-secondary">Loading bans...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-border bg-bg-surface p-8 text-center">
              <AlertTriangle className="mx-auto mb-3 w-8 h-8 text-text-muted" />
              <p className="text-sm text-text-secondary">No bans found for this filter.</p>
            </div>
          ) : (
            items.map((ban) => (
              <article
                key={ban.id}
                className={`rounded-2xl border bg-bg-surface p-4 shadow-soft transition hover:border-border-strong ${
                  ban.status === "active" ? "border-rose-500/20" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-sm font-bold text-white shadow-glow">
                      {getInitials(ban.user.username)}
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <StatusBadge status={ban.status} />
                        <span className="font-semibold text-text-primary text-sm">
                          @{ban.user.username ?? "unknown"}
                        </span>
                        <span className="text-xs text-text-muted">{ban.user.email}</span>
                      </div>
                      <p className="text-sm text-text-primary">{ban.reason}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        Banned by{" "}
                        <span className="text-text-secondary">@{ban.bannedByAdmin.username ?? "admin"}</span>{" "}
                        on {new Date(ban.createdAt).toLocaleString()}
                      </p>
                      {ban.reportedItem ? (
                        <p className="mt-1 text-xs text-text-dim">
                          Linked report: {ban.reportedItem.contentType} ·{" "}
                          <span className="font-mono">{ban.reportedItem.id}</span>
                        </p>
                      ) : null}
                      {ban.liftedAt ? (
                        <p className="mt-1 text-xs text-emerald-400">
                          Lifted at {new Date(ban.liftedAt).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {ban.status === "active" ? (
                    <button
                      type="button"
                      onClick={() => void liftBan(ban.id)}
                      disabled={liftingId === ban.id}
                      className="flex shrink-0 items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 transition disabled:opacity-50"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {liftingId === ban.id ? "Lifting..." : "Lift Ban"}
                    </button>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs text-text-muted">
                      <Gavel className="w-3.5 h-3.5" />
                      Lifted
                    </div>
                  )}
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
    </AdminShell>
  );
}
