"use client";

import { useState } from "react";

type Option = {
  id: string;
  text: string;
  _count?: { votes: number };
};

type Poll = {
  id: string;
  question: string;
  options: Option[];
  isClosed: boolean;
};

export default function PollCard({ poll }: { poll: Poll }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localOptions, setLocalOptions] = useState(poll.options);
  const [error, setError] = useState<string | null>(null);

  const totalVotes = localOptions.reduce(
    (sum, o) => sum + (o._count?.votes ?? 0),
    0
  );

  const handleVote = async () => {
    if (!selected || loading || poll.isClosed) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionId: selected }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Vote failed");
      }

      // Optimistic update
      setLocalOptions((prev) =>
        prev.map((opt) =>
          opt.id === selected
            ? {
                ...opt,
                _count: {
                  votes: (opt._count?.votes ?? 0) + 1,
                },
              }
            : opt
        )
      );

      setVoted(true);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Vote failed");
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
        {localOptions.map((opt) => {
          const votes = opt._count?.votes ?? 0;
          const percent =
            totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;

          const isSelected = selected === opt.id;
          const showResults = voted || poll.isClosed;

          return (
            <button
              key={opt.id}
              onClick={() => !showResults && setSelected(opt.id)}
              disabled={showResults}
              className={`relative w-full overflow-hidden rounded-xl border p-3 text-left text-sm transition ${
                isSelected
                  ? "border-primary-500/40 bg-primary-500/10"
                  : "border-white/10 bg-bg-card hover:bg-bg-elevated"
              }`}
            >
              {/* RESULT BAR */}
              {showResults && (
                <div
                  className="absolute inset-y-0 left-0 bg-primary-500/20 transition-all"
                  style={{ width: `${percent}%` }}
                />
              )}

              <div className="relative flex items-center justify-between">
                <span className="text-white">{opt.text}</span>

                {showResults && (
                  <span className="text-xs text-text-muted">
                    {percent}%
                  </span>
                )}
              </div>

              {showResults && (
                <div className="relative mt-1 text-[11px] text-text-muted">
                  {votes} votes
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ACTION */}
      {!poll.isClosed && !voted && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleVote}
            disabled={!selected || loading}
            className="rounded-lg bg-gradient-primary px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Voting..." : "Vote"}
          </button>
        </div>
      )}

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
        {totalVotes} total votes
      </div>
    </div>
  );
}