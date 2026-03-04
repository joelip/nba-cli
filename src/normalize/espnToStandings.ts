import type { ESPNStandingsResponse } from "../models/espnScoreboard";
import type { StatsResultSetsResponse } from "../models/statsResultSets";

/**
 * Convert ESPN standings response to StatsResultSetsResponse format
 * matching what `getResultSet(response, "Standings")` expects.
 */
export function espnToStandings(espn: ESPNStandingsResponse): StatsResultSetsResponse {
  const headers = ["TeamCity", "TeamName", "TeamSlug", "WINS", "LOSSES", "WinPCT"];
  const rowSet: (string | number | null)[][] = [];

  for (const conference of espn.children ?? []) {
    for (const entry of conference.standings?.entries ?? []) {
      const wins = getStat(entry.stats, ["wins", "WINS"]);
      const losses = getStat(entry.stats, ["losses", "LOSSES"]);
      const winPct = getStat(entry.stats, ["winPercent", "winPct", "W_PCT", "WinPCT"]);

      rowSet.push([
        entry.team.location,
        entry.team.name,
        entry.team.name.toLowerCase().replace(/\s+/g, "-"),
        wins,
        losses,
        winPct,
      ]);
    }
  }

  return {
    resultSets: [
      {
        name: "Standings",
        headers,
        rowSet,
      },
    ],
  };
}

function getStat(stats: Array<{ name: string; abbreviation?: string; displayName?: string; value: number | string }>, names: string[]): number {
  const stat = stats.find(
    (candidate) =>
      names.includes(candidate.name) ||
      names.includes(candidate.abbreviation ?? "") ||
      names.includes(candidate.displayName ?? ""),
  );
  if (!stat) {
    return 0;
  }

  const parsed = Number.parseFloat(String(stat.value));
  return Number.isNaN(parsed) ? 0 : parsed;
}
