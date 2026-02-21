import type { ESPNStandingsResponse } from "../models/espnScoreboard";
import type { StatsResultSetsResponse } from "../models/statsResultSets";

/**
 * Convert ESPN standings response to StatsResultSetsResponse format
 * matching what `getResultSet(response, "Standings")` expects.
 */
export function espnToStandings(espn: ESPNStandingsResponse): StatsResultSetsResponse {
  const headers = ["TeamCity", "TeamName", "TeamSlug", "WINS", "LOSSES", "WinPCT"];
  const rowSet: (string | number | null)[][] = [];

  for (const conference of espn.children) {
    for (const entry of conference.standings.entries) {
      const wins = getStat(entry.stats, "wins");
      const losses = getStat(entry.stats, "losses");
      const winPct = getStat(entry.stats, "winPercent");

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

function getStat(stats: Array<{ name: string; value: number }>, name: string): number {
  return stats.find((s) => s.name === name)?.value ?? 0;
}
