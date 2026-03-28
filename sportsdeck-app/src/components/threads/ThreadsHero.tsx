import { Bell } from "lucide-react";

export default function ThreadsHero() {
  return (
    <section className="rounded-3xl border border-white/6 bg-bg-surface px-4 py-4 shadow-card md:px-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-300/15 ring-1 ring-sky-300/20">
            <div className="h-7 w-7 rounded-full bg-sky-300" />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-white md:text-2xl">
              Manchester City FC
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
              <span>1.12M Members</span>
              <span className="h-1 w-1 rounded-full bg-text-muted" />
              <span className="text-accent-400">Official Forum</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.03] text-text-secondary transition hover:bg-white/[0.06] hover:text-white">
            <Bell className="h-4 w-4" />
          </button>

          <button className="rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:brightness-110">
            Follow Team
          </button>
        </div>
      </div>
    </section>
  );
}