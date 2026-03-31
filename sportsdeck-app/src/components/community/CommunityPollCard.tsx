export default function CommunityPollCard() {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 shadow-soft">
      
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] uppercase text-accent-400 bg-accent-500/10 px-2 py-1 rounded">
          Active Poll
        </span>
        <span className="text-xs text-text-muted">8.4k votes</span>
      </div>

      <h3 className="text-primary font-semibold">
        Who is your MVP mid-season favorite?
      </h3>

      <div className="mt-4 space-y-3">
        
        <div>
          <div className="flex justify-between text-xs text-text-secondary mb-1">
            <span>Jordan Davis</span>
            <span>65%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full">
            <div className="h-2 bg-gradient-primary rounded-full w-[65%]" />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-text-secondary mb-1">
            <span>Luca Rossi</span>
            <span>35%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full">
            <div className="h-2 bg-gradient-primary rounded-full w-[35%]" />
          </div>
        </div>

      </div>
    </div>
  );
}