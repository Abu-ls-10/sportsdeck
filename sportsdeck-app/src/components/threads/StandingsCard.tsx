const standings = [
  { team: "Liverpool", pts: 71 },
  { team: "Arsenal", pts: 70, active: true },
  { team: "Man City", pts: 70 },
];

export default function StandingsCard() {
  return (
    <div className="rounded-2xl border border-white/6 bg-bg-surface p-4 shadow-soft">
      <h3 className="mb-4 text-sm font-semibold text-primary">Team Standings</h3>

      <div className="space-y-2">
        {standings.map((team, index) => (
          <div
            key={team.team}
            className={`flex items-center justify-between rounded-xl px-3 py-2 ${
              team.active ? "bg-primary-500/10 ring-1 ring-primary-500/20" : "bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-4 text-xs text-text-muted">{index + 1}</span>
              <span className="text-sm text-text-primary">{team.team}</span>
            </div>
            <span className="text-sm font-semibold text-primary">{team.pts} pts</span>
          </div>
        ))}
      </div>

      <button className="mt-4 text-xs font-medium text-primary-400 hover:text-primary-300">
        View Full Table
      </button>
    </div>
  );
}