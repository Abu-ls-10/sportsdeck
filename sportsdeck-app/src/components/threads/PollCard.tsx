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
}: {
  poll: Poll;
  onVote: (data: Poll) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (optionId: string) => {
    if (loading || poll.isClosed || poll.userVote) return;

    // =========================
    // OPTIMISTIC UPDATE
    // =========================
    const optimisticPoll = {
      ...poll,
      userVote: optionId,
      totalVotes: poll.totalVotes + 1,
      options: poll.options.map((opt) => {
        if (opt.id === optionId) {
          const newVotes = opt.votes + 1;
          return { ...opt, votes: newVotes };
        }
        return opt;
      }),
    };

    // recalc percentages
    optimisticPoll.options = optimisticPoll.options.map((opt) => ({
      ...opt,
      percentage: optimisticPoll.totalVotes
        ? Math.round((opt.votes / optimisticPoll.totalVotes) * 100)
        : 0,
    }));

    // instant UI update
    onVote(optimisticPoll);

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
        throw new Error(data.error || "Vote failed");
      }

      // sync with backend (real values)
      onVote(data);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Vote failed");

      // rollback UI if request failed
      onVote(poll);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/6 bg-bg-surface p-5 shadow-card">
      
      {/* QUESTION */}
      <h3 className="text-base font-semibold text-white">
        {poll.question}
      </h3>

      {/* OPTIONS */}
      <div className="mt-4 space-y-2">
        {poll.options.map((opt) => {
          const isSelected = poll.userVote === opt.id;

          return (
            <button
              key={opt.id}
              onClick={() => handleClick(opt.id)}
              disabled={poll.isClosed || loading || !!poll.userVote}
              aria-disabled={poll.isClosed || loading || !!poll.userVote}
              className={`relative w-full overflow-hidden rounded-xl border p-3 text-left text-sm transition ${
                isSelected
                  ? "border-primary-500/40 bg-primary-500/10"
                  : "border-white/10 bg-bg-card hover:bg-bg-elevated"
              }`}
            >
              {/* RESULT BAR */}
              <div
                className="absolute inset-y-0 left-0 bg-primary-500/20 transition-all"
                style={{ width: `${opt.percentage}%` }}
              />

              <div className="relative flex items-center justify-between">
                <span className="text-white">{opt.text}</span>

                <span className="text-xs text-text-muted">
                  {opt.percentage}%
                </span>
              </div>

              <div className="relative mt-1 text-[11px] text-text-muted">
                {opt.votes} votes
              </div>
            </button>
          );
        })}
      </div>

      {/* CLOSED STATE */}
      {poll.isClosed && (
        <div className="mt-3 text-xs text-text-muted">
          Poll closed
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="mt-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* TOTAL */}
      <div className="mt-3 text-xs text-text-muted">
        {poll.totalVotes} total votes
      </div>
    </div>
  );
}