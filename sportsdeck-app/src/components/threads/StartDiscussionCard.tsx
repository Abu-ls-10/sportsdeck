"use client";

import { useState } from "react";

type Props = {
  onSuccess?: () => void | Promise<void>;
};

export default function StartDiscussionCard({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Failed to create thread");
      }

      // Reset form
      setTitle("");
      setContent("");

      // Close modal
      setOpen(false);

      // Refresh threads
      await onSuccess?.();

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* CARD */}
      <div className="rounded-2xl border border-dashed border-primary-500/30 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(14,165,233,0.02))] px-6 py-8 text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-xl font-semibold text-white shadow-glow">
          +
        </div>

        <h3 className="mt-4 text-xl font-semibold text-white">
          Have something to share?
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
          Start a new thread and engage with the community.
        </p>

        <button
          onClick={() => setOpen(true)}
          className="mt-5 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Start a Discussion
        </button>
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-bg-surface p-6 shadow-xl">
            
            <h2 className="text-lg font-semibold text-white">
              Create Thread
            </h2>

            {/* Title */}
            <div className="mt-4">
              <label className="text-xs text-text-secondary">
                Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter thread title..."
                className="mt-1 w-full rounded-lg border border-white/10 bg-bg-main px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
              />
            </div>

            {/* Content */}
            <div className="mt-4">
              <label className="text-xs text-text-secondary">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post..."
                rows={4}
                className="mt-1 w-full rounded-lg border border-white/10 bg-bg-main px-3 py-2 text-sm text-white outline-none focus:border-primary-500"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mt-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-text-secondary hover:text-white"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-lg bg-gradient-primary px-4 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-50"
              >
                {loading ? "Posting..." : "Post Thread"}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}