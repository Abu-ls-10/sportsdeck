"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  IconChartBar,
  IconHeart,
  IconMessage,
  IconPhoto,
  IconFlag,
  IconSparkles,
} from "@tabler/icons-react";
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

function formatRelative(iso: string): string {
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const diffMin = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  const diffHr = Math.round((new Date(iso).getTime() - Date.now()) / 3_600_000);
  const diffDay = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (Math.abs(diffMin) < 1) return "Just now";
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute");
  if (Math.abs(diffHr) < 48) return rtf.format(diffHr, "hour");
  if (Math.abs(diffDay) < 14) return rtf.format(diffDay, "day");
  return formatWhen(iso);
}

function moodFromContent(text: string): { label: string; tone: "positive" | "tense" | "neutral" } {
  const t = text.toLowerCase();
  const positive = /\b(great|world|win|love|excited|edge|come on|beaut|dominat|show|lead|narrow|midfield)\b/i.test(
    t
  );
  const tense =
    /\b(nerv|late|drama|don't|not so|careful|habit|either way|too early|expect|panic)\b/i.test(t);
  if (tense && !positive) return { label: "Tense Mood", tone: "tense" };
  if (positive) return { label: "Positive Mood", tone: "positive" };
  if (tense) return { label: "Mixed Mood", tone: "neutral" };
  return { label: "Mixed Mood", tone: "neutral" };
}

function moodBadgeClass(tone: "positive" | "tense" | "neutral"): string {
  if (tone === "positive") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  if (tone === "tense") return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  return "border-slate-500/40 bg-slate-500/10 text-slate-300";
}

function pseudoLikes(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i) * (i + 1)) % 1009;
  return 48 + (h % 140);
}

function sentimentBarWidth(label: string): { pct: number; barClass: string } {
  const l = label.toLowerCase();
  if (l.includes("positive")) return { pct: 88, barClass: "bg-emerald-500" };
  if (l.includes("negative")) return { pct: 28, barClass: "bg-rose-500" };
  return { pct: 52, barClass: "bg-amber-500" };
}

