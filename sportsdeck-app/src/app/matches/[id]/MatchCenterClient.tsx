"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

/* ---------------- TYPES (unchanged) ---------------- */

type Team = {
  id: string;
  name: string;
  shortName?: string;
  logoUrl?: string;
};

type MatchData = {
  id: string;
  status: string;
  matchDate: string;
  venue: string;
  stage: string;
  matchday: number;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: Team;
  awayTeam: Team;
};

type FanTeam = {
  id: string;
  name: string;
  shortName: string;
};

type Author = {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  favoriteTeam?: FanTeam | null;
};

type Reply = {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
};

type Post = {
  id: string;
  content: string;
  createdAt: string;
  author: Author;
  replies: Reply[];
  _count?: { replies: number };
};

type PollOption = {
  id: string;
  optionText: string;
  _count?: { votes: number };
};

type Poll = {
  id: string;
  question: string;
  deadline: string;
  isClosed: boolean;
  options: PollOption[];
};

type ThreadData = {
  id: string;
  title: string;
  opensAt?: string;
  lockedAt?: string;
  isLocked: boolean;
  posts: Post[];
  polls: Poll[];
};

type Sentiment = {
  overall: {
    sentiment: string;
    positiveCount: number;
    negativeCount: number;
    totalAnalyzed: number;
  };
  teams: null | {
    home: { teamName: string; sentiment: string; totalAnalyzed: number };
    away: { teamName: string; sentiment: string; totalAnalyzed: number };
  };
};

/* ---------------- UTIL (unchanged) ---------------- */

function formatWhen(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function formatRelative(iso: string) {
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60000);
  if (Math.abs(diffMin) < 1) return "Just now";
  if (Math.abs(diffMin) < 60) return `${Math.abs(diffMin)}m`;
  return formatWhen(iso);
}

function pseudoLikes(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % 100;
  return 50 + h;
}

/* ---------------- COMPONENT ---------------- */

export default function MatchCenterClient({ matchId }: { matchId: string }) {
  const { user, accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [thread, setThread] = useState<ThreadData | null>(null);

  const [newPost, setNewPost] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [sentimentError, setSentimentError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);

    const matchRes = await fetch(`/api/matches/${matchId}`);
    const matchJson = await matchRes.json();
    setMatch(matchJson.match);

    const threadRes = await fetch(`/api/matches/${matchId}/thread`);
    const threadJson = await threadRes.json();

    const fullRes = await fetch(`/api/threads/${threadJson.id}/full`);
    const full = await fullRes.json();
    setThread(full);

    setSentimentLoading(true);
    setSentimentError(null);
    try {
      const sentimentRes = await fetch(`/api/threads/${threadJson.id}/sentiment`);
      const sentimentJson = await sentimentRes.json();
      if (!sentimentRes.ok) {
        throw new Error(sentimentJson?.error ?? "Failed to load sentiment");
      }
      setSentiment(sentimentJson as Sentiment);
    } catch (err) {
      setSentiment(null);
      setSentimentError(err instanceof Error ? err.message : "Failed to load sentiment");
    } finally {
      setSentimentLoading(false);
    }

    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !match) {
    return <div className="p-8 text-text-muted">Loading...</div>;
  }

  const scoreText = `${match.homeScore ?? "-"} : ${match.awayScore ?? "-"}`;

  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden rounded-3xl border border-border-subtle bg-bg-surface px-6 py-6 shadow-card">
          <div className="absolute inset-0 bg-gradient-glow opacity-80" />

          <div className="relative grid md:grid-cols-3 text-center gap-6">

            {/* HOME */}
            <div>
              <img src={match.homeTeam.logoUrl || ""} className="h-14 mx-auto mb-3" />
              <h2 className="text-xl font-semibold">{match.homeTeam.name}</h2>
            </div>

            {/* SCORE */}
            <div>
              <div className="text-5xl font-bold">{scoreText}</div>
              <p className="text-sm text-text-secondary mt-2">
                {match.stage} · Matchday {match.matchday}
              </p>
            </div>

            {/* AWAY */}
            <div>
              <img src={match.awayTeam.logoUrl || ""} className="h-14 mx-auto mb-3" />
              <h2 className="text-xl font-semibold">{match.awayTeam.name}</h2>
            </div>

          </div>
        </section>

        {/* ================= MAIN ================= */}
        <div className="mt-8 grid lg:grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="lg:col-span-2">

            <div className="mb-4 border-b border-border-subtle flex items-center justify-between gap-4 text-sm">
              <div className="flex gap-6">
                <span className="border-b-2 border-primary-500 pb-3 text-primary-400 font-semibold">
                  Discussion
                </span>
                <span className="pb-3 text-text-muted">Stats</span>
              </div>
              {thread?.id ? (
                <Link
                  href={`/threads/${thread.id}`}
                  className="pb-3 text-xs font-medium text-primary-300 hover:text-primary-200"
                >
                  Open full thread →
                </Link>
              ) : null}
            </div>

            {/* CREATE POST */}
            <div className="bg-bg-card border border-border-subtle rounded-2xl p-4 shadow-soft">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-bg-main border border-border-subtle rounded-xl p-3 text-sm"
              />

              <div className="mt-3 flex justify-end">
                <button className="bg-gradient-primary px-5 py-2 rounded-xl text-white">
                  Post
                </button>
              </div>
            </div>

            {/* POSTS */}
            <div className="mt-6 space-y-4">
              {thread?.posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-bg-card border border-border-subtle rounded-2xl p-4 shadow-soft"
                >
                  <div className="flex justify-between text-sm text-text-muted">
                    <span>{post.author.username}</span>
                    <span>{formatRelative(post.createdAt)}</span>
                  </div>

                  <p className="mt-2">{post.content}</p>

                  <div className="mt-3 flex gap-4 text-sm text-text-muted">
                    <span>❤️ {pseudoLikes(post.id)}</span>
                    <span>💬 {post.replies.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-4">

            <div className="bg-bg-card border border-border-subtle rounded-2xl p-4">
              <h3 className="font-semibold mb-2">AI Sentiment</h3>
              {sentimentLoading ? (
                <p className="text-sm text-text-secondary">Loading sentiment...</p>
              ) : sentimentError ? (
                <p className="text-sm text-red-400">{sentimentError}</p>
              ) : !sentiment ? (
                <p className="text-sm text-text-secondary">Sentiment is unavailable right now.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <p className="text-text-primary">
                    Overall:{" "}
                    <span className="font-semibold capitalize">{sentiment.overall.sentiment}</span>
                    {" · "}
                    {sentiment.overall.totalAnalyzed} comments analyzed
                  </p>
                  {sentiment.teams && (
                    <>
                      <p className="text-text-secondary">
                        Home fans:{" "}
                        <span className="font-medium capitalize">{sentiment.teams.home.sentiment}</span>
                      </p>
                      <p className="text-text-secondary">
                        Away fans:{" "}
                        <span className="font-medium capitalize">{sentiment.teams.away.sentiment}</span>
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="bg-bg-card border border-border-subtle rounded-2xl p-4">
              <h3 className="font-semibold mb-2">Poll</h3>
              <p className="text-sm text-text-secondary">Coming soon...</p>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}