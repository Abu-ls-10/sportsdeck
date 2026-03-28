"use client";

import { useState } from "react";

export type ThreadFilters = {
  search: string;
  team: string;
  match: string;
  sort: string;
  tag: string;
};

export default function ThreadsFilterBar({
  onChange,
}: {
  onChange: (filters: ThreadFilters) => void;
}) {
  const [filters, setFilters] = useState<ThreadFilters>({
    search: "",
    team: "all",
    match: "all",
    sort: "recent",
    tag: "all",
  });

  function updateFilters(newValues: Partial<ThreadFilters>) {
    const updated = { ...filters, ...newValues };
    setFilters(updated);
    onChange(updated);
  }

  const tags = ["all", "match", "transfers", "analysis"];

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 shadow-soft">
      
      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        
        {/* Search */}
        <input
          placeholder="Search threads..."
          value={filters.search}
          onChange={(e) =>
            updateFilters({ search: e.target.value })
          }
          className="md:col-span-2 bg-bg-card border border-border-subtle px-4 py-2 rounded-xl text-sm outline-none focus:border-primary-500"
        />

        {/* Team */}
        <select
          value={filters.team}
          onChange={(e) =>
            updateFilters({ team: e.target.value })
          }
          className="bg-bg-card border border-border-subtle px-3 py-2 rounded-xl text-sm"
        >
          <option value="all">All Teams</option>
          <option value="man-city">Man City</option>
          <option value="arsenal">Arsenal</option>
        </select>

        {/* Match */}
        <select
          value={filters.match}
          onChange={(e) =>
            updateFilters({ match: e.target.value })
          }
          className="bg-bg-card border border-border-subtle px-3 py-2 rounded-xl text-sm"
        >
          <option value="all">All Matches</option>
          <option value="ucl-qf">Man City vs Real Madrid</option>
        </select>

        {/* Sort */}
        <select
          value={filters.sort}
          onChange={(e) =>
            updateFilters({ sort: e.target.value })
          }
          className="bg-bg-card border border-border-subtle px-3 py-2 rounded-xl text-sm"
        >
          <option value="recent">Most Recent</option>
          <option value="replies">Most Replies</option>
          <option value="top">Top Rated</option>
        </select>
      </div>

      {/* Row 2 - TAGS */}
      <div className="flex flex-wrap gap-2 mt-4">
        {tags.map((tag) => {
          const isActive = filters.tag === tag;

          return (
            <button
              key={tag}
              onClick={() => updateFilters({ tag })}
              className={`px-3 py-1.5 rounded-full text-xs transition ${
                isActive
                  ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                  : "bg-bg-card text-text-secondary hover:bg-bg-elevated"
              }`}
            >
              {tag.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}