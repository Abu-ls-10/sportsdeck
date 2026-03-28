export default function StartDiscussionCard() {
  return (
    <div className="rounded-2xl border border-dashed border-primary-500/30 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(14,165,233,0.02))] px-6 py-8 text-center shadow-soft">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-xl font-semibold text-white shadow-glow">
        +
      </div>

      <h3 className="mt-4 text-xl font-semibold text-white">
        Have something to share?
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
        Start a new thread and engage with the community.
      </p>

      <button className="mt-5 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
        Start a Discussion
      </button>
    </div>
  );
}