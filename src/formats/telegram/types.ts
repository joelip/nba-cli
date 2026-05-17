import type { LeagueStandingsV3Response } from "../../models/leagueStandingsV3";
import type { ScoreboardV3Response } from "../../models/scoreboardV3";

export interface DailyUpdateInput {
  date: {
    todayISO: string;
    yesterdayISO: string;
    timeZone?: string;
  };
  focusTeam: {
    name: string;
    city?: string;
    slug?: string;
  };
  raw: {
    scoreboardYesterday: ScoreboardV3Response;
    scoreboardToday: ScoreboardV3Response;
    standings?: LeagueStandingsV3Response;
  };
}

export interface AfternoonUpdateInput {
  todayISO: string;
  timeZone?: string;
  scoreboardToday: ScoreboardV3Response;
}

export interface DailyUpdatePayload {
  headerDate: string;
  yesterdayDate: string;
  lastNightResults: ResultGamePayload[];
  tonightGames: TonightGamePayload[];
  lotteryWatch?: LotteryWatchPayload;
}

export interface ResultGamePayload {
  winner: ResultTeamPayload;
  loser: ResultTeamPayload;
}

export interface ResultTeamPayload {
  name: string;
  tricode: string;
  score: string;
  leaderLine: string;
}

export interface TonightGamePayload {
  timePacific: string;
  away: string;
  home: string;
  broadcast: string;
}

export interface LotteryWatchPayload {
  title: string;
  lines: LotteryWatchLine[];
}

export interface LotteryWatchLine {
  text: string;
  highlight?: boolean;
}
