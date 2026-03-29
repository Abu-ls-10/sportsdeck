"use client";

import { useState, useRef } from "react";

type Reply = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
  };
};

type ReplyBoxProps = {
  postId: string;
  onReplyCreated?: (reply: Reply) => void;
};

const MAX_LENGTH = 500;

export default function ReplyBox({
  postId,
  onReplyCreated,
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
  // SUBMIT
  // =========================
  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed || loading) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/posts/${postId}/replies`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: trimmed }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to post reply");
      }

      // optimistic update
      onReplyCreated?.(data);

      // reset
      setContent("");
      setFocused(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
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
      
      <div
        className={`flex gap-3 rounded-2xl border p-3 transition ${
          focused
            ? "border-primary-500/40 bg-bg-surface"
            : "border-white/6 bg-bg-surface/70"
        }`}
      >
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-primary-500/30 shrink-0" />

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
            onBlur={() => !content && setFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Write a reply..."
            rows={1}
            className="w-full resize-none bg-transparent text-sm text-white placeholder:text-text-muted outline-none"
          />

          {/* ACTION BAR */}
          {(focused || content) && (
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
                  }}
                  className="text-xs text-text-muted hover:text-white transition"
                  disabled={loading}
                >
                  Cancel
                </button>

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={loading || !content.trim()}
                  className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-600 disabled:opacity-50"
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