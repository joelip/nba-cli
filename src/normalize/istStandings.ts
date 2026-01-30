import type {
  ISTStandingsGame,
  ISTStandingsResponse,
} from "../models/istStandings";
import type { StatsResultSetValue } from "../models/statsResultSets";
import type { RowFromHeaders } from "./statsResultSets";

const IST_TEAM_FIELDS = [
  "teamId",
  "teamCity",
  "teamName",
  "teamAbbreviation",
  "teamSlug",
  "conference",
  "istGroup",
  "clinchIndicator",
  "clinchedIstKnockout",
  "clinchedIstGroup",
  "clinchedIstWildcard",
  "istWildcardRank",
  "istGroupRank",
  "istKnockoutRank",
  "wins",
  "losses",
  "pct",
  "istGroupGb",
  "istWildcardGb",
  "diff",
  "pts",
  "oppPts",
] as const;

const IST_GAME_FIELDS = [
  "gameId",
  "opponentTeamAbbreviation",
  "location",
  "gameStatus",
  "gameStatusText",
  "outcome",
] as const;

const IST_GAME_COUNT = 4;

const IST_STANDINGS_HEADERS = [
  "leagueId",
  "seasonYear",
  ...IST_TEAM_FIELDS,
  ...buildGameHeaders(),
] as const;

export type ISTStandingsRow = RowFromHeaders<typeof IST_STANDINGS_HEADERS>;

export function normalizeISTStandings(
  response: ISTStandingsResponse,
): ISTStandingsRow[] {
  const rows: ISTStandingsRow[] = [];

  for (const team of response.teams) {
    const record = {} as ISTStandingsRow;
    record.leagueId = response.leagueId;
    record.seasonYear = response.seasonYear;

    for (const field of IST_TEAM_FIELDS) {
      record[field] = (team[field] ?? null) as StatsResultSetValue;
    }

    const gamesByNumber = new Map<number, ISTStandingsGame>();
    for (const game of team.games ?? []) {
      if (typeof game.gameNumber === "number") {
        gamesByNumber.set(game.gameNumber, game);
      }
    }

    for (let i = 1; i <= IST_GAME_COUNT; i += 1) {
      const game = gamesByNumber.get(i);
      for (const field of IST_GAME_FIELDS) {
        const key = `${field}${i}` as keyof ISTStandingsRow;
        record[key] = (game?.[field] ?? null) as StatsResultSetValue;
      }
    }

    rows.push(record);
  }

  return rows;
}

function buildGameHeaders(): string[] {
  const headers: string[] = [];
  for (let i = 1; i <= IST_GAME_COUNT; i += 1) {
    for (const field of IST_GAME_FIELDS) {
      headers.push(`${field}${i}`);
    }
  }
  return headers;
}