function UserAvatar({ author, size = "md" }: { author: Author; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const initial = (author.username ?? "?").slice(0, 1).toUpperCase();
  if (author.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={author.avatarUrl}
        alt=""
        className={`${dim} shrink-0 rounded-full object-cover ring-2 ring-slate-700/80`}
      />
    );
  }
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-slate-200 ring-2 ring-slate-600/80`}
    >
      {initial}
    </div>
  );
}

function FanBadge({ team }: { team: FanTeam }) {
  const label = `${team.shortName.toUpperCase()} FAN`;
  return (
    <span className="rounded-md border border-sky-500/35 bg-sky-500/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-sky-300">
      {label}
    </span>
  );
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

  const scoreText = `${match.homeScore ?? "-"} : ${match.awayScore ?? "-"}`;
  const statusUpper = match.status.toUpperCase();
  const looksLive =
    statusUpper.includes("LIVE") || statusUpper.includes("IN_PLAY") || statusUpper.includes("1H") || statusUpper.includes("2H");

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconChartBar className="h-7 w-7 text-sky-400" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl">Match Center</h1>
          </div>
          <Link
            href="/matches"
            className="rounded-lg border border-slate-600/80 bg-[#0f1729] px-3 py-2 text-sm text-slate-200 hover:bg-[#141f35]"
          >
            Back to Matches
          </Link>
        </div>

        <section className="mb-6 rounded-2xl border border-slate-700/60 bg-[#0d1424] p-6 shadow-lg shadow-black/20">
          <div className="grid items-center gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-2 h-16 w-16 overflow-hidden rounded-full bg-slate-800/80 ring-2 ring-slate-600/50">
                {match.homeTeam.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={match.homeTeam.logoUrl} alt={`${match.homeTeam.name} logo`} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <h2 className="text-xl font-bold text-white md:text-2xl">{match.homeTeam.name}</h2>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-500">HOME</p>
            </div>

            <div className="text-center">
              <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
                {looksLive ? (
                  <span className="rounded-md border border-sky-500/40 bg-sky-500/15 px-2.5 py-1 text-[11px] font-bold tracking-wide text-sky-300">
                    LIVE
                  </span>
                ) : null}
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{match.status}</span>
              </div>
              <p className="my-1 text-5xl font-extrabold tracking-tight text-white">{scoreText}</p>
              <p className="text-sm text-slate-300">{match.venue || "TBA Venue"}</p>
              <p className="text-xs text-slate-500">
                {match.stage} · Matchday {match.matchday}
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-2 h-16 w-16 overflow-hidden rounded-full bg-slate-800/80 ring-2 ring-slate-600/50">
                {match.awayTeam.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={match.awayTeam.logoUrl} alt={`${match.awayTeam.name} logo`} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <h2 className="text-xl font-bold text-white md:text-2xl">{match.awayTeam.name}</h2>
              <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-500">AWAY</p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="mb-4 flex gap-6 border-b border-slate-700/70 text-sm">
              <span className="-mb-px border-b-2 border-sky-400 pb-3 font-semibold text-sky-400">Discussion Hub</span>
              <span className="pb-3 text-slate-500">Match Stats</span>
              <span className="pb-3 text-slate-500">Lineups</span>
              <span className="pb-3 text-slate-500">Timeline</span>
            </div>

            <div className="rounded-2xl border border-slate-700/60 bg-[#0d1424] p-5 shadow-md shadow-black/15">
              <p className="mb-4 text-[11px] font-medium uppercase tracking-wider text-slate-500">Discussion thread</p>
              <h2 className="mb-5 text-lg font-bold text-white">{thread?.title ?? "Match discussion"}</h2>

              <div className="mb-6 rounded-xl border border-slate-700/50 bg-[#111a2e] p-4">
                {isVisitor ? (
                  <p className="text-sm text-slate-400">
                    You are browsing as a visitor.{" "}
                    <Link href="/login" className="text-sky-400 hover:text-sky-300">
                      Log in
                    </Link>{" "}
                    to post, reply, vote, report, and translate.
                  </p>
                ) : !canPost ? (
                  <p className="text-sm text-slate-400">This thread is closed right now.</p>
                ) : (
                  <div className="flex gap-3">
                    <div className="hidden h-11 w-11 shrink-0 rounded-full bg-slate-700 sm:block" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="Share your thoughts on the match..."
                        className="h-24 w-full resize-none rounded-lg border border-slate-600/60 bg-[#0a0f1c] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-500/70"
                      />
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-slate-500">
                          <button
                            type="button"
                            className="rounded-lg p-2 hover:bg-slate-800/80 hover:text-slate-300"
                            aria-label="Add image"
                          >
                            <IconPhoto className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg p-2 hover:bg-slate-800/80 hover:text-slate-300"
                            aria-label="Add poll"
                          >
                            <IconChartBar className="h-5 w-5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleCreatePost}
                          className="rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-400"
                        >
                          Post Update
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {statusMsg ? <p className="mt-2 text-xs text-slate-500">{statusMsg}</p> : null}
              </div>

              <div className="space-y-5">
                {thread && thread.posts.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-slate-700/60 bg-[#111a2e]/50 px-4 py-8 text-center text-sm text-slate-500">
                    No posts in this thread yet. Be the first to share a take.
                  </p>
                ) : null}
                {(thread?.posts ?? []).map((post) => {
                  const mood = moodFromContent(post.content);
                  const replyCount = post._count?.replies ?? post.replies.length;
                  const likes = pseudoLikes(post.id);
                  return (
                    <article key={post.id} className="rounded-xl border border-slate-700/50 bg-[#111a2e] p-4">
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                        <div className="flex min-w-0 gap-3">
                          <UserAvatar author={post.author} />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-white">{post.author.username ?? "Fan"}</p>
                              {post.author.favoriteTeam ? <FanBadge team={post.author.favoriteTeam} /> : null}
                              <span className="text-xs text-slate-500">{formatRelative(post.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${moodBadgeClass(mood.tone)}`}
                        >
                          <IconSparkles className="h-3.5 w-3.5" aria-hidden />
                          AI: {mood.label}
                        </span>
                      </div>

                      <p className="text-sm leading-relaxed text-slate-200">{post.content}</p>
                      {translated[post.id] ? (
                        <p className="mt-2 rounded-md border border-slate-700/60 bg-[#0a0f1c] p-2 text-xs text-slate-300">
                          EN: {translated[post.id]}
                        </p>
                      ) : null}

                      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-700/40 pt-3 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5 text-slate-400">
                          <IconHeart className="h-4 w-4 text-rose-400/90" aria-hidden />
                          <span className="font-medium text-slate-300">{likes}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowReplyBox((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                          className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white"
                        >
                          <IconMessage className="h-4 w-4" aria-hidden />
                          <span className="font-medium text-slate-300">{replyCount}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTranslate("POST", post.id)}
                          className="text-sky-400 hover:text-sky-300"
                        >
                          Translate to English
                        </button>
                        {!isVisitor ? (
                          <button
                            type="button"
                            onClick={() => handleReport("POST", post.id)}
                            className="ml-auto text-slate-500 hover:text-rose-400"
                          >
                            Report
                          </button>
                        ) : null}
                      </div>

                      {showReplyBox[post.id] ? (
                        <div className="mt-3 rounded-lg border border-slate-700/50 bg-[#0a0f1c] p-3">
                          <textarea
                            value={replyText[post.id] ?? ""}
                            onChange={(e) => setReplyText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            placeholder="Write a reply..."
                            className="h-20 w-full resize-none bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
                          />
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleReply(post.id)}
                              className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-400"
                            >
                              Post Reply
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {post.replies.length > 0 ? (
                        <div className="mt-4 space-y-3 border-l-2 border-slate-600/50 pl-4">
                          {post.replies.map((reply) => {
                            const rm = moodFromContent(reply.content);
                            return (
                              <div
                                key={reply.id}
                                className="rounded-lg border border-slate-700/40 bg-[#0a0f1c]/90 p-3"
                              >
                                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                                  <div className="flex gap-2.5">
                                    <UserAvatar author={reply.author} size="sm" />
                                    <div>
                                      <p className="text-sm font-semibold text-white">
                                        {reply.author.username ?? "Fan"}
                                      </p>
                                      <p className="text-[11px] text-slate-500">{formatRelative(reply.createdAt)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`hidden items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-medium sm:inline-flex ${moodBadgeClass(rm.tone)}`}
                                    >
                                      <IconSparkles className="h-3 w-3" aria-hidden />
                                      AI
                                    </span>
                                    {!isVisitor ? (
                                      <button
                                        type="button"
                                        onClick={() => handleReport("REPLY", reply.id)}
                                        className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-amber-400"
                                        aria-label="Report reply"
                                      >
                                        <IconFlag className="h-4 w-4" />
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                                <p className="text-sm leading-relaxed text-slate-300">{reply.content}</p>
                                {translated[reply.id] ? (
                                  <p className="mt-2 rounded border border-slate-700/50 bg-[#060a12] p-2 text-[11px] text-slate-400">
                                    EN: {translated[reply.id]}
                                  </p>
                                ) : null}
                                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
                                  <button
                                    type="button"
                                    onClick={() => handleTranslate("REPLY", reply.id)}
                                    className="text-sky-400 hover:text-sky-300"
                                  >
                                    Translate to English
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-slate-700/60 bg-[#0d1424] p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">AI Fan Sentiment</h3>
                <span className="text-[10px] font-semibold tracking-wide text-sky-400">REAL-TIME</span>
              </div>
              {!sentiment ? (
                <p className="text-xs text-slate-500">No sentiment available yet.</p>
              ) : sentiment.teams ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-slate-400">{sentiment.teams.home.teamName} fans</span>
                      <span className={`font-bold uppercase ${sentimentTone(sentiment.teams.home.sentiment)}`}>
                        {sentiment.teams.home.sentiment.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={sentimentBarWidth(sentiment.teams.home.sentiment).barClass}
                        style={{ width: `${sentimentBarWidth(sentiment.teams.home.sentiment).pct}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-slate-400">{sentiment.teams.away.teamName} fans</span>
                      <span className={`font-bold uppercase ${sentimentTone(sentiment.teams.away.sentiment)}`}>
                        {sentiment.teams.away.sentiment.replaceAll("_", " ")}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={sentimentBarWidth(sentiment.teams.away.sentiment).barClass}
                        style={{ width: `${sentimentBarWidth(sentiment.teams.away.sentiment).pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  <p>
                    Overall:{" "}
                    <span className={sentimentTone(sentiment.overall.sentiment)}>{sentiment.overall.sentiment}</span>
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-700/60 bg-[#0d1424] p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Match Poll</h3>
                {poll ? (
                  <span className="text-[10px] font-medium text-slate-500">
                    {poll.isClosed ? "CLOSED" : "OPEN"}
                  </span>
                ) : null}
              </div>
              {!poll ? (
                <p className="text-xs text-slate-500">No poll created yet.</p>
              ) : (
                <>
                  <p className="mb-3 text-sm text-slate-200">{poll.question}</p>
                  <div className="space-y-2">
                    {poll.options.map((opt) => {
                      const votes = opt._count?.votes ?? 0;
                      const pct = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => void handleVote(opt.id)}
                          className="w-full rounded-lg border border-slate-700/60 bg-[#111a2e] p-2.5 text-left hover:bg-[#1a2744]"
                        >
                          <div className="mb-1 flex items-center justify-between text-xs text-slate-200">
                            <span>{opt.optionText}</span>
                            <span className="font-semibold text-sky-300">{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-800">
                            <div className="h-1.5 rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
                          </div>
                          <p className="mt-1 text-[10px] text-slate-500">{votes} votes</p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[11px] text-slate-500">{totalVotes} votes cast</p>
                </>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

