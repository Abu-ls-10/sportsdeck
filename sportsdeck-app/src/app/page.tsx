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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [feedRes, tagRes] = await Promise.all([
          fetch("/api/feed?limit=10"),
          fetch("/api/tags"),
        ]);

        setFeed(await feedRes.json());
        const tagData = await tagRes.json();
        setTags(tagData.tags || tagData);
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
      <div className="max-w-[1200px] mx-auto">

        {/* 🔥 HERO */}
        <section className="rounded-3xl border border-border-subtle bg-bg-surface p-6 mb-6">
          <div className="flex items-center gap-2 text-accent-300 text-xs mb-2">
            <Sparkles className="h-4 w-4" />
            AI Daily Digest
          </div>

          <h1 className="text-xl font-semibold text-white">
            City Holds Firm, Title Race Tightens
          </h1>

          <p className="text-sm text-text-secondary mt-2 max-w-xl">
            Manchester City’s recent form puts them ahead, but Arsenal remains
            within striking distance as the season intensifies.
          </p>
        </section>

        {/* 🔥 MATCH STRIP */}
        <section className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-3">
            Upcoming & Recent Matches
          </h3>

          <div className="flex gap-3 overflow-x-auto">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="min-w-[160px] rounded-xl bg-bg-surface border border-border-subtle p-3"
              >
                <p className="text-xs text-text-muted">
                  Team A vs Team B
                </p>
                <p className="text-white text-sm">2 - 1</p>
              </div>
            ))}
          </div>
        </section>

        {/* 🔥 MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">

          {/* LEFT: FEED */}
          <div className="space-y-4">

            <h2 className="text-lg font-semibold text-white">
              Community Activity
            </h2>

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
                      className="block rounded-2xl bg-bg-surface border border-border-subtle p-4 hover:border-primary-500/30 transition"
                    >
                      <div className="flex items-center gap-2 text-xs text-text-muted mb-2">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Thread
                      </div>

                      <h3 className="text-white font-semibold">
                        {item.thread.title}
                      </h3>

                      <p className="text-xs text-text-muted mt-1">
                        {item.thread.replies} replies • {item.thread.author.username}
                      </p>
                    </Link>
                  );
                }

                return null;
              })}
          </div>

          {/* RIGHT: SIDEBAR */}
          <aside className="space-y-4">

            {/* Trending */}
            <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                Trending Topics
              </h3>

              <div className="space-y-2">
                {tags.slice(0, 5).map((tag: any) => (
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

            {/* Standings */}
            <div className="rounded-2xl bg-bg-surface border border-border-subtle p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                Standings
              </h3>

              <p className="text-xs text-text-muted">
                Standings coming soon
              </p>
            </div>

          </aside>
        </div>
      </div>
    </PageContainer>
  );
}