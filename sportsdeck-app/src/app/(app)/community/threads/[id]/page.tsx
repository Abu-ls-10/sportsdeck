"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { showNotice as showClientNotice } from "@/lib/clientNotice";

import ReplyBox from "@/components/threads/ReplyBox";
import PollCard from "@/components/threads/PollCard";

type TranslationMap = Record<string, string>;

type NoticeTone = "info" | "success" | "warning" | "error";

type NoticeState = {
  message: string;
  tone: NoticeTone;
};

type ReportModalState = {
  contentType: "THREAD" | "POST" | "REPLY" | "POLL";
  contentId: string;
} | null;

type Author = {
  id: string;
  username: string;
  avatarUrl?: string | null;
};

type PollOption = {
  id: string;
  text: string;
  votes: number;
  percentage: number;
};

type Poll = {
  id: string;
  question: string;
  deadline: string | null;
  isClosed: boolean;
  options: PollOption[];
  userVote: string | null;
  totalVotes: number;
};

type ReplyNode = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  author: Author | null;
  children: ReplyNode[];
  optimistic?: boolean;
};

type PostType = {
  id: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  isEdited?: boolean;
  author: Author | null;
  replies: ReplyNode[];
  replyCount: number;
};

type Thread = {
  id: string;
  title: string;
  createdAt: string;
  author: Author;
  post: PostType | null;
  poll: Poll | null;
};

type InlineDeleteTarget =
  | { type: "THREAD"; id: string }
  | { type: "POST"; id: string }
  | { type: "REPLY"; id: string }
  | { type: "POLL"; id: string }
  | null;

function normalizeReplyTree(replies: unknown): ReplyNode[] {
  if (!Array.isArray(replies)) return [];

  return replies.map((reply: any) => ({
    id: String(reply.id),
    content: String(reply.content ?? ""),
    createdAt: String(reply.createdAt ?? new Date().toISOString()),
    updatedAt: reply.updatedAt ? String(reply.updatedAt) : undefined,
    isEdited: Boolean(reply.isEdited),
    author: reply.author
      ? {
          id: String(reply.author.id),
          username: String(reply.author.username ?? "User"),
          avatarUrl: reply.author.avatarUrl ?? null,
        }
      : null,
    children: normalizeReplyTree(reply.children),
    optimistic: Boolean(reply.optimistic),
  }));
}

