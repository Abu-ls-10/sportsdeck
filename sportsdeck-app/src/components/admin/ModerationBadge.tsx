"use client";

type BadgeTone = "slate" | "amber" | "rose" | "emerald" | "sky";

function toneClass(tone: BadgeTone): string {
  switch (tone) {
    case "amber":
      return "border-amber-500/40 bg-amber-500/15 text-amber-200";
    case "rose":
      return "border-rose-500/40 bg-rose-500/15 text-rose-200";
    case "emerald":
      return "border-emerald-500/40 bg-emerald-500/15 text-emerald-200";
    case "sky":
      return "border-sky-500/40 bg-sky-500/15 text-sky-200";
    default:
      return "border-slate-600/70 bg-slate-800/70 text-slate-200";
  }
}

function toneForStatus(status: string): BadgeTone {
  const normalized = status.toLowerCase();
  if (normalized === "pending") return "amber";
  if (normalized === "approved") return "emerald";
  if (normalized === "dismissed") return "slate";
  if (normalized === "active") return "rose";
  if (normalized === "lifted") return "emerald";
  if (normalized === "rejected") return "rose";
  return "slate";
}

function toneForRecommendation(value: string): BadgeTone {
  const normalized = value.toLowerCase();
  if (normalized.includes("inappropriate") || normalized.includes("high")) return "rose";
  if (normalized.includes("review") || normalized.includes("medium")) return "amber";
  if (normalized.includes("safe") || normalized.includes("low")) return "emerald";
  return "sky";
}

type BadgeProps = {
  text: string;
  tone?: BadgeTone;
};

export function ModerationBadge({ text, tone }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${toneClass(tone ?? "slate")}`}>
      {text}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return <ModerationBadge text={status.toUpperCase()} tone={toneForStatus(status)} />;
}

export function VerdictBadge({ recommendation }: { recommendation: string }) {
  return <ModerationBadge text={recommendation.replaceAll("_", " ")} tone={toneForRecommendation(recommendation)} />;
}

export function scoreLabel(score: number | null | undefined): string {
  if (score == null) return "N/A";
  return `${Math.round(score * 100)}`;
}
