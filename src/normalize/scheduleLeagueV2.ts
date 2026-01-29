import type {
  ScheduleBroadcaster,
  ScheduleGame,
  ScheduleLeagueV2Response,
  ScheduleTeam,
} from "../models/scheduleLeagueV2";

export interface FlatScheduleGame {
  gameDate: string;
  gameId: string;
  gameCode: string;
  statusText: string;
  home: ScheduleTeam;
  away: ScheduleTeam;
  broadcasters: Record<string, ScheduleBroadcaster[]>;
}

export interface ScheduleBroadcasterRow {
  gameId: string;
  gameDate: string;
  broadcasterType: string;
  broadcasterId: number;
  broadcasterDisplay: string;
  broadcasterTeamId?: number;
}

export function flattenScheduleGames(response: ScheduleLeagueV2Response): FlatScheduleGame[] {
  const games: FlatScheduleGame[] = [];

  for (const gameDate of response.leagueSchedule.gameDates) {
    for (const game of gameDate.games) {
      games.push({
        gameDate: gameDate.gameDate,
        gameId: game.gameId,
        gameCode: game.gameCode,
        statusText: game.gameStatusText,
        home: game.homeTeam,
        away: game.awayTeam,
        broadcasters: game.broadcasters,
      });
    }
  }

  return games;
}

export function extractScheduleBroadcasters(
  response: ScheduleLeagueV2Response,
): ScheduleBroadcasterRow[] {
  const rows: ScheduleBroadcasterRow[] = [];

  for (const gameDate of response.leagueSchedule.gameDates) {
    for (const game of gameDate.games) {
      rows.push(...mapBroadcasters(gameDate.gameDate, game));
    }
  }

  return rows;
}

function mapBroadcasters(gameDate: string, game: ScheduleGame): ScheduleBroadcasterRow[] {
  const rows: ScheduleBroadcasterRow[] = [];

  for (const [type, list] of Object.entries(game.broadcasters)) {
    for (const broadcaster of list) {
      rows.push({
        gameId: game.gameId,
        gameDate,
        broadcasterType: type,
        broadcasterId: broadcaster.broadcasterId,
        broadcasterDisplay: broadcaster.broadcasterDisplay,
        broadcasterTeamId: broadcaster.broadcasterTeamId,
      });
    }
  }

  return rows;
}
