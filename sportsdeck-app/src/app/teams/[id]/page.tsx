import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    include: { _count: { select: { threads: true } } },
  });

  if (!team) notFound();

  return (
    <div className="min-h-screen bg-[#060a14] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <Link href="/teams" className="text-sm text-sky-400 hover:text-sky-300">
          ← All teams
        </Link>
        <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl border border-slate-700/60 bg-[#0d1424] p-8 text-center sm:flex-row sm:text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={team.logoUrl}
            alt=""
            className="h-24 w-24 shrink-0 rounded-xl border border-slate-600/50 bg-slate-900/80 object-contain p-2"
          />
          <div>
            <h1 className="text-2xl font-bold text-white">{team.name}</h1>
            <p className="mt-1 text-slate-400">{team.shortName}</p>
            <p className="mt-3 text-sm text-slate-500">{team.venue}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3 sm:justify-start">
              <Link
                href={`/threads?teamId=${team.id}`}
                className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
              >
                Open team forum
              </Link>
              <Link
                href="/matches"
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800"
              >
                View fixtures
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
