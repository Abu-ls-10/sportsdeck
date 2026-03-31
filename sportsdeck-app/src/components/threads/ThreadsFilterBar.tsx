"use client";

import { useEffect, useState } from "react";

export type ThreadFilters = {
  search: string;
  team: string;
  match: string;
  sort: string;
  tag: string;
};

type Props = {
  onChange: (filters: ThreadFilters) => void;
};

type Team = {
  id: string;
  name: string;
};

type Tag = {
  id: string;
  name: string;
};

export default function ThreadsFilterBar({ onChange }: Props) {
  const [filters, setFilters] = useState<ThreadFilters>({
    search: "",
    team: "all",
    match: "all",
    sort: "recent",
    tag: "all",
  });

  const [searchInput, setSearchInput] = useState("");

  // Dynamic data
  const [teams, setTeams] = useState<Team[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [loadingMeta, setLoadingMeta] = useState(true);

  // =========================
  // FETCH FILTER DATA
  // =========================
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setLoadingMeta(true);

        const [teamsRes, tagsRes] = await Promise.all([
          fetch("/api/teams"),
          fetch("/api/tags"),
        ]);

        const teamsData = await teamsRes.json().catch(() => []);
        const tagsData = await tagsRes.json().catch(() => []);

        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setTags(Array.isArray(tagsData) ? tagsData : []);

      } catch (err) {
        console.error("Failed to load filter metadata", err);
      } finally {
        setLoadingMeta(false);
      }
    };

    fetchMeta();
  }, []);

  // =========================
  // DEBOUNCED SEARCH
  // =========================
  useEffect(() => {
    const timeout = setTimeout(() => {
      updateFilters({ search: searchInput });
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  function updateFilters(newValues: Partial<ThreadFilters>) {
    const updated = { ...filters, ...newValues };
    setFilters(updated);
    onChange(updated);
  }

  function resetFilters() {
    const reset = {
      search: "",
      team: "all",
      match: "all",
      sort: "recent",
      tag: "all",
    };
    setFilters(reset);
    setSearchInput("");
    onChange(reset);
  }

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 shadow-soft">
      
      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        
        {/* SEARCH */}
        <input
          placeholder="Search threads..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="md:col-span-2 bg-bg-card border border-border-subtle px-4 py-2 rounded-xl text-sm outline-none focus:border-primary-500"
        />

        {/* TEAM */}
        <select
          value={filters.team}
          onChange={(e) => updateFilters({ team: e.target.value })}
          className="bg-bg-card border border-border-subtle px-3 py-2 rounded-xl text-sm"
          disabled={loadingMeta}
        >
          <option value="all">All Teams</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>

        {/* MATCH (Optional / Future) */}
        <select
          value={filters.match}
          onChange={(e) => updateFilters({ match: e.target.value })}
          className="bg-bg-card border border-border-subtle px-3 py-2 rounded-xl text-sm"
          disabled
        >
          <option value="all">All Matches</option>
        </select>

        {/* SORT */}
        <select
          value={filters.sort}
          onChange={(e) => updateFilters({ sort: e.target.value })}
          className="bg-bg-card border border-border-subtle px-3 py-2 rounded-xl text-sm"
        >
          <option value="recent">Most Recent</option>
          <option value="top">Most Replies</option>
        </select>
      </div>

      {/* Row 2 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        
        {/* TAGS */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => updateFilters({ tag: "all" })}
            className={`px-3 py-1.5 rounded-full text-xs ${
              filters.tag === "all"
                ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                : "bg-bg-card text-text-secondary hover:bg-bg-elevated"
            }`}
          >
            ALL
          </button>

          {tags.map((tag) => {
            const isActive = filters.tag === tag.name;

            return (
              <button
                key={tag.id}
                onClick={() => updateFilters({ tag: tag.name })}
                className={`px-3 py-1.5 rounded-full text-xs transition ${
                  isActive
                    ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                    : "bg-bg-card text-text-secondary hover:bg-bg-elevated"
                }`}
              >
                {tag.name.toUpperCase()}
              </button>
            );
          })}
        </div>

        {/* RESET */}
        <button
          onClick={resetFilters}
          className="text-xs text-text-muted hover:text-primary transition"
        >
          Reset filters
        </button>
      </div>
    </div>
  );
}