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

export default async function StandingsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};

  const rawType = getSearchParam(sp.type)?.toUpperCase();
  const selectedType: StandingType =
    rawType === "HOME" || rawType === "AWAY" ? rawType : "TOTAL";

  // For now keep dropdown limited to 2025.
  const selectedSeason = getSearchParam(sp.season) ?? "2025";

  const standings = await fetchStandings(selectedType, selectedSeason);

  const tableTitle =
    selectedType === "HOME"
      ? "Home Standings"
      : selectedType === "AWAY"
        ? "Away Standings"
        : "Total Standings";

  return (
    <div className="min-h-screen bg-black text-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Premier League</h1>
            <p className="mt-1 text-sm text-zinc-400">Season {selectedSeason}</p>
          </div>

          <Link
            href="/matches"
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-800"
          >
            Matches
          </Link>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <form method="get" className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="type" className="text-xs text-zinc-400">
                Standings
              </label>
              <select
                id="type"
                name="type"
                defaultValue={selectedType}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
              >
                <option value="TOTAL">Total Standings</option>
                <option value="HOME">Home Standings</option>
                <option value="AWAY">Away Standings</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="season" className="text-xs text-zinc-400">
                Season
              </label>
              <select
                id="season"
                name="season"
                defaultValue={selectedSeason}
                className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm"
              >
                <option value="2025">2025</option>
              </select>
            </div>

            <button
              type="submit"
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400"
            >
              Apply
            </button>
          </form>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60">
          <div className="border-b border-zinc-800 px-4 py-3">
            <h2 className="text-lg font-bold tracking-tight">{tableTitle}</h2>
          </div>

          {standings.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-400">
              No standings available for this selection.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-zinc-900/80 text-xs uppercase tracking-wider text-zinc-400">
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
                      <tr key={row.id} className="border-t border-zinc-800">
                        <td className="px-4 py-3 font-semibold text-zinc-300">{row.position}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {row.team?.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={row.team.logoUrl}
                                alt={`${row.team.name} logo`}
                                className="h-6 w-6 rounded-full bg-zinc-900"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-zinc-900" />
                            )}
                            <span className="font-semibold">{row.team?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-zinc-300">{row.played}</td>
                        <td className="px-4 py-3 text-right text-zinc-300">{row.won}</td>
                        <td className="px-4 py-3 text-right text-zinc-300">{row.drawn}</td>
                        <td className="px-4 py-3 text-right text-zinc-300">{row.lost}</td>
                        <td className="px-4 py-3 text-right text-zinc-300">{row.goalsFor}</td>
                        <td className="px-4 py-3 text-right text-zinc-300">{row.goalsAgainst}</td>
                        <td
                          className={`px-4 py-3 text-right font-semibold ${
                            gd > 0 ? "text-emerald-400" : gd < 0 ? "text-rose-400" : "text-zinc-300"
                          }`}
                        >
                          {gd > 0 ? `+${gd}` : gd}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-sky-400">{row.points}</td>
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
