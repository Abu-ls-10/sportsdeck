"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

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

type Author = {
  id: string;
  username: string | null;
  avatarUrl: string | null;
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
    home: {
      teamName: string;
      sentiment: string;
      totalAnalyzed: number;
    };
    away: {
      teamName: string;
      sentiment: string;
      totalAnalyzed: number;
    };
  };
};

function formatWhen(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function sentimentTone(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("positive")) return "text-emerald-400";
  if (l.includes("negative")) return "text-rose-400";
  return "text-amber-300";
}

function getAuthHeaders(token: string | null): HeadersInit {
  return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

export default function MatchCenterClient({ matchId }: { matchId: string }) {
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const isVisitor = !user;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [thread, setThread] = useState<ThreadData | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);

  const [newPost, setNewPost] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [showReplyBox, setShowReplyBox] = useState<Record<string, boolean>>({});
  const [translated, setTranslated] = useState<Record<string, string>>({});
  const [statusMsg, setStatusMsg] = useState<string>("");

  const loadThreadData = useCallback(
    async (tid: string) => {
      const [fullRes, sentimentRes] = await Promise.all([
        fetch(`/api/threads/${tid}/full`, { cache: "no-store" }),
        fetch(`/api/threads/${tid}/sentiment`, { cache: "no-store" }),
      ]);

      if (fullRes.ok) {
        const full = (await fullRes.json()) as ThreadData;
        setThread(full);
      }
      if (sentimentRes.ok) {
        const s = (await sentimentRes.json()) as Sentiment;
        setSentiment(s);
      }
    },
    []
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const matchRes = await fetch(`/api/matches/${matchId}`, { cache: "no-store" });
      if (!matchRes.ok) throw new Error("Could not load match details");
      const matchJson = (await matchRes.json()) as { match: MatchData };
      setMatch(matchJson.match);

      const threadRes = await fetch(`/api/matches/${matchId}/thread`, { cache: "no-store" });
      if (!threadRes.ok) throw new Error("Could not load match thread");
      const threadJson = (await threadRes.json()) as { id: string };
      setThreadId(threadJson.id);

      await loadThreadData(threadJson.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load match center");
    } finally {
      setLoading(false);
    }
  }, [loadThreadData, matchId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const poll = thread?.polls?.[0] ?? null;
  const totalVotes = useMemo(
    () => (poll ? poll.options.reduce((sum, o) => sum + (o._count?.votes ?? 0), 0) : 0),
    [poll]
  );

  const canPost = useMemo(() => {
    if (!thread) return false;
    const now = Date.now();
    if (thread.isLocked) return false;
    if (thread.opensAt && now < new Date(thread.opensAt).getTime()) return false;
    if (thread.lockedAt && now > new Date(thread.lockedAt).getTime()) return false;
    return true;
  }, [thread]);

  async function handleCreatePost() {
    if (!threadId) return;
    if (!accessToken) {
      setStatusMsg("Log in to post in this thread.");
      return;
    }
    if (!newPost.trim()) return;

    const res = await fetch(`/api/threads/${threadId}/posts`, {
      method: "POST",
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify({ content: newPost.trim() }),
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      setStatusMsg(payload.error ?? payload.message ?? "Could not create post.");
      return;
    }

    setNewPost("");
    setStatusMsg("Posted.");
    await loadThreadData(threadId);
  }

  async function handleReply(postId: string) {
    if (!accessToken) {
      setStatusMsg("Log in to reply.");
      return;
    }
    const content = (replyText[postId] ?? "").trim();
    if (!content) return;

    const res = await fetch(`/api/posts/${postId}/replies`, {
      method: "POST",
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      setStatusMsg(payload.error ?? payload.message ?? "Could not post reply.");
      return;
    }

    setReplyText((prev) => ({ ...prev, [postId]: "" }));
    setShowReplyBox((prev) => ({ ...prev, [postId]: false }));
    setStatusMsg("Reply posted.");
    if (threadId) await loadThreadData(threadId);
  }

  async function handleVote(optionId: string) {
    if (!poll) return;
    if (!accessToken) {
      setStatusMsg("Log in to vote.");
      return;
    }
    const res = await fetch(`/api/polls/${poll.id}/vote`, {
      method: "POST",
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify({ optionId }),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      setStatusMsg(payload.error ?? payload.message ?? "Could not submit vote.");
      return;
    }
    setStatusMsg("Vote recorded.");
    if (threadId) await loadThreadData(threadId);
  }

  async function handleReport(contentType: "POST" | "REPLY", contentId: string) {
    if (!accessToken) {
      setStatusMsg("Log in to report content.");
      return;
    }
    const reason = window.prompt("Reason for report:");
    if (!reason || !reason.trim()) return;

    const res = await fetch("/api/reports", {
      method: "POST",
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify({ contentType, contentId, reason: reason.trim() }),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      setStatusMsg(payload.error ?? payload.message ?? "Could not report content.");
      return;
    }
    setStatusMsg("Report submitted.");
  }

  async function handleTranslate(contentType: "POST" | "REPLY", contentId: string) {
    if (!accessToken) {
      setStatusMsg("Log in to use translation.");
      return;
    }
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: getAuthHeaders(accessToken),
      body: JSON.stringify({ contentType, contentId }),
    });
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      setStatusMsg(payload.error ?? payload.message ?? "Could not translate.");
      return;
    }
    const data = (await res.json()) as { translatedText?: string };
    setTranslated((prev) => ({ ...prev, [contentId]: data.translatedText ?? "" }));
  }

  if (loading || authLoading) {
    return <div className="min-h-screen bg-black p-8 text-zinc-300">Loading match center...</div>;
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-black p-8 text-zinc-300">
        <p>{error ?? "Match not found"}</p>
        <Link href="/matches" className="mt-4 inline-block text-sky-400 hover:text-sky-300">
          Back to matches
        </Link>
      </div>
    );
  }

  const kickoff = new Date(match.matchDate);
  const scoreText = `${match.homeScore ?? "-"} : ${match.awayScore ?? "-"}`;

  return (
    <div className="min-h-screen bg-black text-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">Match Center</h1>
          <Link href="/matches" className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm hover:bg-zinc-800">
            Back to Matches
          </Link>
        </div>

        <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
          <div className="grid items-center gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-2 h-14 w-14 overflow-hidden rounded-full bg-zinc-900">
                {match.homeTeam.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={match.homeTeam.logoUrl} alt={`${match.homeTeam.name} logo`} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <h2 className="text-2xl font-bold">{match.homeTeam.name}</h2>
              <p className="text-xs tracking-wider text-zinc-400">HOME</p>
            </div>

            <div className="text-center">
              <p className="text-xs font-semibold text-sky-400">{match.status}</p>
              <p className="my-2 text-5xl font-extrabold">{scoreText}</p>
              <p className="text-sm text-zinc-300">{match.venue || "TBA Venue"}</p>
              <p className="text-xs text-zinc-400">
                {match.stage} - Matchday {match.matchday} - {formatWhen(kickoff.toISOString())}
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-2 h-14 w-14 overflow-hidden rounded-full bg-zinc-900">
                {match.awayTeam.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={match.awayTeam.logoUrl} alt={`${match.awayTeam.name} logo`} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <h2 className="text-2xl font-bold">{match.awayTeam.name}</h2>
              <p className="text-xs tracking-wider text-zinc-400">AWAY</p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="mb-3 border-b border-zinc-800">
              <div className="inline-block border-b-2 border-sky-500 px-1 pb-2 text-sm font-semibold text-sky-400">
                Discussion Hub
              </div>
            </div>

            <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              {isVisitor ? (
                <p className="text-sm text-zinc-400">
                  You are browsing as a visitor. <Link href="/login" className="text-sky-400">Log in</Link> to post, reply, vote, report, and translate.
                </p>
              ) : !canPost ? (
                <p className="text-sm text-zinc-400">This thread is closed right now.</p>
              ) : (
                <>
                  <textarea
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    placeholder="Share your thoughts on the match..."
                    className="h-24 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  />
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={handleCreatePost}
                      className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
                    >
                      Post Update
                    </button>
                  </div>
                </>
              )}
              {statusMsg ? <p className="mt-2 text-xs text-zinc-400">{statusMsg}</p> : null}
            </div>

            <div className="space-y-4">
              {(thread?.posts ?? []).map((post) => (
                <article key={post.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-zinc-800" />
                      <div>
                        <p className="text-sm font-semibold">{post.author.username ?? "User"}</p>
                        <p className="text-xs text-zinc-400">{formatWhen(post.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTranslate("POST", post.id)}
                        className="text-xs text-sky-400 hover:text-sky-300"
                      >
                        Translate
                      </button>
                      {!isVisitor && (
                        <button
                          onClick={() => handleReport("POST", post.id)}
                          className="text-xs text-zinc-400 hover:text-rose-300"
                        >
                          Report
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-200">{post.content}</p>
                  {translated[post.id] ? (
                    <p className="mt-2 rounded-md border border-zinc-800 bg-zinc-900 p-2 text-xs text-zinc-300">
                      EN: {translated[post.id]}
                    </p>
                  ) : null}

                  <div className="mt-3">
                    <button
                      onClick={() =>
                        setShowReplyBox((prev) => ({ ...prev, [post.id]: !prev[post.id] }))
                      }
                      className="text-xs text-zinc-400 hover:text-zinc-200"
                    >
                      Reply
                    </button>
                  </div>

                  {showReplyBox[post.id] ? (
                    <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                      <textarea
                        value={replyText[post.id] ?? ""}
                        onChange={(e) =>
                          setReplyText((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        placeholder="Write a reply..."
                        className="h-20 w-full bg-transparent text-sm outline-none"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => handleReply(post.id)}
                          className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-400"
                        >
                          Post Reply
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {post.replies.length > 0 && (
                    <div className="mt-3 space-y-2 border-l border-zinc-800 pl-4">
                      {post.replies.map((reply) => (
                        <div key={reply.id} className="rounded-lg bg-zinc-900/60 p-3">
                          <div className="mb-1 flex items-center justify-between">
                            <p className="text-xs font-semibold">{reply.author.username ?? "User"}</p>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleTranslate("REPLY", reply.id)}
                                className="text-[11px] text-sky-400 hover:text-sky-300"
                              >
                                Translate
                              </button>
                              {!isVisitor && (
                                <button
                                  onClick={() => handleReport("REPLY", reply.id)}
                                  className="text-[11px] text-zinc-400 hover:text-rose-300"
                                >
                                  Report
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-zinc-300">{reply.content}</p>
                          {translated[reply.id] ? (
                            <p className="mt-2 rounded border border-zinc-800 bg-zinc-900 p-2 text-[11px] text-zinc-300">
                              EN: {translated[reply.id]}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold">AI Fan Sentiment</h3>
                <span className="text-[11px] text-sky-400">REAL-TIME</span>
              </div>
              {!sentiment ? (
                <p className="text-xs text-zinc-400">No sentiment available yet.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  <p>
                    Overall: <span className={sentimentTone(sentiment.overall.sentiment)}>{sentiment.overall.sentiment}</span>
                  </p>
                  {sentiment.teams ? (
                    <>
                      <p>
                        {sentiment.teams.home.teamName}:{" "}
                        <span className={sentimentTone(sentiment.teams.home.sentiment)}>
                          {sentiment.teams.home.sentiment}
                        </span>
                      </p>
                      <p>
                        {sentiment.teams.away.teamName}:{" "}
                        <span className={sentimentTone(sentiment.teams.away.sentiment)}>
                          {sentiment.teams.away.sentiment}
                        </span>
                      </p>
                    </>
                  ) : null}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold">Match Poll</h3>
                {poll ? (
                  <span className="text-[11px] text-zinc-400">
                    {poll.isClosed ? "CLOSED" : "OPEN"}
                  </span>
                ) : null}
              </div>
              {!poll ? (
                <p className="text-xs text-zinc-400">No poll created yet.</p>
              ) : (
                <>
                  <p className="mb-3 text-sm text-zinc-200">{poll.question}</p>
                  <div className="space-y-2">
                    {poll.options.map((opt) => {
                      const votes = opt._count?.votes ?? 0;
                      const pct = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => void handleVote(opt.id)}
                          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-left hover:bg-zinc-800"
                        >
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span>{opt.optionText}</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded bg-zinc-800">
                            <div className="h-1.5 rounded bg-sky-500" style={{ width: `${pct}%` }} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[11px] text-zinc-400">{totalVotes} votes cast</p>
                </>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

