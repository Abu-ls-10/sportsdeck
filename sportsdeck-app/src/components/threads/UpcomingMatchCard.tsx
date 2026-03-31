export default function UpcomingMatchCard() {
  return (
    <div className="rounded-2xl border border-white/6 bg-bg-surface p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-400">
          Upcoming Match
        </p>
        <span className="rounded-md bg-brand-500 px-2 py-1 text-[10px] font-semibold text-primary">
          LIVE SOON
        </span>
      </div>

      <div className="rounded-2xl bg-white/[0.03] px-4 py-5">
        <div className="grid grid-cols-3 items-center text-center">
          <div>
            <div className="mx-auto h-10 w-10 rounded-xl bg-sky-300" />
            <p className="mt-2 text-xs text-text-secondary">Man City</p>
          </div>

          <div>
            <p className="text-xs text-text-muted">20:00</p>
            <p className="mt-1 text-lg font-semibold text-primary">VS</p>
          </div>

          <div>
            <div className="mx-auto h-10 w-10 rounded-xl bg-neutral-200" />
            <p className="mt-2 text-xs text-text-secondary">Real Madrid</p>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] uppercase tracking-[0.12em] text-text-muted">
          Etihad Stadium | UEFA Champions League
        </p>
      </div>
    </div>
  );
}