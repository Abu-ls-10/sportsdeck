export default function TrendingTopics() {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 shadow-soft">
      <h3 className="text-sm font-semibold mb-3">Trending Topics</h3>

      <div className="space-y-3 text-sm">
        <div>
          <p className="text-text-muted text-xs">#ExpansionRumors</p>
          <p className="text-primary">Seattle & Vegas Expansion</p>
        </div>

        <div>
          <p className="text-text-muted text-xs">#PlayerTrade</p>
          <p className="text-primary">Mid-season trade window</p>
        </div>

        <div>
          <p className="text-text-muted text-xs">#RuleChanges</p>
          <p className="text-primary">Overtime rules reform</p>
        </div>
      </div>
    </div>
  );
}