"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import Link from "next/link";
import {
  Sparkles,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

export default function HomePage() {
  const [feed, setFeed] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [feedRes, tagRes, matchRes, standingRes] = await Promise.all([
          fetch("/api/feed?limit=6"),
          fetch("/api/tags"),
          fetch("/api/matches?limit=5"),
          fetch("/api/standings?limit=5"),  
        ]);

        const feedData = await feedRes.json();
        const tagData = await tagRes.json();
        const matchData = await matchRes.json();
        const standingData = await standingRes.json();

        setFeed(feedData);
        setTags(tagData.tags || tagData);
        setMatches(matchData.matches || matchData);
        setStandings(standingData.standings || standingData);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <PageContainer>
      <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr_300px] gap-6">

        {/* LEFT SIDEBAR */}
        <aside className="space-y-4 hidden xl:block">

          {/* STANDINGS */}
          <div className="rounded-2xl bg-bg-surface p-4 border border-border-subtle">
            <h3 className="text-sm font-semibold text-white mb-3">
              Standings
            </h3>

            <div className="space-y-2 text-xs">
              {standings.map((team, i) => (
                <div key={team.id} className="flex justify-between text-text-secondary">
                  <span>{i + 1}. {team.team.name}</span>
                  <span>{team.points}</span>
                </div>
              ))}
            </div>
          </div>

        </aside>

        {/* CENTER */}
        <main className="space-y-6">

          {/* AI HERO (still static for now) */}
          <section className="rounded-3xl bg-bg-surface p-6 border border-border-subtle">
            <div className="text-xs text-accent-300 flex gap-2 mb-2">
              <Sparkles className="h-4 w-4" />
              AI Daily Digest
            </div>

            <h2 className="text-xl text-white font-semibold">
              Dynamic Insights Coming Soon
            </h2>

            <p className="text-sm text-text-secondary mt-2">
              This section will be powered by AI based on match + thread data.
            </p>
          </section>

          {/* MATCHES */}
          <section className="rounded-2xl bg-bg-surface p-4 border border-border-subtle">
            <h3 className="text-sm font-semibold text-white mb-3">
              Upcoming & Recent Matches
            </h3>

            <div className="flex gap-3 overflow-x-auto">
              {matches.map((m) => (
                <div
                  key={m.id}
                  className="min-w-[140px] bg-bg-card rounded-xl p-3"
                >
                  <p className="text-xs text-text-muted">
                    {m.homeTeam.name} vs {m.awayTeam.name}
                  </p>
                  <p className="text-sm text-white">
                    {m.homeScore ?? "-"} - {m.awayScore ?? "-"}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* FEED */}
          <section className="space-y-4">

            <h3 className="text-lg font-semibold text-white">
              Community Activity
            </h3>

            {loading && (
              <p className="text-sm text-text-muted">Loading...</p>
            )}

            {!loading &&
              feed.map((item) => {

                if (item.type === "thread" && item.thread) {
                  return (
                    <Link
                      key={item.id}
                      href={`/threads/${item.thread.id}`}
                      className="block rounded-2xl bg-bg-card p-4 border border-border-subtle hover:border-primary-500/30 transition"
                    >
                      <div className="text-xs text-text-muted mb-2">
                        <MessageSquare className="inline h-3.5 w-3.5 mr-1" />
                        Thread
                      </div>

                      <h4 className="text-white font-semibold">
                        {item.thread.title}
                      </h4>

                      <p className="text-xs text-text-muted mt-1">
                        {item.thread.replies} replies • {item.thread.author.username}
                      </p>
                    </Link>
                  );
                }

                if (item.type === "poll" && item.poll) {
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-bg-card p-4 border border-border-subtle"
                    >
                      <p className="text-xs text-text-muted mb-2">
                        Poll
                      </p>

                      <h4 className="text-white font-semibold">
                        {item.poll.question}
                      </h4>
                    </div>
                  );
                }

                return null;
              })}

          </section>

        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-4 hidden xl:block">

          {/* TRENDING TAGS */}
          <div className="rounded-2xl bg-bg-surface p-4 border border-border-subtle">
            <h3 className="text-sm font-semibold text-white mb-3">
              Trending Topics
            </h3>

            <div className="space-y-2">
              {tags.map((tag: any) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.id}/threads`}
                  className="block text-sm text-text-secondary hover:text-white"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          </div>

        </aside>

      </div>
    </PageContainer>
  );
}