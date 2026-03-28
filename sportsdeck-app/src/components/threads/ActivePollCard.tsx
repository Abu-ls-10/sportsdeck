const pollOptions = [
  { label: "Kevin De Bruyne", value: 72 },
  { label: "Phil Foden", value: 18 },
  { label: "Rodri", value: 10 },
];

export default function ActivePollCard() {
  return (
    <div className="rounded-2xl border border-white/6 bg-bg-surface p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Active Poll</h3>
        <span className="rounded-md bg-brand-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-400">
          24h left
        </span>
      </div>

      <p className="text-sm font-medium leading-6 text-text-primary">
        Who was your MOTM against Crystal Palace?
      </p>

      <div className="mt-4 space-y-3">
        {pollOptions.map((option) => (
          <div key={option.label}>
            <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
              <span>{option.label}</span>
              <span>{option.value}%</span>
            </div>

            <div className="h-2 rounded-full bg-white/[0.05]">
              <div
                className="h-2 rounded-full bg-gradient-primary"
                style={{ width: `${option.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] text-text-muted">Total Votes: 12,481</p>
    </div>
  );
}