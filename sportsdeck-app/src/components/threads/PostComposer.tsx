"use client";

import { useState, useRef } from "react";
import { showNotice } from "@/lib/clientNotice";
import { getApiErrorMessage, isBannedActionError } from "@/lib/apiError";

type Props = {
  threadId: string;
  onPostCreated: (post: any) => void;
};

const MAX_LENGTH = 2000;

export default function PostComposer({
  threadId,
  onPostCreated,
}: Props) {
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

      const res = await fetch(`/api/threads/${threadId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (isBannedActionError(res.status, data)) {
          throw new Error(
            "Your account is currently banned, so posting is disabled. If you think this is a mistake, submit an appeal from My Appeals."
          );
        }
        throw new Error(getApiErrorMessage(data, "Failed to create post"));
      }

      // optimistic update
      onPostCreated(data);

      // reset
      setContent("");
      setFocused(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      showNotice({
        tone: "warning",
        title: "Unable to create post",
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
    <div
      className={`rounded-2xl border p-4 transition ${
        focused
          ? "border-primary-500/40 bg-bg-surface shadow-card"
          : "border-white/6 bg-bg-surface/70"
      }`}
    >
      <div className="flex gap-3">
        
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full bg-primary-500/30 shrink-0" />

        {/* Content */}
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
            placeholder="Share your thoughts..."
            rows={1}
            className="w-full resize-none bg-transparent text-sm text-white placeholder:text-text-muted outline-none"
          />

          {/* ACTION BAR */}
          {(focused || content) && (
            <div className="mt-3 flex items-center justify-between">
              
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
                  className="rounded-lg bg-gradient-primary px-4 py-2 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-50"
                >
                  {loading ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}