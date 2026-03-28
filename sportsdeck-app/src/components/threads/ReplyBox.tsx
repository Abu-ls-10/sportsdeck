"use client";

import { useState } from "react";

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
  onReplyCreated?: (reply: Reply) => void; // 🔥 optimistic update
};

export default function ReplyBox({
  postId,
  onReplyCreated,
}: ReplyBoxProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post reply");
      }

      const newReply = await res.json();

      // 🔥 optimistic update
      onReplyCreated?.(newReply);

      // reset input
      setContent("");

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      
      {/* TEXTAREA */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a reply..."
        rows={2}
        className="w-full resize-none rounded-xl border border-white/10 bg-bg-surface p-3 text-sm text-white placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-500"
      />

      {/* ACTION BAR */}
      <div className="flex items-center justify-between">
        
        {/* Error */}
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        {/* Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className="ml-auto rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-600 disabled:opacity-50"
        >
          {loading ? "Posting..." : "Reply"}
        </button>
      </div>
    </div>
  );
}