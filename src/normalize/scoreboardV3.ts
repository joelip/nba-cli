import type {
  Broadcaster,
  PlayerLeader,
  ScoreboardV3Response,
  TeamBoxScore,
} from "../models/scoreboardV3";

export interface NormalizedTeam {
  id: number;
  city: string;
  name: string;
  tricode: string;
  wins: number;
  losses: number;
  score: number;
}

export interface NormalizedGame {
  gameId: string;
  gameCode: string;
  status: {
    code: number;
    text: string;
    period: number;
    clock: string;
  };
  time: {
    utc: string;
    et: string;
  };
  home: NormalizedTeam;
  away: NormalizedTeam;
  leaders?: {
    home?: PlayerLeader;
    away?: PlayerLeader;
  };
  broadcasters?: Record<string, Broadcaster[]>;
}

export interface GameLeaderRow {
  gameId: string;
  leaderType: "home" | "away";
  personId: number;
  name: string;
  teamTricode: string;
  points: number;
  rebounds: number;
  assists: number;
}

export interface BroadcasterRow {
  gameId: string;
  broadcasterType: string;
  broadcasterId: number;
  broadcastDisplay: string;
  broadcasterTeamId?: number | null;
  broadcasterDescription?: string | null;
}

function toTeam(team: TeamBoxScore): NormalizedTeam {
  return {
    id: team.teamId,
    city: team.teamCity,
    name: team.teamName,
    tricode: team.teamTricode,
    wins: team.wins,
    losses: team.losses,
    score: team.score,
  };
}

export function normalizeScoreboardV3(response: ScoreboardV3Response): NormalizedGame[] {
  return response.scoreboard.games.map((game) => ({
    gameId: game.gameId,
    gameCode: game.gameCode,
    status: {
      code: game.gameStatus,
      text: game.gameStatusText,
      period: game.period,
      clock: game.gameClock,
    },
    time: {
      utc: game.gameTimeUTC,
      et: game.gameEt,
    },
    home: toTeam(game.homeTeam),
    away: toTeam(game.awayTeam),
    leaders: game.gameLeaders
      ? {
          home: game.gameLeaders.homeLeaders,
          away: game.gameLeaders.awayLeaders,
        }
      : undefined,
    broadcasters: game.broadcasters ?? undefined,
  }));
}

export function extractGameLeaders(response: ScoreboardV3Response): GameLeaderRow[] {
  const rows: GameLeaderRow[] = [];

  for (const game of response.scoreboard.games) {
    const leaders = game.gameLeaders;
    if (!leaders) {
      continue;
    }

    rows.push({
      gameId: game.gameId,
      leaderType: "home",
      personId: leaders.homeLeaders.personId,
      name: leaders.homeLeaders.name,
      teamTricode: leaders.homeLeaders.teamTricode,
      points: leaders.homeLeaders.points,
      rebounds: leaders.homeLeaders.rebounds,
      assists: leaders.homeLeaders.assists,
    });

    rows.push({
      gameId: game.gameId,
      leaderType: "away",
      personId: leaders.awayLeaders.personId,
      name: leaders.awayLeaders.name,
      teamTricode: leaders.awayLeaders.teamTricode,
      points: leaders.awayLeaders.points,
      rebounds: leaders.awayLeaders.rebounds,
      assists: leaders.awayLeaders.assists,
    });
  }

  return rows;
}

export function extractBroadcasters(response: ScoreboardV3Response): BroadcasterRow[] {
  const rows: BroadcasterRow[] = [];

  for (const game of response.scoreboard.games) {
    const broadcasters = game.broadcasters;
    if (!broadcasters) {
      continue;
    }

    for (const [type, list] of Object.entries(broadcasters)) {
      for (const broadcaster of list) {
        rows.push({
          gameId: game.gameId,
          broadcasterType: type,
          broadcasterId: broadcaster.broadcasterId,
          broadcastDisplay: broadcaster.broadcastDisplay,
          broadcasterTeamId: broadcaster.broadcasterTeamId,
          broadcasterDescription: broadcaster.broadcasterDescription,
        });
      }
    }
  }

  return rows;
}
