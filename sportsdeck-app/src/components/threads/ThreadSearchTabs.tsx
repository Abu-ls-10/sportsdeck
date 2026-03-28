import { Search } from "lucide-react";

const tabs = ["General Threads", "Match Threads", "Polls"];

export default function ThreadSearchTabs() {
  return (
    <div className="rounded-2xl border border-white/6 bg-bg-surface p-4 shadow-soft">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          placeholder="Search threads by title, author, or tags..."
          className="h-11 w-full rounded-xl border border-white/5 bg-bg-card pl-11 pr-4 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-primary-500/50"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-b border-white/6 pb-1">
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              index === 0
                ? "text-primary-400"
                : "text-text-secondary hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}