export default function QuickPoll() {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 shadow-soft">
      
      <h3 className="text-sm font-semibold mb-3">Quick Poll</h3>

      <p className="text-text-secondary text-sm mb-3">
        Best venue atmosphere?
      </p>

      <div className="space-y-2">
        {["Madison Arena", "Colosseum Park", "The Sky Dome"].map((item) => (
          <button
            key={item}
            className="w-full text-left px-3 py-2 rounded-xl bg-bg-card hover:bg-bg-elevated text-sm transition"
          >
            {item}
          </button>
        ))}
      </div>

      <p className="text-xs text-text-muted mt-3">
        12,430 people voted
      </p>
    </div>
  );
}