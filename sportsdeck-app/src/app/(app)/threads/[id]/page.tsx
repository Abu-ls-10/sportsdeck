"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { MessageSquare, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import ReplyBox from "@/components/threads/ReplyBox";
import PostComposer from "@/components/threads/PostComposer";
import PollCard from "@/components/threads/PollCard";

type TranslationMap = Record<string, string>;
type ReplyMessageMap = Record<string, string>;

type ReportModalState = {
  contentType: "THREAD" | "POST" | "REPLY";
  contentId: string;
} | null;

export default function ThreadPage() {
  const router = useRouter();
  const params = useParams();
  const { accessToken } = useAuth();

  const threadId = params?.id as string;

  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reportingKey, setReportingKey] = useState<string | null>(null);
  const [translatingKey, setTranslatingKey] = useState<string | null>(null);
  const [translations, setTranslations] = useState<TranslationMap>({});
  const [replyMessages, setReplyMessages] = useState<ReplyMessageMap>({});
  const [reportModal, setReportModal] = useState<ReportModalState>(null);
  const [reportReason, setReportReason] = useState("");

  const loadThread = useCallback(async () => {
    if (!threadId) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/threads/${threadId}/full`);
      if (!res.ok) throw new Error("Failed to load thread");

      const data = await res.json();
      setThread(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load thread");
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return headers;
  }, [accessToken]);

  const openReportModal = useCallback(
    (contentType: "THREAD" | "POST" | "REPLY", contentId: string) => {
      if (!accessToken) {
        setNotice("Log in to submit reports.");
        return;
      }
      setReportModal({ contentType, contentId });
      setReportReason("");
    },
    [accessToken]
  );

  const submitReport = useCallback(async () => {
    if (!reportModal || !reportReason.trim()) return;

    const { contentType, contentId } = reportModal;
    const targetKey = `${contentType}:${contentId}`;
    setReportingKey(targetKey);

    try {
      const payload = {
        contentType,
        contentId,
        reason: reportReason.trim(),
      };

      const res = await fetch("/api/reports", {
        method: "POST",
        credentials: "include",
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      const responseData = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMessage = responseData?.message ?? "Failed to submit report";
        
        if (res.status === 400 && errorMessage.includes("cannot report your own content")) {
          setNotice("You cannot report your own content.");
          setReportModal(null);
          setReportReason("");
          return;
        }

        if (res.status === 409 && errorMessage.includes("already reported")) {
          setNotice("You have already reported this content.");
          setReportModal(null);
          setReportReason("");
          return;
        }

        if (res.status === 429) {
          setNotice(errorMessage);
          setReportModal(null);
          setReportReason("");
          return;
        }

        throw new Error(errorMessage);
      }

      setNotice("Report submitted successfully.");
      setReportModal(null);
      setReportReason("");
    } catch (err) {
      console.error("[report] error:", err);
      setNotice(err instanceof Error ? err.message : "Failed to submit report");
      setReportModal(null);
      setReportReason("");
    } finally {
      setReportingKey(null);
    }
  }, [reportModal, reportReason, authHeaders]);

  const translateReply = useCallback(
    async (replyId: string) => {
      if (!accessToken) {
        setReplyMessages((prev) => ({ ...prev, [replyId]: "Log in to translate content." }));
        return;
      }

      const targetKey = `REPLY:${replyId}`;
      setTranslatingKey(targetKey);
      setReplyMessages((prev) => ({ ...prev, [replyId]: "Translating..." }));
      try {
        const res = await fetch("/api/translate", {
          method: "POST",
          credentials: "include",
          headers: authHeaders,
          body: JSON.stringify({
            contentType: "REPLY",
            contentId: replyId,
          }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(payload?.error ?? "Failed to translate content");
        }

        const translatedText =
          typeof payload?.translatedText === "string" ? payload.translatedText : null;
        const originalText = typeof payload?.originalText === "string" ? payload.originalText : null;
        if (!translatedText) {
          throw new Error("Translation unavailable");
        }

        setTranslations((prev) => ({
          ...prev,
          [targetKey]: translatedText,
        }));
        if (originalText && translatedText.trim() === originalText.trim()) {
          setReplyMessages((prev) => ({ ...prev, [replyId]: "Translation returned same text." }));
        } else {
          setReplyMessages((prev) => ({ ...prev, [replyId]: "Translated." }));
        }
      } catch (err) {
        setReplyMessages((prev) => ({
          ...prev,
          [replyId]: err instanceof Error ? err.message : "Failed to translate content",
        }));
      } finally {
        setTranslatingKey(null);
      }
    },
    [accessToken, authHeaders]
  );

  const formatTime = (date: string) => {
    if (!date) return "";

    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  };

  if (!threadId) {
    return <div className="p-6">Invalid thread</div>;
  }

  if (loading) {
    return (
      <div className="p-6 max-w-[900px] mx-auto space-y-4">
        <div className="h-6 w-1/2 bg-white/5 rounded animate-pulse" />
        <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-24 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-400">{error}</div>;
  }

  if (!thread) {
    return <div className="p-6">Not found</div>;
  }

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-[900px] mx-auto space-y-6">
        {notice && (
          <div className="rounded-xl border border-border-subtle bg-bg-card px-4 py-3 text-sm text-text-primary">
            {notice}
          </div>
        )}

        {reportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-border-subtle bg-bg-surface p-6 shadow-card">
              <h2 className="text-lg font-semibold text-white">Report Content</h2>
              <p className="mt-2 text-sm text-text-secondary">
                Why are you reporting this {reportModal.contentType.toLowerCase()}?
              </p>
              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe the issue (minimum 5 characters)..."
                className="mt-4 w-full rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-500"
                rows={4}
                autoFocus
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setReportModal(null);
                    setReportReason("");
                  }}
                  className="rounded-xl border border-border-subtle bg-white/[0.03] px-4 py-2 text-sm text-text-secondary transition hover:bg-white/[0.06] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReport}
                  disabled={!reportReason.trim() || reportingKey !== null}
                  className="rounded-xl bg-gradient-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {reportingKey ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="rounded-2xl bg-bg-surface p-6 shadow-card">
          <h1 className="text-2xl font-semibold text-white leading-tight">
            {thread.title}
          </h1>

          <div className="mt-3 flex items-center gap-3 text-sm text-text-muted">
            <div className="h-8 w-8 rounded-full bg-primary-500/30" />
            <span>{thread.author?.username ?? "Unknown"}</span>
            <span>•</span>
            <span>{formatTime(thread.createdAt)}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => openReportModal("THREAD", thread.id)}
              disabled={reportingKey === `THREAD:${thread.id}`}
              className="rounded-lg border border-border-subtle bg-white/[0.03] px-3 py-1.5 text-xs text-text-secondary transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {reportingKey === `THREAD:${thread.id}` ? "Reporting..." : "Report thread"}
            </button>
          </div>
        </div>

        <PostComposer
          threadId={thread.id}
          onPostCreated={(newPost) =>
            setThread((prev: any) => ({
              ...prev,
              posts: [newPost, ...prev.posts],
            }))
          }
        />

        {thread.poll && <PollCard poll={thread.poll} />}

        <div className="space-y-4">
          {thread.posts?.map((post: any) => (
            <div
              key={post.id}
              className="rounded-2xl bg-bg-card p-5 border border-white/5 hover:border-white/10 transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="h-8 w-8 rounded-full bg-primary-500/30" />
                <div className="text-sm text-text-muted">
                  <span className="text-white font-medium">
                    {post.author?.username ?? "User"}
                  </span>
                  <span className="mx-1">•</span>
                  {formatTime(post.createdAt)}
                </div>
              </div>

              <p className="text-sm leading-6 text-text-secondary">
                {post.content}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {post.replies?.length ?? 0} replies
                </div>
                <button
                  onClick={() => openReportModal("POST", post.id)}
                  disabled={reportingKey === `POST:${post.id}`}
                  className="rounded-lg border border-border-subtle bg-white/[0.03] px-2.5 py-1 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {reportingKey === `POST:${post.id}` ? "Reporting..." : "Report"}
                </button>
              </div>

              <div className="mt-4">
                <ReplyBox
                  postId={post.id}
                  onReplyCreated={(newReply: any) => {
                    setThread((prev: any) => ({
                      ...prev,
                      posts: prev.posts.map((p: any) =>
                        p.id === post.id
                          ? {
                              ...p,
                              replies: [...p.replies, newReply],
                            }
                          : p
                      ),
                    }));
                  }}
                />
              </div>

              <div className="mt-4 space-y-3 border-l border-white/5 pl-4">
                {post.replies?.map((r: any) => (
                  <div key={r.id} className="flex gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary-500/30" />
                    <div className="flex-1">
                      <div className="text-xs text-text-muted mb-1">
                        {r.author?.username ?? "User"} •{" "}
                        {formatTime(r.createdAt)}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {r.content}
                      </div>
                      {translations[`REPLY:${r.id}`] && (
                        <div className="mt-2 rounded-lg border border-border-subtle bg-white/[0.03] px-3 py-2 text-sm text-text-primary">
                          Translation: {translations[`REPLY:${r.id}`]}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                        <button
                          onClick={() => translateReply(r.id)}
                          disabled={translatingKey === `REPLY:${r.id}`}
                          className="rounded-lg border border-border-subtle bg-white/[0.03] px-2.5 py-1 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {translatingKey === `REPLY:${r.id}` ? "Translating..." : "Translate"}
                        </button>
                        <button
                          onClick={() => openReportModal("REPLY", r.id)}
                          disabled={reportingKey === `REPLY:${r.id}`}
                          className="rounded-lg border border-border-subtle bg-white/[0.03] px-2.5 py-1 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {reportingKey === `REPLY:${r.id}` ? "Reporting..." : "Report"}
                        </button>
                      </div>
                      {replyMessages[r.id] && (
                        <div className="mt-2 text-xs text-text-muted">{replyMessages[r.id]}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}