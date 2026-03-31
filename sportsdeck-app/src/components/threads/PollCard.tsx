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
  isBanned = false,
}: {
  poll: Poll;
  onVote: (data: Poll) => void;
  onReport?: () => void;
  isBanned?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (optionId: string) => {
    if (loading || poll.isClosed) return;
    if (isBanned) {
      setError("Your account is banned. Voting is disabled.");
      return;
    }

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
        const message =
          data.error ||
          data.message ||
          (res.status === 403
            ? "Your account is banned or this poll is no longer available."
            : "Vote failed");
        throw new Error(message);
      }

      // Merge partial response (options + userVote) back onto the existing poll
      // so we never lose id, question, isClosed, etc.
      const rawOptions: { id: string; text: string; votes: number }[] =
        data.options ?? [];
      const totalVotes = rawOptions.reduce((sum, o) => sum + (o.votes ?? 0), 0);
      const mergedOptions: Option[] = rawOptions.map((o) => ({
        id: o.id,
        text: o.text,
        votes: o.votes,
        percentage:
          totalVotes > 0 ? Math.round((o.votes / totalVotes) * 100) : 0,
      }));

      onVote({
        ...poll,
        options: mergedOptions.length ? mergedOptions : poll.options,
        userVote: data.userVote ?? null,
        totalVotes,
      });

    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Vote failed");
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
              disabled={poll.isClosed || loading || isBanned}
              aria-disabled={poll.isClosed || loading || isBanned}
              className={`relative w-full overflow-hidden rounded-xl border p-3 text-left text-sm transition ${
                isBanned
                  ? "border-white/10 bg-bg-card opacity-60 cursor-not-allowed"
                  : isSelected
                  ? "border-primary-500/40 bg-primary-500/10 hover:bg-primary-500/15"
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

      {/* BANNED NOTICE — always visible when banned */}
      {isBanned && (
        <div className="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          Your account is banned. Voting is disabled.
        </div>
      )}

      {/* ERROR */}
      {!isBanned && error && (
        <div className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
        <span>{poll.totalVotes} total votes</span>
        {onReport ? (
          <button
            type="button"
            onClick={onReport}
            className="text-text-muted hover:text-red-400 transition"
          >
            Report poll
          </button>
        ) : null}
      </div>
    </div>
  );
}