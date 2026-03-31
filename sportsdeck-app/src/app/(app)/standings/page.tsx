import Link from "next/link";
import { headers } from "next/headers";

type StandingTeam = {
  name: string;
  logoUrl?: string;
};

type Standing = {
  id: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  season: string;
  type: "TOTAL" | "HOME" | "AWAY";
  team: StandingTeam;
};

type StandingType = "TOTAL" | "HOME" | "AWAY";

function getSearchParam(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value[0];
  return value;
}

async function getOriginFromHeaders(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  const proto =
    h.get("x-forwarded-proto") ?? h.get("x-forwarded-protocol") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost";
}

async function fetchStandings(type: StandingType, season: string): Promise<Standing[]> {
  const origin = await getOriginFromHeaders();
  const qs = new URLSearchParams({ type, season }).toString();
  const res = await fetch(`${origin}/api/standings?${qs}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { standings?: Standing[] };
  return data.standings ?? [];
}

/* ---------------- PAGE ---------------- */

export default async function StandingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};

  const rawType = getSearchParam(sp.type)?.toUpperCase();
  const selectedType: StandingType =
    rawType === "HOME" || rawType === "AWAY" ? rawType : "TOTAL";

  const selectedSeason = getSearchParam(sp.season) ?? "2025";

  const standings = await fetchStandings(selectedType, selectedSeason);

  const tableTitle =
    selectedType === "HOME"
      ? "Home Standings"
      : selectedType === "AWAY"
      ? "Away Standings"
      : "Total Standings";

  return (
    <div className="min-h-screen bg-bg-main text-text-primary">
      <div className="mx-auto max-w-7xl px-4 py-10">

        {/* ================= HERO ================= */}
        <section className="relative overflow-hidden rounded-3xl border border-border-subtle bg-bg-surface px-6 py-6 shadow-card">
          <div className="absolute inset-0 bg-gradient-glow opacity-80" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold text-primary">
                Premier League
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
                Season {selectedSeason}
              </p>
            </div>

            <Link
              href="/matches"
              className="inline-flex items-center justify-center rounded-xl bg-bg-card border border-border-subtle px-4 py-2 text-sm font-semibold hover:bg-bg-elevated transition"
            >
              View Matches
            </Link>
          </div>
        </section>

        {/* ================= FILTER ================= */}
        <div className="mt-6 rounded-2xl border border-border-subtle bg-bg-surface/80 p-4 shadow-soft backdrop-blur-xs">
          <form method="get" className="flex flex-wrap gap-4 items-end">

            <div>
              <label className="text-xs text-text-muted">Standings</label>
              <select
                name="type"
                defaultValue={selectedType}
                className="mt-1 rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-sm"
              >
                <option value="TOTAL">Total</option>
                <option value="HOME">Home</option>
                <option value="AWAY">Away</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-text-muted">Season</label>
              <select
                name="season"
                defaultValue={selectedSeason}
                className="mt-1 rounded-xl border border-border-subtle bg-bg-card px-3 py-2 text-sm"
              >
                <option value="2025">2025</option>
              </select>
            </div>

            <button className="rounded-xl bg-gradient-primary px-5 py-2 text-sm font-semibold text-primary shadow-glow">
              Apply
            </button>
          </form>
        </div>

        {/* ================= TABLE ================= */}
        <section className="mt-8 rounded-2xl border border-border-subtle bg-bg-card shadow-card overflow-hidden">

          <div className="border-b border-border-subtle px-4 py-3">
            <h2 className="text-lg font-semibold">{tableTitle}</h2>
          </div>

          {standings.length === 0 ? (
            <div className="px-4 py-10 text-center text-text-muted">
              No standings available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">

                <thead className="text-xs uppercase text-text-muted border-b border-border-subtle">
                  <tr>
                    <th className="px-4 py-3 text-left">#</th>
                    <th className="px-4 py-3 text-left">Team</th>
                    <th className="px-4 py-3 text-right">P</th>
                    <th className="px-4 py-3 text-right">W</th>
                    <th className="px-4 py-3 text-right">D</th>
                    <th className="px-4 py-3 text-right">L</th>
                    <th className="px-4 py-3 text-right">GF</th>
                    <th className="px-4 py-3 text-right">GA</th>
                    <th className="px-4 py-3 text-right">GD</th>
                    <th className="px-4 py-3 text-right">PTS</th>
                  </tr>
                </thead>

                <tbody>
                  {standings.map((row) => {
                    const gd = row.goalsFor - row.goalsAgainst;

                    return (
                      <tr
                        key={row.id}
                        className="border-t border-border-subtle hover:bg-bg-elevated transition"
                      >
                        <td className="px-4 py-3 font-semibold text-text-secondary">
                          {row.position}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {row.team.logoUrl ? (
                              <img
                                src={row.team.logoUrl}
                                className="h-7 w-7 rounded-full bg-bg-surface"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-bg-surface" />
                            )}
                            <span className="font-semibold">
                              {row.team.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right">{row.played}</td>
                        <td className="px-4 py-3 text-right">{row.won}</td>
                        <td className="px-4 py-3 text-right">{row.drawn}</td>
                        <td className="px-4 py-3 text-right">{row.lost}</td>
                        <td className="px-4 py-3 text-right">{row.goalsFor}</td>
                        <td className="px-4 py-3 text-right">{row.goalsAgainst}</td>

                        <td
                          className={`px-4 py-3 text-right font-semibold ${
                            gd > 0
                              ? "text-emerald-400"
                              : gd < 0
                              ? "text-red-400"
                              : "text-text-secondary"
                          }`}
                        >
                          {gd > 0 ? `+${gd}` : gd}
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-primary-400">
                          {row.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}