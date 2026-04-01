const tabs = [
  "General Discussion",
  "News & Updates",
  "Rumors",
  "Polls",
];

export default function CommunityTabs() {
  return (
    <div className="flex gap-6 border-b border-border-subtle">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          className={`pb-3 text-sm transition ${
            i === 0
              ? "text-primary-400 border-b-2 border-primary-500"
              : "text-text-secondary hover:text-primary"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}