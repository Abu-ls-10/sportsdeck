"use client";

import { useState } from "react";

type Props = {
  threadId: string;
  onPostCreated: (post: any) => void;
};

export default function PostComposer({ threadId, onPostCreated }: Props) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    try {
      setLoading(true);

      const res = await fetch(`/api/threads/${threadId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error();

      const newPost = await res.json();

      onPostCreated(newPost); // 🔥 optimistic add
      setContent("");
    } catch {
      alert("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/6 bg-bg-surface p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start a discussion..."
        className="w-full resize-none rounded-xl bg-bg-card p-3 text-sm text-white"
        rows={3}
      />

      <div className="mt-2 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded-lg bg-primary-500 px-4 py-1.5 text-sm text-white"
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}