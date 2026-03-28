export default function QuickPostCard() {
  return (
    <div className="rounded-2xl border border-white/6 bg-bg-surface p-4 shadow-soft">
      <h3 className="mb-4 text-sm font-semibold text-white">Quick Post</h3>

      <div className="space-y-3">
        <input
          placeholder="Title"
          className="h-10 w-full rounded-xl border border-white/5 bg-bg-card px-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-primary-500/50"
        />

        <textarea
          placeholder="What’s on your mind?"
          rows={4}
          className="w-full rounded-xl border border-white/5 bg-bg-card px-3 py-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-primary-500/50"
        />

        <input
          placeholder="Tags (comma separated)"
          className="h-10 w-full rounded-xl border border-white/5 bg-bg-card px-3 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-primary-500/50"
        />

        <button className="w-full rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
          Post Discussion
        </button>
      </div>
    </div>
  );
}