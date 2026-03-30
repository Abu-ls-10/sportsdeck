export default function RecentActivity() {
  return (
    <div className="bg-bg-surface border border-border-subtle rounded-2xl p-4 shadow-soft">
      
      <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>

      <div className="space-y-3 text-sm">
        
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-xs">
            JD
          </div>
          <p className="text-text-secondary">
            JoshD replied to Draft Strategy
          </p>
        </div>

        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center text-xs">
            50+
          </div>
          <p className="text-text-secondary">
            50+ users liked your post
          </p>
        </div>

        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-bg-card flex items-center justify-center text-xs">
            SM
          </div>
          <p className="text-text-secondary">
            SarahM started a new thread
          </p>
        </div>

      </div>
    </div>
  );
}