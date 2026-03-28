"use client";

import { useEffect, useState } from "react";
import ThreadsHero from "@/components/threads/ThreadsHero";
import ThreadsFilterBar, {
  ThreadFilters,
} from "@/components/threads/ThreadsFilterBar";
import ThreadCard from "@/components/threads/ThreadCard";
import StartDiscussionCard from "@/components/threads/StartDiscussionCard";

type Thread = {
  id: string;
  title: string;
  createdAt: string;
  author: {
    username: string;
  };
  teamId?: string | null;
  matchId?: string | null;
  tags: {
    tag: { name: string };
  }[];
  _count: {
    posts: number;
  };
};

export default function ThreadsPage() {
  const [filters, setFilters] = useState<ThreadFilters>({
    search: "",
    team: "all",
    match: "all",
    sort: "recent",
    tag: "all",
  });

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();

        if (filters.search) params.append("q", filters.search);

        if (filters.team !== "all") params.append("teamId", filters.team);
        if (filters.match !== "all") params.append("matchId", filters.match);
        if (filters.tag !== "all") params.append("tag", filters.tag);
        if (filters.sort) params.append("sort", filters.sort);

        const res = await fetch(`/api/threads?${params.toString()}`);

        if (!res.ok) throw new Error("Failed to fetch threads");

        const data = await res.json();

        setThreads(data);

      } catch (err) {
        console.error(err);
        setError("Failed to load threads");
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [filters]);

  return (
    <div className="px-4 py-4 md:px-6 lg:px-8">
      <div className="max-w-[1100px] mx-auto">
        
        <ThreadsHero
          title={
            filters.team !== "all"
              ? `${filters.team} Discussions`
              : "All Discussions"
          }
          subtitle="Join conversations across the community"
        />

        <div className="mt-5">
          <ThreadsFilterBar onChange={setFilters} />
        </div>

        <section className="mt-4 space-y-4">
          
          {/* Loading */}
          {loading && (
            <div className="text-text-secondary text-sm">
              Loading threads...
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && threads.length === 0 && (
            <div className="text-text-muted text-sm">
              No threads found.
            </div>
          )}

          {/* Threads */}
          {!loading && !error &&
            threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                id={thread.id}
                title={thread.title}
                excerpt="" // Excerpt currently not available in the list view, would require additional API work
                tags={thread.tags.map((t) => t.tag.name)}
                replies={thread._count.posts}
                team={thread.teamId || "none"}
                match={thread.matchId || "none"}
                meta={`Posted ${new Date(thread.createdAt).toLocaleString()} by ${thread.author.username}`}
              />
            ))}

          <StartDiscussionCard />
        </section>

      </div>
    </div>
  );
}