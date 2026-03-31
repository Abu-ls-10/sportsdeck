"use client";

import { useEffect, useState, useRef } from "react";
import { showNotice } from "@/lib/clientNotice";
import { getApiErrorMessage, isBannedActionError } from "@/lib/apiError";

type Props = {
  onSuccess?: () => void | Promise<void>;
  isBanned?: boolean;
};

type Team = {
  id: string;
  name: string;
};

export default function StartDiscussionCard({ onSuccess, isBanned = false }: Props) {
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [teamId, setTeamId] = useState<string>("all");

  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [teams, setTeams] = useState<Team[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // =========================
  // FETCH TEAMS
  // =========================
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const res = await fetch("/api/teams");
        const data = await res.json().catch(() => []);
        setTeams(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load teams");
      }
    };

    loadTeams();
  }, []);

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
  // TAG HANDLING
  // =========================
  const addTag = () => {
    const value = tagInput.trim().toLowerCase();
    if (!value || tags.includes(value)) return;

    setTags((prev) => [...prev, value]);
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async () => {
    if (isBanned) {
      setError("Your account is banned. Creating threads is disabled.");
      return;
    }
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
          teamId: teamId !== "all" ? teamId : undefined,
          tags,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (isBannedActionError(res.status, data)) {
          throw new Error(
            "Your account is currently banned, so posting is disabled. If you think this is a mistake, submit an appeal from My Appeals."
          );
        }
        throw new Error(getApiErrorMessage(data, "Failed to create thread"));
      }

      // RESET
      setTitle("");
      setContent("");
      setTags([]);
      setTeamId("all");

      setOpen(false);

      await onSuccess?.();

    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      showNotice({
        tone: "warning",
        title: "Unable to create thread",
        message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* CARD */}
      <div className="rounded-2xl border border-dashed border-primary-500/30 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(14,165,233,0.02))] px-6 py-8 text-center shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-xl font-semibold text-primary shadow-glow">
          +
        </div>

        <h3 className="mt-4 text-xl font-semibold text-primary">
          Have something to share?
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
          Start a new thread and engage with the community.
        </p>

        {isBanned ? (
          <div className="mt-5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
            Your account is banned. Creating threads is disabled.
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="mt-5 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary hover:brightness-110"
          >
            Start a Discussion
          </button>
        )}
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-bg-surface p-6 shadow-xl space-y-5">

            <h2 className="text-xl font-semibold text-primary">
              Create Thread
            </h2>

            {/* BANNED NOTICE */}
            {isBanned && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                Your account is banned. Creating threads is disabled.
              </div>
            )}

            {/* TITLE */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Thread title..."
              className="w-full rounded-xl border border-white/10 bg-bg-main px-4 py-3 text-primary focus:border-primary-500 outline-none"
            />

            {/* CONTENT */}
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                autoResize();
              }}
              placeholder="Write your post..."
              rows={3}
              className="w-full resize-none rounded-xl border border-white/10 bg-bg-main px-4 py-3 text-primary focus:border-primary-500 outline-none"
            />

            {/* TEAM */}
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-bg-main px-3 py-2 text-sm"
            >
              <option value="all">No team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            {/* TAG INPUT */}
            <div>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tag..."
                  className="flex-1 rounded-lg border border-white/10 bg-bg-main px-3 py-2 text-sm"
                />

                <button
                  onClick={addTag}
                  className="px-3 py-2 text-sm bg-primary-500 rounded-lg text-primary"
                >
                  Add
                </button>
              </div>

              {/* TAGS */}
              <div className="mt-2 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 bg-primary-500/20 text-primary-400 px-2 py-1 rounded-md text-xs"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <div className="text-sm text-red-400">{error}</div>
            )}

            {/* ACTIONS */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-text-muted hover:text-primary"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={loading || isBanned}
                className="rounded-lg bg-gradient-primary px-5 py-2 text-sm text-primary disabled:opacity-50 disabled:cursor-not-allowed"
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