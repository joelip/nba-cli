import type {
  Broadcaster,
  PlayerLeader,
  ScoreboardV3Game,
  TeamBoxScore,
} from "../../models/scoreboardV3";
import type { StatsResultSetValue } from "../../models/statsResultSets";

export type StandingsRow = Record<string, StatsResultSetValue>;

export const DEFAULT_TIME_ZONE = "America/Los_Angeles";

export function escapeTelegramHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function formatTeamName(team: TeamBoxScore): string {
  return `${team.teamCity} ${team.teamName}`;
}

export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return "TBD";
  }
  return String(score);
}

export function pickWinnersAndLosers(game: ScoreboardV3Game): {
  winner: TeamBoxScore;
  loser: TeamBoxScore;
  winnerLeader?: PlayerLeader;
  loserLeader?: PlayerLeader;
} {
  const homeScore = game.homeTeam.score;
  const awayScore = game.awayTeam.score;

  const homeWins = homeScore >= awayScore;
  const winner = homeWins ? game.homeTeam : game.awayTeam;
  const loser = homeWins ? game.awayTeam : game.homeTeam;

  const leaders = game.gameLeaders;
  const winnerLeader = homeWins ? leaders?.homeLeaders : leaders?.awayLeaders;
  const loserLeader = homeWins ? leaders?.awayLeaders : leaders?.homeLeaders;

  return { winner, loser, winnerLeader, loserLeader };
}

export function formatLeaderLine(tricode: string, leader?: PlayerLeader): string {
  if (!leader) {
    return `${tricode}: No leader data`;
  }

  return `${tricode}: ${leader.name} ${leader.points} pts, ${leader.rebounds} reb, ${leader.assists} ast`;
}

export function formatPacificTime(
  game: ScoreboardV3Game,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  const iso = game.gameTimeUTC || game.gameEt;
  if (!iso) {
    return "TBD";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  }).format(date);

  return `${time} PT`;
}

export function formatBroadcast(game: ScoreboardV3Game): string {
  if (!game.broadcasters) {
    return "No info provided";
  }

  const national = game.broadcasters.nationalBroadcasters ?? [];
  const display = joinBroadcasts(national);
  if (display) {
    return display;
  }

  return "NBA League Pass";
}

export function joinBroadcasts(list: Broadcaster[]): string {
  const values = list
    .map((broadcaster) => broadcaster.broadcastDisplay)
    .filter((value): value is string => Boolean(value));

  if (values.length === 0) {
    return "";
  }

  return Array.from(new Set(values)).join(" / ");
}

export function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

export function parseRecord(value: unknown): { wins: number; losses: number } | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const match = value.match(/^(\d+)-(\d+)$/);
  if (!match) {
    return undefined;
  }
  return { wins: Number(match[1]), losses: Number(match[2]) };
}

export function getLotteryRanking(rows: StandingsRow[]): StandingsRow[] {
  return [...rows].sort((a, b) => {
    const winPctA = parseNumber(a["WinPCT"]) ?? 1;
    const winPctB = parseNumber(b["WinPCT"]) ?? 1;
    if (winPctA !== winPctB) {
      return winPctA - winPctB;
    }
    const winsA = parseNumber(a["WINS"]) ?? 0;
    const winsB = parseNumber(b["WINS"]) ?? 0;
    return winsA - winsB;
  });
}

export function formatStandingsTeamName(row: StandingsRow): string {
  const city = row["TeamCity"] ? String(row["TeamCity"]) : "";
  const name = row["TeamName"] ? String(row["TeamName"]) : "";
  return `${city} ${name}`.trim();
}

export function formatRecord(row: StandingsRow): string | undefined {
  const wins = parseNumber(row["WINS"]);
  const losses = parseNumber(row["LOSSES"]);
  if (wins !== undefined && losses !== undefined) {
    return `${wins}-${losses}`;
  }

  const record = parseRecord(row["Record"]);
  if (record) {
    return `${record.wins}-${record.losses}`;
  }

  return undefined;
}

export function isFocusTeam(row: StandingsRow, focus: { name: string; city?: string; slug?: string }): boolean {
  const slug = row["TeamSlug"] ? String(row["TeamSlug"]).toLowerCase() : "";
  const name = row["TeamName"] ? String(row["TeamName"]).toLowerCase() : "";
  const city = row["TeamCity"] ? String(row["TeamCity"]).toLowerCase() : "";

  if (focus.slug && slug === focus.slug.toLowerCase()) {
    return true;
  }

  const focusName = focus.name.toLowerCase();
  const focusCity = focus.city?.toLowerCase();

  if (focusCity && name === focusName && city === focusCity) {
    return true;
  }

  return name === focusName;
}
