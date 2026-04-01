import { loadMatchesPayload } from "@/lib/data/matchesPayload";
import {
  loadStandingsPayload,
  type StandingsType,
} from "@/lib/data/standingsPayload";
import { prisma } from "@/lib/prisma";
import { setJson, tryAcquireLock } from "@/lib/redis";

const globalForWarmer = globalThis as unknown as {
  sportsdeckCacheWarmerStarted?: boolean;
};

/** Align with GET /api/matches Redis keys once wired. */
export function matchesCacheKeyLimit(limit: number): string {
  return `matches:lim:${limit}`;
}

export function matchesCacheKeyMatchday(matchday: number): string {
  return `matches:md:${matchday}`;
}

export function matchesCacheKeyDateRange(
  dateFrom: string,
  dateTo: string
): string {
  return `matches:dr:${dateFrom}:${dateTo}`;
}

/** Align with GET /api/standings Redis keys once wired. */
export function standingsCacheKey(season: string, type: StandingsType): string {
  return `standings:${season}:${type}`;
}

const HOME_MATCH_LIMIT = 6;
const MATCHES_INTERVAL_MS = 90_000;
const STANDINGS_INTERVAL_MS = 600_000;
/** TTL > refresh interval so a missed tick does not leave a gap. */
export const MATCHES_TTL_SECONDS = 120;
export const STANDINGS_TTL_SECONDS = 900;

/** Slightly longer than tick interval so only one replica runs Football-Data fetches per window. */
const MATCHES_LOCK_TTL_SECONDS = 95;
const STANDINGS_LOCK_TTL_SECONDS = 620;
const LOCK_MATCHES = "cachewarmer:matches";
const LOCK_STANDINGS = "cachewarmer:standings";

const STANDINGS_TYPES: StandingsType[] = ["TOTAL", "HOME", "AWAY"];

function cacheWarmerDisabled(): boolean {
  const v = process.env.CACHE_WARMER?.trim();
  return v === "0" || v?.toLowerCase() === "false";
}

function defaultStandingsSeason(): string {
  return String(new Date().getFullYear() - 1);
}

async function warmMatchesKeys(apiKey: string): Promise<void> {
  const limPayload = await loadMatchesPayload({
    apiKey,
    limit: HOME_MATCH_LIMIT,
  });
  await setJson(
    matchesCacheKeyLimit(HOME_MATCH_LIMIT),
    limPayload,
    MATCHES_TTL_SECONDS
  );

  const agg = await prisma.match.aggregate({ _max: { matchday: true } });
  const md = agg._max.matchday;
  if (md != null) {
    const mdPayload = await loadMatchesPayload({ apiKey, matchday: md });
    await setJson(
      matchesCacheKeyMatchday(md),
      mdPayload,
      MATCHES_TTL_SECONDS
    );
  }
}

async function warmStandingsKeys(apiKey: string): Promise<void> {
  const season = defaultStandingsSeason();
  for (const type of STANDINGS_TYPES) {
    const payload = await loadStandingsPayload({ apiKey, season, type });
    await setJson(
      standingsCacheKey(season, type),
      payload,
      STANDINGS_TTL_SECONDS
    );
  }
}

/**
 * Starts background Redis cache warming for matches (90s) and standings (10m).
 * No-op if REDIS_URL is unset, CACHE_WARMER=0/false, or X_AUTH_TOKEN is missing.
 * Idempotent: safe across HMR / repeated register().
 */
export function startCacheWarmer(): void {
  if (globalForWarmer.sportsdeckCacheWarmerStarted) return;
  if (!process.env.REDIS_URL?.trim()) return;
  if (cacheWarmerDisabled()) return;
  const apiKey = process.env.X_AUTH_TOKEN;
  if (!apiKey) return;

  globalForWarmer.sportsdeckCacheWarmerStarted = true;

  const tickMatches = async () => {
    try {
      const got = await tryAcquireLock(LOCK_MATCHES, MATCHES_LOCK_TTL_SECONDS);
      if (!got) return;
      await warmMatchesKeys(apiKey);
    } catch (e) {
      console.error("[cache-warmer] matches tick failed:", e);
    }
  };

  const tickStandings = async () => {
    try {
      const got = await tryAcquireLock(LOCK_STANDINGS, STANDINGS_LOCK_TTL_SECONDS);
      if (!got) return;
      await warmStandingsKeys(apiKey);
    } catch (e) {
      console.error("[cache-warmer] standings tick failed:", e);
    }
  };

  void tickMatches();
  void tickStandings();
  setInterval(() => {
    void tickMatches();
  }, MATCHES_INTERVAL_MS);
  setInterval(() => {
    void tickStandings();
  }, STANDINGS_INTERVAL_MS);
}
