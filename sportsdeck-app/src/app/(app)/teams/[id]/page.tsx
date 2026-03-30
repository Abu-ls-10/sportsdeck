import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

/* ---------------- UTIL ---------------- */

function hashHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h + name.charCodeAt(i) * (i + 1)) % 360;
  }
  return h;
}

/* ---------------- PAGE ---------------- */

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: { _count: { select: { threads: true } } },
  });

  if (!team) notFound();

  const hue = hashHue(team.name);

  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      <div className="mx-auto max-w-4xl px-4 py-10">

        {/* BACK */}
        <Link
          href="/teams"
          className="text-sm text-primary-400 hover:text-primary-300"
        >
          ← All teams
        </Link>

        {/* ================= HERO ================= */}
        <section className="relative mt-6 overflow-hidden rounded-3xl border border-border-subtle bg-bg-surface px-6 py-8 shadow-card">

          {/* Gradient glow */}
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background: `radial-gradient(circle at 20% 30%, hsla(${hue}, 70%, 40%, 0.25), transparent 60%)`,
            }}
          />

          <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">

            {/* LOGO */}
            <div
              className="flex h-28 w-28 items-center justify-center rounded-2xl border border-border-subtle bg-bg-card"
              style={{
                backgroundColor: `hsla(${hue}, 35%, 18%, 0.8)`,
              }}
            >
              <img
                src={team.logoUrl}
                alt=""
                className="h-[70%] w-[70%] object-contain"
              />
            </div>

            {/* INFO */}
            <div className="flex-1">
              <h1 className="text-3xl font-semibold text-white">
                {team.name}
              </h1>

              <p className="mt-1 text-text-secondary">
                {team.shortName}
              </p>

              <p className="mt-3 text-sm text-text-muted">
                {team.venue}
              </p>

              {/* META */}
              <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
                <div className="rounded-xl border border-border-subtle bg-bg-card px-4 py-2 text-sm">
                  <span className="text-text-muted">Threads</span>{" "}
                  <span className="font-semibold text-white">
                    {team._count.threads}
                  </span>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">

                <Link
                  href={`/threads?teamId=${team.id}`}
                  className="rounded-xl bg-gradient-primary px-5 py-2 text-sm font-semibold text-white shadow-glow"
                >
                  Open Forum
                </Link>

                <Link
                  href="/matches"
                  className="rounded-xl border border-border-subtle px-5 py-2 text-sm font-semibold text-text-primary hover:bg-bg-elevated"
                >
                  View Fixtures
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FUTURE SECTION ================= */}
        <section className="mt-8 rounded-2xl border border-border-subtle bg-bg-card p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-white mb-2">
            Team Overview
          </h2>
          <p className="text-sm text-text-muted">
            More detailed team stats, recent matches, and player info can go here.
          </p>
        </section>

      </div>
    </div>
  );
}