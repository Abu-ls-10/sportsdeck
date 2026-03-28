"use client";

export default function AuthCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        relative
        rounded-2xl
        p-6

        bg-gradient-card
        border border-border-subtle

        shadow-card
        backdrop-blur-sm

        transition-all duration-300
        hover:shadow-glow
      "
    >
      {/* subtle inner highlight */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent opacity-60" />

      {/* content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}