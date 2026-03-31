"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import ReplyBox from "@/components/threads/ReplyBox";
import PollCard from "@/components/threads/PollCard";

type TranslationMap = Record<string, string>;
type ReplyMessageMap = Record<string, string>;

type NoticeTone = "info" | "success" | "warning" | "error";

type NoticeState = {
  message: string;
  tone: NoticeTone;
};

type ReportModalState = {
  contentType: "THREAD" | "POST" | "REPLY" | "POLL";
  contentId: string;
} | null;

type Thread = {
  id: string;
  title: string;
  createdAt: string;
  author: { 
    id: string; 
    username: string;
  };
  post: {
    id: string;
    content: string;
    createdAt: string;
    author: any;
    replies: any[];
    replyCount: number;
  } | null;
  poll: any | null;
};

export default function ThreadPage() {
  const router = useRouter();
  const params = useParams();
  const { accessToken, user } = useAuth();

  const userId = useMemo(() => {
    if (!accessToken) return null;

    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1]));
      return payload?.id ?? null;
    } catch {
      return null;
    }
  }, [accessToken]);

  const threadId = params?.id as string;

  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [reportModal, setReportModal] = useState<ReportModalState>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportingKey, setReportingKey] = useState<string | null>(null);

  const [translatingKey, setTranslatingKey] = useState<string | null>(null);
  const [translations, setTranslations] = useState<TranslationMap>({});
  const [replyMessages, setReplyMessages] = useState<ReplyMessageMap>({});

  const [showPollCreator, setShowPollCreator] = useState(false);

  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // =========================
  // FETCH THREAD
  // =========================
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
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return headers;
  }, [accessToken]);

  // =========================
  // HELPERS
  // =========================
  const formatTime = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${days}d ago`;
  };

  const addPollOption = () => {
    setPollOptions((prev) => [...prev, ""]);
  };

  const updatePollOption = (index: number, value: string) => {
    setPollOptions((prev) =>
      prev.map((o, i) => (i === index ? value : o))
    );
  };

  // =========================
  // POLL CREATION
  // =========================
  const handleCreatePoll = async () => {
    const cleanOptions = pollOptions
      .map((o) => o.trim())
      .filter((o) => o.length > 0);

    if (!pollQuestion.trim()) {
      setNotice({
        message: "Question required",
        tone: "warning",
      });
      return;
    }

    if (cleanOptions.length < 2) {
      setNotice({
        message: "At least 2 options required",
        tone: "warning",
      });
      return;
    }

    try {
      const res = await fetch(`/api/threads/${threadId}/poll`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          question: pollQuestion,
          deadline: new Date(Date.now() + 86400000).toISOString(),
          options: cleanOptions,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // update UI
      setThread((prev) =>
        prev ? { ...prev, poll: data } : prev
      );

      // reset state
      setShowPollCreator(false);
      setPollQuestion("");
      setPollOptions(["", ""]);

    } catch (err: any) {
      setNotice(err.message);
    }
  };

  // =========================
  // REPORTING
  // =========================
  const openReportModal = useCallback(
    (contentType: "THREAD" | "POST" | "REPLY" | "POLL", contentId: string) => {
      if (!accessToken) {
        setNotice({ message: "Log in to submit reports.", tone: "info" });
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
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          contentType,
          contentId,
          reason: reportReason.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.message || "Failed to submit report");

      setNotice({ message: "Report submitted", tone: "success" });
      setReportModal(null);
    } catch (err: any) {
      setNotice({ message: err.message, tone: "error" });
    } finally {
      setReportingKey(null);
    }
  }, [reportModal, reportReason, authHeaders]);

  // =========================
  // TRANSLATION
  // =========================
  const translateReply = async (replyId: string) => {
    if (!accessToken) return;

    const key = `REPLY:${replyId}`;
    setTranslatingKey(key);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          contentType: "REPLY",
          contentId: replyId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTranslations((prev) => ({
        ...prev,
        [key]: data.translatedText,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setTranslatingKey(null);
    }
  };

  // =========================
  // RECURSIVE REPLIES
  // =========================
  const renderReplies = (replies: any[], depth = 0) =>
    replies.map((r) => (
      <div
        key={r.id}
        className={`flex gap-3 transition ${
          depth === 0 ? "" : "ml-4"
        }`}
      >
        {/* AVATAR */}
        <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-xs text-primary font-semibold shadow-glow">
          {r.author?.username?.[0]?.toUpperCase()}
        </div>

        <div className="flex-1 space-y-1">

          {/* META */}
          <div className="text-xs text-text-muted">
            <span className="text-primary font-medium">
              {r.author?.username ?? "User"}
            </span>{" "}
            • {formatTime(r.createdAt)}
          </div>

          {/* CONTENT */}
          <div className="text-sm text-text-secondary leading-6">
            {r.content}
          </div>

          {/* TRANSLATION */}
          {translations[`REPLY:${r.id}`] && (
            <div className="mt-2 rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-primary border border-white/10">
              {translations[`REPLY:${r.id}`]}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex gap-2 pt-1 text-xs">
            <button
              onClick={() => translateReply(r.id)}
              className="text-text-muted hover:text-primary transition"
            >
              Translate
            </button>

            <button
              onClick={() => openReportModal("REPLY", r.id)}
              className="text-text-muted hover:text-red-400 transition"
            >
              Report
            </button>
          </div>

          {/* CHILDREN */}
          {r.children?.length > 0 && (
            <div className="mt-3 border-l border-white/5 pl-4 space-y-3">
              {renderReplies(r.children, depth + 1)}
            </div>
          )}
        </div>
      </div>
    ));

  // =========================
  // UI STATES
  // =========================
  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!thread) return <div className="p-6">Not found</div>;

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-[900px] mx-auto space-y-6">

        {/* NOTICE */}
        {notice && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            {notice.message}
          </div>
        )}

        {/* BACK */}
        <button
          onClick={() => router.push("/home")}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* REPORT MODAL */}
        {reportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-md rounded-2xl bg-bg-surface p-6 shadow-card">

              <h2 className="text-lg font-semibold text-primary">
                Report Content
              </h2>

              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe the issue..."
                className="mt-4 w-full rounded-lg bg-bg-card p-2 text-primary"
              />

              <div className="mt-4 flex gap-2">
                <button
                  onClick={submitReport}
                  disabled={!reportReason.trim()}
                  className="bg-gradient-primary px-4 py-2 rounded-lg text-primary text-sm disabled:opacity-50"
                >
                  Submit
                </button>

                <button
                  onClick={() => setReportModal(null)}
                  className="text-sm text-text-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= HEADER ================= */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-bg-surface to-bg-card p-6 shadow-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />

          <h1 className="relative text-2xl md:text-3xl font-semibold text-primary leading-tight">
            {thread.title}
          </h1>

          <div className="relative mt-4 flex items-center gap-3 text-sm text-text-muted">
            <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-primary text-sm font-semibold shadow-glow">
              {thread.author?.username?.[0]?.toUpperCase() ?? "U"}
            </div>

            <span className="text-primary font-medium">
              {thread.author?.username}
            </span>

            <span>•</span>
            <span>{formatTime(thread.createdAt)}</span>
          </div>

          {/* REPORT THREAD */}
          <div className="mt-4">
            <button
              onClick={() => openReportModal("THREAD", thread.id)}
              className="text-xs text-text-muted hover:text-red-400 transition"
            >
              Report thread
            </button>
          </div>
        </div>

        {/* ================= CREATE POLL CTA ================= */}
        {!thread.poll && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-text-muted">
              {userId === thread.author?.id
                ? "You can create a poll for this thread"
                : "Only the thread author can create a poll"}
            </div>

            {userId === thread.author?.id && (
              <button
                onClick={() => setShowPollCreator(true)}
                className="rounded-xl bg-gradient-primary px-4 py-2 text-sm text-primary shadow-glow hover:opacity-90 transition"
              >
                Create Poll
              </button>
            )}
          </div>
        )}

        {/* POLL CREATOR */}
        {showPollCreator && (
          <div className="rounded-2xl border border-white/10 bg-bg-surface p-5 shadow-card space-y-4">

            <h3 className="text-primary font-semibold">Create Poll</h3>

            <input
              placeholder="Poll question"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="w-full rounded-lg bg-bg-card px-3 py-2 text-sm text-primary"
            />

            {pollOptions.map((opt, i) => (
              <input
                key={i}
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => updatePollOption(i, e.target.value)}
                className="w-full rounded-lg bg-bg-card px-3 py-2 text-sm text-primary"
              />
            ))}

            <button
              onClick={addPollOption}
              className="text-xs text-text-muted hover:text-primary"
            >
              + Add option
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleCreatePoll}
                className="bg-gradient-primary px-4 py-2 rounded-lg text-primary text-sm"
              >
                Create Poll
              </button>

              <button
                onClick={() => setShowPollCreator(false)}
                className="text-sm text-text-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ================= POLL ================= */}
        {thread.poll && (
          <PollCard
            poll={thread.poll}
            onVote={(updatedPoll) =>
              setThread((prev) =>
                prev ? { ...prev, poll: updatedPoll } : prev
              )
            }
            onReport={() => openReportModal("POLL", thread.poll!.id)}
            isBanned={Boolean(user?.isBanned)}
          />
        )}

        {/* ================= MAIN POST ================= */}
        {thread.post && (
          <div className="rounded-2xl border border-white/10 bg-bg-card p-6 shadow-card space-y-4">

            <p className="text-[15px] leading-7 text-text-primary">
              {thread.post.content}
            </p>

            <div className="flex justify-between text-xs text-text-muted">
              <span>{thread.post.replyCount} replies</span>

              <button
                onClick={() => {
                  if (!thread.post) return;
                  openReportModal("POST", thread.post.id);
                }}
                className="hover:text-red-400 transition"
              >
                Report
              </button>
            </div>

            <div className="pt-2 border-t border-white/5">
              <ReplyBox
                postId={thread.post.id}
                onReplyCreated={() => loadThread()}
                isBanned={Boolean(user?.isBanned)}
              />
            </div>

            {/* REPLIES */}
            <div className="pt-4 space-y-4">
              {thread.post.replies.map((r: any) => (
                <div key={r.id} className="flex gap-3">

                  <div className="w-7 h-7 rounded-full bg-gradient-primary flex items-center justify-center text-xs text-primary">
                    {r.author?.username?.[0]?.toUpperCase() ?? "U"}
                  </div>

                  <div className="flex-1">
                    <div className="text-xs text-text-muted">
                      {r.author?.username ?? "User"} • {formatTime(r.createdAt)}
                    </div>

                    <div className="text-sm text-text-secondary">
                      {r.content}
                    </div>

                    {/* TRANSLATION */}
                    {translations[`REPLY:${r.id}`] && (
                      <div className="mt-2 rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-primary border border-white/10">
                        {translations[`REPLY:${r.id}`]}
                      </div>
                    )}

                    <div className="mt-2 flex gap-2 text-xs">
                      <button
                        onClick={() => translateReply(r.id)}
                        disabled={translatingKey === `REPLY:${r.id}`}
                        className="text-text-muted hover:text-primary transition disabled:opacity-50"
                      >
                        {translatingKey === `REPLY:${r.id}` ? "Translating…" : "Translate"}
                      </button>
                      <button
                        onClick={() => openReportModal("REPLY", r.id)}
                        className="text-text-muted hover:text-red-400 transition"
                      >
                        Report
                      </button>
                    </div>

                    {/* NESTED CHILDREN */}
                    {r.children?.length > 0 && (
                      <div className="mt-3 border-l border-white/5 pl-4 space-y-3">
                        {renderReplies(r.children, 1)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}