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
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    if (!selected) return;

    try {
      setLoading(true);

      await fetch(`/api/polls/${poll.id}/vote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ optionId: selected }),
      });

      window.location.reload(); // quick refresh
    } catch {
      alert("Vote failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/6 bg-bg-surface p-4">
      <h3 className="text-sm font-semibold text-white">{poll.question}</h3>

      <div className="mt-3 space-y-2">
        {poll.options.map((opt) => (
          <label
            key={opt.id}
            className="flex items-center gap-2 text-sm text-text-secondary"
          >
            <input
              type="radio"
              name="poll"
              value={opt.id}
              onChange={() => setSelected(opt.id)}
            />
            {opt.text}
          </label>
        ))}
      </div>

      {!poll.isClosed && (
        <button
          onClick={handleVote}
          disabled={loading}
          className="mt-3 rounded-lg bg-primary-500 px-3 py-1 text-xs text-white"
        >
          Vote
        </button>
      )}
    </div>
  );
}