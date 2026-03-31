"use client";

import { useState, useRef } from "react";
import { showNotice } from "@/lib/clientNotice";
import { getApiErrorMessage, isBannedActionError } from "@/lib/apiError";

type Reply = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  parentReplyId?: string | null;
};

type ReplyBoxProps = {
  postId: string;
  parentReplyId?: string | null;
  replyingTo?: string | null;
  onCancel?: () => void;
  onReplyCreated?: (reply: Reply) => void;
  isBanned?: boolean;
};

const MAX_LENGTH = 500;

export default function ReplyBox({
  postId,
  parentReplyId = null,
  replyingTo = null,
  onCancel,
  onReplyCreated,
  isBanned = false,
}: ReplyBoxProps) {
  const [content, setContent] = useState("");
  const [focused, setFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // =========================
  // AUTO RESIZE
  // =========================
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  // =========================
  // AVATAR
  // =========================
  const Avatar = ({ username }: { username?: string }) => {
    return (
      <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-semibold shrink-0">
        {username?.[0]?.toUpperCase() ?? "U"}
      </div>
    );
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || loading) return;
    if (isBanned) {
      setError("Your account is banned. Replying is disabled.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/posts/${postId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: trimmed,
          parentReplyId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (isBannedActionError(res.status, data)) {
          throw new Error(
            "Your account is currently banned, so posting is disabled. If you think this is a mistake, submit an appeal from My Appeals."
          );
        }
        throw new Error(getApiErrorMessage(data, "Failed to post reply"));
      }

      // optimistic update
      onReplyCreated?.(data);

      // reset
      setContent("");
      setFocused(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // clear reply target
      onCancel?.();

    } catch (err: any) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      showNotice({
        tone: "warning",
        title: "Unable to post reply",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // KEYBOARD UX
  // =========================
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mt-4">

      {/* BANNED NOTICE */}
      {isBanned && (
        <div className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          Your account is banned. Replying is disabled.
        </div>
      )}

      {/* REPLYING TO BAR */}
      {replyingTo && (
        <div className="mb-2 text-xs text-accent-300 flex items-center justify-between">
          <span>
            Replying to <span className="font-medium">@{replyingTo}</span>
          </span>

          <button
            onClick={onCancel}
            className="text-text-muted hover:text-white transition"
          >
            Cancel
          </button>
        </div>
      )}

      <div
        className={`flex gap-3 rounded-2xl border p-3 transition ${
          focused || replyingTo
            ? "border-primary-500/40 bg-bg-surface"
            : "border-white/6 bg-bg-surface/70"
        }`}
      >
        {/* Avatar */}
        <Avatar username="You" />

        {/* Input */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              if (e.target.value.length <= MAX_LENGTH) {
                setContent(e.target.value);
                autoResize();
              }
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => !content && !replyingTo && setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={
              replyingTo
                ? `Reply to @${replyingTo}...`
                : "Write a reply..."
            }
            rows={1}
            className="w-full resize-none bg-transparent text-sm text-white placeholder:text-text-muted outline-none"
          />

          {/* ACTION BAR */}
          {(focused || content || replyingTo) && (
            <div className="mt-2 flex items-center justify-between">

              {/* Left */}
              <div className="flex items-center gap-3 text-xs text-text-muted">
                <span>{content.length}/{MAX_LENGTH}</span>

                {error && (
                  <span className="text-red-400">{error}</span>
                )}
              </div>

              {/* Right */}
              <div className="flex items-center gap-2">

                {/* Cancel */}
                <button
                  onClick={() => {
                    setContent("");
                    setFocused(false);
                    onCancel?.();
                  }}
                  className="text-xs text-text-muted hover:text-white transition"
                  disabled={loading}
                >
                  Cancel
                </button>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !content.trim() || isBanned}
                  className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Posting..." : "Reply"}
                </button>

              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}