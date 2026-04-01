"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X, User } from "lucide-react";

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

type SearchUser = {
  id: string;
  username: string;
  avatarUrl?: string | null;
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

  // USER SEARCH
  const [userResults, setUserResults] = useState<SearchUser[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const searchRef = useRef<HTMLDivElement>(null);

  // =========================
  // FILTER DATA
  // =========================
  const [teams, setTeams] = useState<Team[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

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
  // THREAD SEARCH (debounced)
  // =========================
  useEffect(() => {
    const timeout = setTimeout(() => {
      updateFilters({ search: searchInput });
    }, 400);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  // =========================
  // USER SEARCH (live)
  // =========================
  useEffect(() => {
    if (searchInput.trim().length < 2) {
      setUserResults([]);
      setShowDropdown(false);
      return;
    }

    const controller = new AbortController();

    const timeout = setTimeout(async () => {
      try {
        setLoadingUsers(true);

        const res = await fetch(
          `/api/search/users?q=${encodeURIComponent(searchInput)}`,
          { signal: controller.signal }
        );

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          setUserResults([]);
          return;
        }

        const results = Array.isArray(data?.data) ? data.data : [];

        setUserResults(results);
        setShowDropdown(true);
        setHighlightIndex(results.length ? 0 : -1);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setUserResults([]);
        }
      } finally {
        setLoadingUsers(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [searchInput]);

  // =========================
  // CLICK OUTSIDE
  // =========================
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < userResults.length - 1 ? prev + 1 : 0
      );
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : userResults.length - 1
      );
    }

    if (e.key === "Enter") {
      if (highlightIndex >= 0 && userResults[highlightIndex]) {
        window.location.href = `/users/${userResults[highlightIndex].id}`;
      }
    }

    if (e.key === "Escape") {
      setShowDropdown(false);
    }
  }

  return (
    <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 shadow-card">
      
      {/* SEARCH */}
      <div ref={searchRef} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted h-4 w-4" />

        <input
          placeholder="Search threads or users..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-2 rounded-xl bg-bg-card border border-border-subtle text-sm outline-none focus:border-primary-500"
        />

        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* DROPDOWN */}
        {showDropdown && (
          <div className="absolute top-full mt-2 w-full bg-bg-card border border-border-subtle rounded-xl shadow-xl z-50">
            
            <div className="px-3 py-2 text-xs text-text-muted border-b border-border-subtle">
              Users
            </div>

            {loadingUsers ? (
              <div className="p-3 text-sm text-text-secondary">Searching...</div>
            ) : userResults.length === 0 ? (
              <div className="p-3 text-sm text-text-secondary">
                No users found
              </div>
            ) : (
              userResults.map((u, i) => (
                <button
                  key={u.id}
                  onClick={() => (window.location.href = `/users/${u.id}`)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition ${
                    i === highlightIndex
                      ? "bg-accent-500/10 text-primary"
                      : "hover:bg-bg-elevated"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-accent-500/20 flex items-center justify-center text-xs">
                    {u.username.slice(0, 2).toUpperCase()}
                  </div>
                  {u.username}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* FILTER ROW */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">

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

        <select
          value={filters.match}
          disabled
          className="bg-bg-card border border-border-subtle px-3 py-2 rounded-xl text-sm"
        >
          <option value="all">All Matches</option>
        </select>

        <select
          value={filters.sort}
          onChange={(e) => updateFilters({ sort: e.target.value })}
          className="bg-bg-card border border-border-subtle px-3 py-2 rounded-xl text-sm"
        >
          <option value="recent">Most Recent</option>
          <option value="top">Most Replies</option>
        </select>

        <button
          onClick={resetFilters}
          className="text-xs text-text-muted hover:text-primary"
        >
          Reset
        </button>
      </div>

      {/* TAGS */}
      <div className="mt-4 overflow-x-auto flex gap-2 pb-1">
        <button
          onClick={() => updateFilters({ tag: "all" })}
          className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
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
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap ${
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
    </div>
  );
}