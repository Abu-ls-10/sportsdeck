"use client";

import { useState } from "react";
import ThreadsHero from "@/components/threads/ThreadsHero";
import ThreadsFilterBar, {
  ThreadFilters,
} from "@/components/threads/ThreadsFilterBar";
import ThreadCard from "@/components/threads/ThreadCard";
import StartDiscussionCard from "@/components/threads/StartDiscussionCard";

const threads = [
  {
    title: "Match Thread: City vs Madrid",
    excerpt: "Live reactions...",
    tags: ["match"],
    replies: 2400,
    team: "man-city",
    match: "ucl-qf",
    meta: "Posted 4h ago by Mod_Kevin",
  },
  {
    title: "Summer Transfers Discussion",
    excerpt: "Who should we sign?",
    tags: ["transfers"],
    replies: 158,
    team: "man-city",
    match: "none",
    meta: "Posted 12h ago by BlueMoon01",
  },
];

export default function ThreadsPage() {
  const [filters, setFilters] = useState<ThreadFilters>({
    search: "",
    team: "all",
    match: "all",
    sort: "recent",
    tag: "all",
  });

  const filteredThreads = threads
    .filter((t) => {
      if (
        filters.search &&
        !t.title.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;

      if (filters.team !== "all" && t.team !== filters.team)
        return false;

      if (filters.match !== "all" && t.match !== filters.match)
        return false;

      if (
        filters.tag !== "all" &&
        !t.tags.includes(filters.tag)
      )
        return false;

      return true;
    })
    .sort((a, b) => {
      if (filters.sort === "replies") return b.replies - a.replies;
      return 0;
    });

  return (
    <div className="px-4 py-4 md:px-6 lg:px-8">
      <div className="max-w-[1100px] mx-auto">
        
        <ThreadsHero />

        <div className="mt-5">
          <ThreadsFilterBar onChange={setFilters} />
        </div>

        <section className="mt-4 space-y-4">
          {filteredThreads.map((thread, i) => (
            <ThreadCard key={i} {...thread} />
          ))}

          <StartDiscussionCard />
        </section>

      </div>
    </div>
  );
}