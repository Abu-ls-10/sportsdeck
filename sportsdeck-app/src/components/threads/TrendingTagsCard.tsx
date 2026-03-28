const tags = ["#UCL", "#Haaland", "#Pep", "#TrebleCharge", "#InjuryUpdate"];

export default function TrendingTagsCard() {
  return (
    <div className="rounded-2xl border border-white/6 bg-bg-surface p-4 shadow-soft">
      <h3 className="mb-4 text-sm font-semibold text-white">Trending Tags</h3>

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            className="rounded-full bg-white/[0.04] px-3 py-1.5 text-xs text-text-secondary transition hover:bg-primary-500/10 hover:text-primary-300"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}