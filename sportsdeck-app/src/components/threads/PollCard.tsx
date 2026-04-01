"use client";

import { useState } from "react";

type Option = {
  id: string;
  text: string;
  votes: number;
  percentage: number;
};

type Poll = {
  id: string;
  question: string;
  options: Option[];
  isClosed: boolean;
  userVote: string | null;
  totalVotes: number;
};

export default function PollCard({
  poll,
  onVote,
  onReport,
  onEdit,
  onDelete,
  isOwner = false,
  isBanned = false,
}: {
  poll: Poll;
  onVote: (data: Poll) => void;
  onReport?: () => void;
  onEdit?: (data: { question: string }) => Promise<void>;
  onDelete?: () => void;
  isOwner?: boolean;
  isBanned?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(poll.question);

  // =========================
  // VOTE (OPTIMISTIC)
  // =========================
  const handleClick = async (optionId: string) => {
    if (loading || poll.isClosed) return;
    if (isBanned) {
      setError("Your account is banned.");
      return;
    }

    const previousPoll = poll;
    const previousUserVote = poll.userVote;
    const isUnvote = previousUserVote === optionId;
    const nextUserVote = isUnvote ? null : optionId;

    // Optimistic update that supports vote, switch, and unvote without drifting totals.
    const optimisticOptions = poll.options.map((opt) => {
      let nextVotes = opt.votes;
      if (!previousUserVote && opt.id === optionId) nextVotes += 1;
      if (previousUserVote && previousUserVote !== optionId) {
        if (opt.id === previousUserVote) nextVotes -= 1;
        if (opt.id === optionId) nextVotes += 1;
      }
      if (previousUserVote === optionId && opt.id === optionId) nextVotes -= 1;
      return { ...opt, votes: Math.max(0, nextVotes) };
    });

    const optimisticTotalVotes = optimisticOptions.reduce((sum, opt) => sum + opt.votes, 0);
    const optimisticWithPercentages = optimisticOptions.map((opt) => ({
      ...opt,
      percentage:
        optimisticTotalVotes > 0
          ? Math.round((opt.votes / optimisticTotalVotes) * 100)
          : 0,
    }));

    onVote({
      ...poll,
      options: optimisticWithPercentages,
      userVote: nextUserVote,
      totalVotes: optimisticTotalVotes,
    });

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Vote failed");
      }

      if (Array.isArray(data?.options)) {
        const serverTotalVotes = data.options.reduce(
          (sum: number, opt: { votes?: number }) => sum + Number(opt.votes ?? 0),
          0
        );
        onVote({
          ...poll,
          options: data.options.map(
            (opt: { id: string; text: string; votes: number }) => ({
              id: String(opt.id),
              text: String(opt.text),
              votes: Number(opt.votes ?? 0),
              percentage:
                serverTotalVotes > 0
                  ? Math.round((Number(opt.votes ?? 0) / serverTotalVotes) * 100)
                  : 0,
            })
          ),
          userVote: data.userVote ?? null,
          totalVotes: serverTotalVotes,
        });
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Vote failed");
      onVote(previousPoll);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // EDIT POLL
  // =========================
  const handleSave = async () => {
    if (!question.trim()) return;

    await onEdit?.({ question });
    setEditing(false);
  };

  return (
    <div className="rounded-2xl border border-white/6 bg-bg-surface p-5 shadow-card">

      {/* OWNER ACTIONS */}
      {isOwner && !editing && (
        <div className="flex justify-end gap-2 text-xs mb-2">
          <button
            onClick={() => setEditing(true)}
            className="text-text-muted hover:text-primary"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-text-muted hover:text-red-400"
          >
            Delete
          </button>
        </div>
      )}

      {/* EDIT MODE */}
      {editing ? (
        <div className="space-y-3">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full rounded bg-bg-card p-2 text-primary"
          />
          <div className="flex gap-2 text-xs">
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <h3 className="text-base font-semibold text-primary">
          {poll.question}
        </h3>
      )}

      {/* OPTIONS */}
      <div className="mt-4 space-y-2">
        {poll.options.map((opt) => {
          const isSelected = poll.userVote === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => handleClick(opt.id)}
              disabled={poll.isClosed || loading || isBanned}
              className={`relative w-full rounded-xl border p-3 text-left ${
                isSelected
                  ? "border-primary-500/40 bg-primary-500/10"
                  : "border-white/10 bg-bg-card"
              }`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-primary-500/20"
                style={{ width: `${opt.percentage}%` }}
              />

              <div className="relative flex justify-between">
                <span>{opt.text}</span>
                <span>{opt.percentage}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* FOOTER */}
      <div className="mt-3 flex justify-between text-xs text-text-muted">
        <span>{poll.totalVotes} votes</span>
        {onReport && (
          <button onClick={onReport}>Report</button>
        )}
      </div>

      {error && (
        <div className="mt-2 text-red-400 text-sm">{error}</div>
      )}
    </div>
  );
}