function normalizeThread(data: any): Thread {
  return {
    id: String(data.id),
    title: String(data.title ?? ""),
    createdAt: String(data.createdAt ?? new Date().toISOString()),
    author: {
      id: String(data.author?.id ?? ""),
      username: String(data.author?.username ?? "User"),
      avatarUrl: data.author?.avatarUrl ?? null,
    },
    post: data.post
      ? {
          id: String(data.post.id),
          content: String(data.post.content ?? ""),
          createdAt: String(data.post.createdAt ?? new Date().toISOString()),
          updatedAt: data.post.updatedAt ? String(data.post.updatedAt) : undefined,
          isEdited: Boolean(data.post.isEdited),
          author: data.post.author
            ? {
                id: String(data.post.author.id),
                username: String(data.post.author.username ?? "User"),
                avatarUrl: data.post.author.avatarUrl ?? null,
              }
            : null,
          replies: normalizeReplyTree(data.post.replies),
          replyCount: Number(data.post.replyCount ?? 0),
        }
      : null,
    poll: data.poll
      ? {
          id: String(data.poll.id),
          question: String(data.poll.question ?? ""),
          deadline: data.poll.deadline ? String(data.poll.deadline) : null,
          isClosed: Boolean(data.poll.isClosed),
          options: Array.isArray(data.poll.options)
            ? data.poll.options.map((option: any) => ({
                id: String(option.id),
                text: String(option.text ?? ""),
                votes: Number(option.votes ?? 0),
                percentage: Number(option.percentage ?? 0),
              }))
            : [],
          userVote: data.poll.userVote ? String(data.poll.userVote) : null,
          totalVotes: Number(data.poll.totalVotes ?? 0),
        }
      : null,
  };
}

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

  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const [editingThread, setEditingThread] = useState(false);
  const [threadTitleDraft, setThreadTitleDraft] = useState("");

  const [editingPost, setEditingPost] = useState(false);
  const [postDraft, setPostDraft] = useState("");

  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editReplyDraft, setEditReplyDraft] = useState("");

  const [editingPoll, setEditingPoll] = useState(false);
  const [pollQuestionDraft, setPollQuestionDraft] = useState("");
  const [pollDeadlineDraft, setPollDeadlineDraft] = useState("");
  const [newPollOptionDraft, setNewPollOptionDraft] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<InlineDeleteTarget>(null);

  const authHeaders = useMemo(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return headers;
  }, [accessToken]);

  const isThreadOwner = useMemo(() => {
    return userId !== null && userId === thread?.author?.id;
  }, [userId, thread]);

  const isPostOwner = useMemo(() => {
    return userId !== null && userId === thread?.post?.author?.id;
  }, [userId, thread]);

  const isPollOwner = isThreadOwner;

  const isReplyOwner = useCallback(
    (reply: ReplyNode) => userId !== null && userId === reply.author?.id,
    [userId]
  );

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

  const navigateToUser = useCallback(
    (id?: string | null) => {
      if (!id) return;
      router.push(`/users/${id}`);
    },
    [router]
  );

  const showNotice = useCallback((message: string, tone: NoticeTone = "info") => {
    setNotice({ message, tone });
  }, []);

  const cloneThread = useCallback((value: Thread | null) => {
    if (!value) return null;
    return JSON.parse(JSON.stringify(value)) as Thread;
  }, []);

  const getNoticeClasses = (tone: NoticeTone) => {
    switch (tone) {
      case "success":
        return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
      case "warning":
        return "border-amber-500/30 bg-amber-500/10 text-amber-200";
      case "error":
        return "border-red-500/30 bg-red-500/10 text-red-200";
      default:
        return "border-primary-500/30 bg-primary-500/10 text-primary";
    }
  };

  const countReplies = useCallback((replies: ReplyNode[]): number => {
    return replies.reduce((acc, reply) => {
      return acc + 1 + countReplies(reply.children);
    }, 0);
  }, []);

  const updateReplyInTree = useCallback(
    (
      replies: ReplyNode[],
      replyId: string,
      updater: (reply: ReplyNode) => ReplyNode
    ): ReplyNode[] => {
      return replies.map((reply) => {
        if (reply.id === replyId) {
          return updater(reply);
        }

        if (reply.children.length > 0) {
          return {
            ...reply,
            children: updateReplyInTree(reply.children, replyId, updater),
          };
        }

        return reply;
      });
    },
    []
  );

  const removeReplyFromTree = useCallback(
    (replies: ReplyNode[], replyId: string): ReplyNode[] => {
      return replies
        .filter((reply) => reply.id !== replyId)
        .map((reply) => ({
          ...reply,
          children:
            reply.children.length > 0
              ? removeReplyFromTree(reply.children, replyId)
              : [],
        }));
    },
    []
  );

  const insertChildReply = useCallback(
    (replies: ReplyNode[], parentReplyId: string, newReply: ReplyNode): ReplyNode[] => {
      return replies.map((reply) => {
        if (reply.id === parentReplyId) {
          return {
            ...reply,
            children: [...reply.children, newReply],
          };
        }

        if (reply.children.length > 0) {
          return {
            ...reply,
            children: insertChildReply(reply.children, parentReplyId, newReply),
          };
        }

        return reply;
      });
    },
    []
  );

  const loadThread = useCallback(async () => {
    if (!threadId) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/threads/${threadId}/full`);
      if (!res.ok) throw new Error("Failed to load thread");

      const data = await res.json();
      const normalized = normalizeThread(data);

      setThread(normalized);
      setThreadTitleDraft(normalized.title);
      setPostDraft(normalized.post?.content ?? "");
      setPollQuestionDraft(normalized.poll?.question ?? "");
      setPollDeadlineDraft(
        normalized.poll?.deadline
          ? new Date(normalized.poll.deadline).toISOString().slice(0, 16)
          : ""
      );
    } catch (err) {
      console.error(err);
      setError("Failed to load thread");
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    void loadThread();
  }, [loadThread]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const addPollOption = () => {
    setPollOptions((prev) => [...prev, ""]);
  };

  const updatePollOption = (index: number, value: string) => {
    setPollOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
  };

  const handleCreatePoll = async () => {
    const cleanOptions = pollOptions.map((o) => o.trim()).filter(Boolean);

    if (!pollQuestion.trim()) {
      showNotice("Question required", "warning");
      return;
    }

    if (cleanOptions.length < 2) {
      showNotice("At least 2 options required", "warning");
      return;
    }

    const snapshot = cloneThread(thread);

    const optimisticPoll: Poll = {
      id: `temp-poll-${Date.now()}`,
      question: pollQuestion.trim(),
      deadline: new Date(Date.now() + 86400000).toISOString(),
      isClosed: false,
      options: cleanOptions.map((text, index) => ({
        id: `temp-option-${index}`,
        text,
        votes: 0,
        percentage: 0,
      })),
      userVote: null,
      totalVotes: 0,
    };

    setThread((prev) => (prev ? { ...prev, poll: optimisticPoll } : prev));
    setShowPollCreator(false);
    setPollQuestion("");
    setPollOptions(["", ""]);

    try {
      const res = await fetch(`/api/threads/${threadId}/poll`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          question: optimisticPoll.question,
          deadline: optimisticPoll.deadline,
          options: cleanOptions,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to create poll");
      }

      const normalizedPoll = normalizeThread({
        id: thread?.id ?? "",
        title: thread?.title ?? "",
        createdAt: thread?.createdAt ?? new Date().toISOString(),
        author: thread?.author ?? { id: "", username: "User", avatarUrl: null },
        post: thread?.post ?? null,
        poll: data,
      }).poll;

      setThread((prev) => (prev ? { ...prev, poll: normalizedPoll } : prev));
      setPollQuestionDraft(normalizedPoll?.question ?? "");
      setPollDeadlineDraft(
        normalizedPoll?.deadline
          ? new Date(normalizedPoll.deadline).toISOString().slice(0, 16)
          : ""
      );
      showNotice("Poll created", "success");
    } catch (err: any) {
      setThread(snapshot);
      showNotice(err.message || "Failed to create poll", "error");
    }
  };

  const openReportModal = useCallback(
    (contentType: "THREAD" | "POST" | "REPLY" | "POLL", contentId: string) => {
      if (!accessToken) {
        showNotice("Log in to submit reports.", "info");
        return;
      }
      setReportModal({ contentType, contentId });
      setReportReason("");
    },
    [accessToken, showNotice]
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

      showNotice("Report submitted", "success");
      showClientNotice({
        tone: "success",
        title: "Report submitted",
        message: "Thank you. Our moderators will review it.",
      });
      setReportModal(null);
    } catch (err: any) {
      const message = err.message || "Failed to submit report";
      showNotice(message, "error");
      showClientNotice({
        tone: "error",
        title: "Could not submit report",
        message,
      });
    } finally {
      setReportingKey(null);
    }
  }, [reportModal, reportReason, authHeaders, showNotice]);

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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to translate reply");
      }

      setTranslations((prev) => ({
        ...prev,
        [key]: data.translatedText,
      }));
    } catch (err) {
      console.error(err);
      showNotice("Failed to translate reply", "error");
    } finally {
      setTranslatingKey(null);
    }
  };

  const handleTopLevelReplyCreated = useCallback(
    (reply: any) => {
      const normalizedReply = normalizeReplyTree([{ ...reply, children: reply.children ?? [] }])[0];

      setThread((prev) => {
        if (!prev?.post) return prev;

        const updatedReplies = [...prev.post.replies, normalizedReply];

        return {
          ...prev,
          post: {
            ...prev.post,
            replies: updatedReplies,
            replyCount: countReplies(updatedReplies),
          },
        };
      });
    },
    [countReplies]
  );

  const handleNestedReplyCreated = useCallback(
    (parentReplyId: string, reply: any) => {
      const normalizedReply = normalizeReplyTree([{ ...reply, children: reply.children ?? [] }])[0];

      setThread((prev) => {
        if (!prev?.post) return prev;

        const updatedReplies = insertChildReply(
          prev.post.replies,
          parentReplyId,
          normalizedReply
        );

        return {
          ...prev,
          post: {
            ...prev.post,
            replies: updatedReplies,
            replyCount: countReplies(updatedReplies),
          },
        };
      });

      setReplyingTo(null);
    },
    [countReplies, insertChildReply]
  );

  const handleSaveThreadEdit = async () => {
    if (!thread) return;

    const title = threadTitleDraft.trim();
    if (!title) {
      showNotice("Thread title cannot be empty", "warning");
      return;
    }

    const snapshot = cloneThread(thread);

    setThread((prev) => (prev ? { ...prev, title } : prev));
    setEditingThread(false);

    try {
      const res = await fetch(`/api/threads/${thread.id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ title }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to update thread");
      }

      setThread((prev) => (prev ? { ...prev, title: data.title ?? title } : prev));
      showNotice("Thread updated", "success");
    } catch (err: any) {
      setThread(snapshot);
      setThreadTitleDraft(snapshot?.title ?? "");
      showNotice(err.message || "Failed to update thread", "error");
    }
  };

  const handleSavePostEdit = async () => {
    if (!thread?.post) return;

    const content = postDraft.trim();
    if (!content) {
      showNotice("Post cannot be empty", "warning");
      return;
    }

    const snapshot = cloneThread(thread);

    setThread((prev) =>
      prev?.post
        ? {
            ...prev,
            post: {
              ...prev.post,
              content,
              isEdited: true,
            },
          }
        : prev
    );
    setEditingPost(false);

    try {
      const res = await fetch(`/api/posts/${thread.post.id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ content }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to update post");
      }

      setThread((prev) =>
        prev?.post
          ? {
              ...prev,
              post: {
                ...prev.post,
                content: data.content ?? content,
                isEdited: true,
                updatedAt: data.updatedAt ?? prev.post.updatedAt,
              },
            }
          : prev
      );

      showNotice("Post updated", "success");
    } catch (err: any) {
      setThread(snapshot);
      setPostDraft(snapshot?.post?.content ?? "");
      showNotice(err.message || "Failed to update post", "error");
    }
  };

  const startEditReply = (reply: ReplyNode) => {
    setEditingReplyId(reply.id);
    setEditReplyDraft(reply.content);
  };

  const handleSaveReplyEdit = async (replyId: string) => {
    if (!thread?.post) return;

    const content = editReplyDraft.trim();
    if (!content) {
      showNotice("Reply cannot be empty", "warning");
      return;
    }

    const snapshot = cloneThread(thread);

    setThread((prev) => {
      if (!prev?.post) return prev;

      const updatedReplies = updateReplyInTree(prev.post.replies, replyId, (reply) => ({
        ...reply,
        content,
        isEdited: true,
      }));

      return {
        ...prev,
        post: {
          ...prev.post,
          replies: updatedReplies,
        },
      };
    });

    setEditingReplyId(null);
    setEditReplyDraft("");

    try {
      const res = await fetch(`/api/replies/${replyId}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ content }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to update reply");
      }

      setThread((prev) => {
        if (!prev?.post) return prev;

        const updatedReplies = updateReplyInTree(prev.post.replies, replyId, (reply) => ({
          ...reply,
          content: data.content ?? content,
          isEdited: true,
          updatedAt: data.updatedAt ?? reply.updatedAt,
        }));

        return {
          ...prev,
          post: {
            ...prev.post,
            replies: updatedReplies,
          },
        };
      });

      showNotice("Reply updated", "success");
    } catch (err: any) {
      setThread(snapshot);
      showNotice(err.message || "Failed to update reply", "error");
    }
  };

  const handleSavePollEdit = async () => {
    if (!thread?.poll) return;

    const question = pollQuestionDraft.trim();
    if (!question) {
      showNotice("Poll question cannot be empty", "warning");
      return;
    }

    const snapshot = cloneThread(thread);

    setThread((prev) =>
      prev?.poll
        ? {
            ...prev,
            poll: {
              ...prev.poll,
              question,
              deadline: pollDeadlineDraft ? new Date(pollDeadlineDraft).toISOString() : null,
            },
          }
        : prev
    );

    setEditingPoll(false);

    try {
      const res = await fetch(`/api/polls/${thread.poll.id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({
          question,
          deadline: pollDeadlineDraft
            ? new Date(pollDeadlineDraft).toISOString()
            : null,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to update poll");
      }

      const normalizedPoll = normalizeThread({
        id: thread.id,
        title: thread.title,
        createdAt: thread.createdAt,
        author: thread.author,
        post: thread.post,
        poll: data,
      }).poll;

      setThread((prev) =>
        prev ? { ...prev, poll: normalizedPoll } : prev
      );

      showNotice("Poll updated", "success");
    } catch (err: any) {
      setThread(snapshot);
      showNotice(err.message || "Failed to update poll", "error");
    }
  };

  const handleAddPollOption = async () => {
    if (!thread?.poll) return;

    const text = newPollOptionDraft.trim();
    if (!text) {
      showNotice("Option cannot be empty", "warning");
      return;
    }

    const snapshot = cloneThread(thread);

    const tempOption: PollOption = {
      id: `temp-option-${Date.now()}`,
      text,
      votes: 0,
      percentage: 0,
    };

    setThread((prev) =>
      prev?.poll
        ? {
            ...prev,
            poll: {
              ...prev.poll,
              options: [...prev.poll.options, tempOption],
            },
          }
        : prev
    );

    setNewPollOptionDraft("");

    try {
      const res = await fetch(`/api/polls/${thread.poll.id}/options`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ text }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to add option");
      }

      setThread((prev) => {
        if (!prev?.poll) return prev;

        const nextOptions = prev.poll.options.map((option) =>
          option.id === tempOption.id
            ? {
                id: String(data.id),
                text: String(data.text ?? text),
                votes: Number(data.votes ?? 0),
                percentage: Number(data.percentage ?? 0),
              }
            : option
        );

        return {
          ...prev,
          poll: {
            ...prev.poll,
            options: nextOptions,
          },
        };
      });

      showNotice("Poll option added", "success");
    } catch (err: any) {
      setThread(snapshot);
      setNewPollOptionDraft(text);
      showNotice(err.message || "Failed to add option", "error");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget || !thread) return;

    const snapshot = cloneThread(thread);
    const { type, id } = deleteTarget;

    if (type === "THREAD") {
      setThread(null);
    }

    if (type === "POST") {
      setThread((prev) => (prev ? { ...prev, post: null } : prev));
    }

    if (type === "POLL") {
      setThread((prev) => (prev ? { ...prev, poll: null } : prev));
    }

    if (type === "REPLY") {
      setThread((prev) => {
        if (!prev?.post) return prev;

        const updatedReplies = removeReplyFromTree(prev.post.replies, id);

        return {
          ...prev,
          post: {
            ...prev.post,
            replies: updatedReplies,
            replyCount: countReplies(updatedReplies),
          },
        };
      });
    }

    setDeleteTarget(null);

    try {
      const endpointMap: Record<"THREAD" | "POST" | "REPLY" | "POLL", string> = {
        THREAD: `/api/threads/${id}`,
        POST: `/api/posts/${id}`,
        REPLY: `/api/replies/${id}`,
        POLL: `/api/polls/${id}`,
      };

      const res = await fetch(endpointMap[type], {
        method: "DELETE",
        headers: authHeaders,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete");
      }

      if (type === "THREAD") {
        showNotice("Thread deleted", "success");
        router.push("/home");
        return;
      }

      showNotice("Deleted successfully", "success");
    } catch (err: any) {
      setThread(snapshot);
      showNotice(err.message || "Failed to delete", "error");
    }
  };

  const renderReplies = (replies: ReplyNode[], depth = 0): React.ReactNode[] =>
    replies.map((reply) => {
      const isEditing = editingReplyId === reply.id;
      const isOwner = isReplyOwner(reply);

      return (
        <div
          key={reply.id}
          className={`flex gap-3 transition ${depth === 0 ? "" : "ml-4"}`}
        >
          <button
            type="button"
            onClick={() => navigateToUser(reply.author?.id)}
            className="w-7 h-7 shrink-0 rounded-full bg-gradient-primary flex items-center justify-center text-xs text-primary font-semibold shadow-glow hover:opacity-90 transition"
          >
            {reply.author?.username?.[0]?.toUpperCase() ?? "U"}
          </button>

          <div className="flex-1 space-y-1">
            <div className="text-xs text-text-muted flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => navigateToUser(reply.author?.id)}
                className="text-primary font-medium hover:underline"
              >
                {reply.author?.username ?? "User"}
              </button>

              <span>•</span>
              <span>{formatTime(reply.createdAt)}</span>
              {reply.isEdited && <span>• edited</span>}
              {reply.optimistic && <span>• sending...</span>}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editReplyDraft}
                  onChange={(e) => setEditReplyDraft(e.target.value)}
                  className="min-h-[90px] w-full rounded-lg bg-bg-card px-3 py-2 text-sm text-primary outline-none"
                />

                <div className="flex gap-2 pt-1 text-xs">
                  <button
                    onClick={() => void handleSaveReplyEdit(reply.id)}
                    className="text-primary hover:opacity-90 transition"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => {
                      setEditingReplyId(null);
                      setEditReplyDraft("");
                    }}
                    className="text-text-muted hover:text-primary transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-text-secondary leading-6 whitespace-pre-wrap">
                {reply.content}
              </div>
            )}

            {translations[`REPLY:${reply.id}`] && (
              <div className="mt-2 rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-primary border border-white/10">
                {translations[`REPLY:${reply.id}`]}
              </div>
            )}

            <div className="flex gap-2 pt-1 text-xs flex-wrap">
              <button
                onClick={() =>
                  setReplyingTo((prev) => (prev === reply.id ? null : reply.id))
                }
                className="text-text-muted hover:text-primary transition"
              >
                Reply
              </button>

              <button
                onClick={() => void translateReply(reply.id)}
                disabled={translatingKey === `REPLY:${reply.id}`}
                className="text-text-muted hover:text-primary transition disabled:opacity-50"
              >
                {translatingKey === `REPLY:${reply.id}` ? "Translating…" : "Translate"}
              </button>

              <button
                onClick={() => openReportModal("REPLY", reply.id)}
                className="text-text-muted hover:text-red-400 transition"
              >
                Report
              </button>

              {isOwner && !isEditing && (
                <>
                  <button
                    onClick={() => startEditReply(reply)}
                    className="text-text-muted hover:text-primary transition"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setDeleteTarget({ type: "REPLY", id: reply.id })}
                    className="text-text-muted hover:text-red-400 transition"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>

            {replyingTo === reply.id && thread?.post && (
              <ReplyBox
                postId={thread.post.id}
                parentReplyId={reply.id}
                replyingTo={reply.author?.username ?? "User"}
                onCancel={() => setReplyingTo(null)}
                onReplyCreated={(newReply) => handleNestedReplyCreated(reply.id, newReply)}
                isBanned={Boolean(user?.isBanned)}
              />
            )}

            {reply.children.length > 0 && (
              <div className="mt-3 border-l border-white/5 pl-4 space-y-3">
                {renderReplies(reply.children, depth + 1)}
              </div>
            )}
          </div>
        </div>
      );
    });

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!thread) return <div className="p-6">Not found</div>;

  const currentPoll = thread.poll;
  const currentPost = thread.post;

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="max-w-[900px] mx-auto space-y-6">
        {notice && (
          <div
            className={`rounded-lg border px-4 py-2 text-sm ${getNoticeClasses(
              notice.tone
            )}`}
          >
            {notice.message}
          </div>
        )}

        <button
          onClick={() => router.push("/community")}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-primary transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {reportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-2xl bg-bg-surface p-6 shadow-card">
              <h2 className="text-lg font-semibold text-primary">Report Content</h2>

              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe the issue..."
                className="mt-4 min-h-[120px] w-full rounded-lg bg-bg-card p-3 text-primary outline-none"
              />

              <div className="mt-4 flex gap-2">
                <button
                  onClick={submitReport}
                  disabled={
                    !reportReason.trim() ||
                    reportingKey ===
                      `${reportModal.contentType}:${reportModal.contentId}`
                  }
                  className="bg-gradient-primary px-4 py-2 rounded-lg text-primary text-sm disabled:opacity-50"
                >
                  {reportingKey ===
                  `${reportModal.contentType}:${reportModal.contentId}`
                    ? "Submitting..."
                    : "Submit"}
                </button>

                <button
                  onClick={() => setReportModal(null)}
                  className="text-sm text-text-muted hover:text-primary transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="w-full max-w-md rounded-2xl bg-bg-surface p-6 shadow-card">
              <h2 className="text-lg font-semibold text-primary">
                Confirm Delete
              </h2>

              <p className="mt-3 text-sm text-text-secondary">
                Are you sure you want to delete this{" "}
                {deleteTarget.type.toLowerCase()}? This action cannot be undone.
              </p>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => void handleDeleteConfirmed()}
                  className="rounded-lg bg-red-500/15 px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 transition"
                >
                  Delete
                </button>

                <button
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-lg px-4 py-2 text-sm text-text-muted hover:text-primary transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-bg-surface to-bg-card p-6 shadow-card">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />

          {editingThread ? (
            <div className="relative space-y-3">
              <input
                value={threadTitleDraft}
                onChange={(e) => setThreadTitleDraft(e.target.value)}
                className="w-full rounded-xl bg-bg-card px-4 py-3 text-2xl md:text-3xl font-semibold text-primary outline-none"
              />

              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => void handleSaveThreadEdit()}
                  className="rounded-lg bg-gradient-primary px-4 py-2 text-primary hover:opacity-90 transition"
                >
                  Save
                </button>

                <button
                  onClick={() => {
                    setEditingThread(false);
                    setThreadTitleDraft(thread.title);
                  }}
                  className="rounded-lg px-4 py-2 text-text-muted hover:text-primary transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <h1 className="relative text-2xl md:text-3xl font-semibold text-primary leading-tight">
              {thread.title}
            </h1>
          )}

          <div className="relative mt-4 flex items-center gap-3 text-sm text-text-muted">
            <button
              type="button"
              onClick={() => navigateToUser(thread.author.id)}
              className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-primary text-sm font-semibold shadow-glow hover:opacity-90 transition"
            >
              {thread.author.username?.[0]?.toUpperCase() ?? "U"}
            </button>

            <button
              type="button"
              onClick={() => navigateToUser(thread.author.id)}
              className="text-primary font-medium hover:underline"
            >
              {thread.author.username}
            </button>

            <span>•</span>
            <span>{formatTime(thread.createdAt)}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <button
              onClick={() => openReportModal("THREAD", thread.id)}
              className="text-text-muted hover:text-red-400 transition"
            >
              Report thread
            </button>

            {isThreadOwner && !editingThread && (
              <>
                <button
                  onClick={() => {
                    setEditingThread(true);
                    setThreadTitleDraft(thread.title);
                  }}
                  className="text-text-muted hover:text-primary transition"
                >
                  Edit thread
                </button>

                <button
                  onClick={() => setDeleteTarget({ type: "THREAD", id: thread.id })}
                  className="text-text-muted hover:text-red-400 transition"
                >
                  Delete thread
                </button>
              </>
            )}
          </div>
        </div>

        {!currentPoll && (
          <div className="flex items-center justify-between">
            <div className="text-xs text-text-muted">
              {isThreadOwner
                ? "You can create a poll for this thread"
                : "Only the thread author can create a poll"}
            </div>

            {isThreadOwner && (
              <button
                onClick={() => setShowPollCreator(true)}
                className="rounded-xl bg-gradient-primary px-4 py-2 text-sm text-primary shadow-glow hover:opacity-90 transition"
              >
                Create Poll
              </button>
            )}
          </div>
        )}

        {showPollCreator && (
          <div className="rounded-2xl border border-white/10 bg-bg-surface p-5 shadow-card space-y-4">
            <h3 className="text-primary font-semibold">Create Poll</h3>

            <input
              placeholder="Poll question"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="w-full rounded-lg bg-bg-card px-3 py-2 text-sm text-primary outline-none"
            />

            {pollOptions.map((option, i) => (
              <input
                key={i}
                placeholder={`Option ${i + 1}`}
                value={option}
                onChange={(e) => updatePollOption(i, e.target.value)}
                className="w-full rounded-lg bg-bg-card px-3 py-2 text-sm text-primary outline-none"
              />
            ))}

            <button
              onClick={addPollOption}
              className="text-xs text-text-muted hover:text-primary transition"
            >
              + Add option
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => void handleCreatePoll()}
                className="bg-gradient-primary px-4 py-2 rounded-lg text-primary text-sm hover:opacity-90 transition"
              >
                Create Poll
              </button>

              <button
                onClick={() => setShowPollCreator(false)}
                className="text-sm text-text-muted hover:text-primary transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {currentPoll && (
          <div className="space-y-3">
            {isPollOwner && (
              <div className="rounded-2xl border border-white/10 bg-bg-surface p-4 shadow-card space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-primary">
                    Poll Owner Controls
                  </h3>

                  {!editingPoll ? (
                    <div className="flex gap-2 text-xs">
                      <button
                        onClick={() => {
                          setEditingPoll(true);
                          setPollQuestionDraft(currentPoll.question);
                          setPollDeadlineDraft(
                            currentPoll.deadline
                              ? new Date(currentPoll.deadline).toISOString().slice(0, 16)
                              : ""
                          );
                        }}
                        className="text-text-muted hover:text-primary transition"
                      >
                        Edit poll
                      </button>

                      <button
                        onClick={() =>
                          setDeleteTarget({ type: "POLL", id: currentPoll.id })
                        }
                        className="text-text-muted hover:text-red-400 transition"
                      >
                        Delete poll
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 text-xs">
                      <button
                        onClick={() => void handleSavePollEdit()}
                        className="text-text-muted hover:text-primary transition"
                      >
                        Save
                      </button>

                      <button
                        onClick={() => {
                          setEditingPoll(false);
                          setPollQuestionDraft(currentPoll.question);
                          setPollDeadlineDraft(
                            currentPoll.deadline
                              ? new Date(currentPoll.deadline).toISOString().slice(0, 16)
                              : ""
                          );
                          setNewPollOptionDraft("");
                        }}
                        className="text-text-muted hover:text-primary transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {editingPoll && (
                  <div className="space-y-3">
                    <input
                      value={pollQuestionDraft}
                      onChange={(e) => setPollQuestionDraft(e.target.value)}
                      placeholder="Poll question"
                      className="w-full rounded-lg bg-bg-card px-3 py-2 text-sm text-primary outline-none"
                    />

                    <input
                      type="datetime-local"
                      value={pollDeadlineDraft}
                      onChange={(e) => setPollDeadlineDraft(e.target.value)}
                      className="w-full rounded-lg bg-bg-card px-3 py-2 text-sm text-primary outline-none"
                    />

                    <div className="flex gap-2">
                      <input
                        value={newPollOptionDraft}
                        onChange={(e) => setNewPollOptionDraft(e.target.value)}
                        placeholder="Add new poll option"
                        className="flex-1 rounded-lg bg-bg-card px-3 py-2 text-sm text-primary outline-none"
                      />

                      <button
                        onClick={() => void handleAddPollOption()}
                        className="rounded-lg bg-gradient-primary px-4 py-2 text-sm text-primary hover:opacity-90 transition"
                      >
                        Add option
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <PollCard
              poll={currentPoll}
              onVote={(updatedPoll) =>
                setThread((prev) => {
                  if (!prev || !prev.poll) return prev;

                  return {
                    ...prev,
                    poll: {
                      ...prev.poll,        // ✅ keeps deadline
                      ...updatedPoll,      // ✅ updates votes, userVote, etc.
                    },
                  };
                })
              }
              onReport={() => openReportModal("POLL", currentPoll.id)}
              isBanned={Boolean(user?.isBanned)}
            />
          </div>
        )}

        {currentPost && (
          <div className="rounded-2xl border border-white/10 bg-bg-card p-6 shadow-card space-y-4">
            {editingPost ? (
              <div className="space-y-3">
                <textarea
                  value={postDraft}
                  onChange={(e) => setPostDraft(e.target.value)}
                  className="min-h-[140px] w-full rounded-xl bg-bg-surface px-4 py-3 text-[15px] leading-7 text-text-primary outline-none"
                />

                <div className="flex gap-2 text-sm">
                  <button
                    onClick={() => void handleSavePostEdit()}
                    className="rounded-lg bg-gradient-primary px-4 py-2 text-primary hover:opacity-90 transition"
                  >
                    Save
                  </button>

                  <button
                    onClick={() => {
                      setEditingPost(false);
                      setPostDraft(currentPost.content);
                    }}
                    className="rounded-lg px-4 py-2 text-text-muted hover:text-primary transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[15px] leading-7 text-text-primary whitespace-pre-wrap">
                {currentPost.content}
              </p>
            )}

            <div className="flex justify-between items-center gap-3 text-xs text-text-muted flex-wrap">
              <span>
                {currentPost.replyCount}{" "}
                {currentPost.replyCount === 1 ? "reply" : "replies"}
                {currentPost.isEdited ? " • edited" : ""}
              </span>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => openReportModal("POST", currentPost.id)}
                  className="hover:text-red-400 transition"
                >
                  Report
                </button>

                {isPostOwner && !editingPost && (
                  <>
                    <button
                      onClick={() => {
                        setEditingPost(true);
                        setPostDraft(currentPost.content);
                      }}
                      className="hover:text-primary transition"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        setDeleteTarget({ type: "POST", id: currentPost.id })
                      }
                      className="hover:text-red-400 transition"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-white/5">
              <ReplyBox
                postId={currentPost.id}
                onReplyCreated={handleTopLevelReplyCreated}
                isBanned={Boolean(user?.isBanned)}
              />
            </div>

            <div className="pt-4 space-y-4">
              {currentPost.replies.map((reply) => (
                <div key={reply.id} className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigateToUser(reply.author?.id)}
                    className="w-7 h-7 shrink-0 rounded-full bg-gradient-primary flex items-center justify-center text-xs text-primary hover:opacity-90 transition"
                  >
                    {reply.author?.username?.[0]?.toUpperCase() ?? "U"}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="text-xs text-text-muted flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => navigateToUser(reply.author?.id)}
                        className="text-primary font-medium hover:underline"
                      >
                        {reply.author?.username ?? "User"}
                      </button>

                      <span>•</span>
                      <span>{formatTime(reply.createdAt)}</span>
                      {reply.isEdited && <span>• edited</span>}
                      {reply.optimistic && <span>• sending...</span>}
                    </div>

                    {editingReplyId === reply.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editReplyDraft}
                          onChange={(e) => setEditReplyDraft(e.target.value)}
                          className="min-h-[90px] w-full rounded-lg bg-bg-surface px-3 py-2 text-sm text-primary outline-none"
                        />

                        <div className="mt-2 flex gap-2 text-xs">
                          <button
                            onClick={() => void handleSaveReplyEdit(reply.id)}
                            className="text-text-muted hover:text-primary transition"
                          >
                            Save
                          </button>

                          <button
                            onClick={() => {
                              setEditingReplyId(null);
                              setEditReplyDraft("");
                            }}
                            className="text-text-muted hover:text-primary transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-text-secondary whitespace-pre-wrap">
                        {reply.content}
                      </div>
                    )}

                    {translations[`REPLY:${reply.id}`] && (
                      <div className="mt-2 rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-primary border border-white/10">
                        {translations[`REPLY:${reply.id}`]}
                      </div>
                    )}

                    <div className="mt-2 flex gap-2 text-xs flex-wrap">
                      <button
                        onClick={() =>
                          setReplyingTo((prev) => (prev === reply.id ? null : reply.id))
                        }
                        className="text-text-muted hover:text-primary transition"
                      >
                        Reply
                      </button>

                      <button
                        onClick={() => void translateReply(reply.id)}
                        disabled={translatingKey === `REPLY:${reply.id}`}
                        className="text-text-muted hover:text-primary transition disabled:opacity-50"
                      >
                        {translatingKey === `REPLY:${reply.id}` ? "Translating…" : "Translate"}
                      </button>

                      <button
                        onClick={() => openReportModal("REPLY", reply.id)}
                        className="text-text-muted hover:text-red-400 transition"
                      >
                        Report
                      </button>

                      {isReplyOwner(reply) && editingReplyId !== reply.id && (
                        <>
                          <button
                            onClick={() => startEditReply(reply)}
                            className="text-text-muted hover:text-primary transition"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              setDeleteTarget({ type: "REPLY", id: reply.id })
                            }
                            className="text-text-muted hover:text-red-400 transition"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>

                    {replyingTo === reply.id && (
                      <ReplyBox
                        postId={currentPost.id}
                        parentReplyId={reply.id}
                        replyingTo={reply.author?.username ?? "User"}
                        onCancel={() => setReplyingTo(null)}
                        onReplyCreated={(newReply) =>
                          handleNestedReplyCreated(reply.id, newReply)
                        }
                        isBanned={Boolean(user?.isBanned)}
                      />
                    )}

                    {reply.children.length > 0 && (
                      <div className="mt-3 border-l border-white/5 pl-4 space-y-3">
                        {renderReplies(reply.children, 1)}
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