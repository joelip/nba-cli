export interface ScoreboardV3Response {
  meta: {
    version: number;
    request: string;
    time: string;
    code?: number;
  };
  scoreboard: {
    gameDate: string;
    leagueId: string;
    leagueName: string;
    games: ScoreboardV3Game[];
  };
}

export interface ScoreboardV3Game {
  gameId: string;
  gameCode: string;
  gameStatus: number;
  gameStatusText: string;
  period: number;
  gameClock: string;
  gameTimeUTC: string;
  gameEt: string;
  regulationPeriods: number;
  seriesGameNumber: string;
  gameLabel: string;
  gameSubLabel: string;
  seriesText: string;
  ifNecessary: boolean;
  seriesConference: string;
  poRoundDesc: string;
  gameSubtype: string;
  isNeutral: boolean;
  gameLeaders?: TeamLeaders;
  teamLeaders?: TeamLeaders & { seasonLeadersFlag?: number };
  broadcasters?: Broadcasters;
  homeTeam: TeamBoxScore;
  awayTeam: TeamBoxScore;
}

export interface TeamBoxScore {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  teamSlug: string;
  wins: number;
  losses: number;
  score: number;
  seed: number;
  inBonus: boolean | null;
  timeoutsRemaining: number;
  periods: TeamPeriodScore[];
}

export interface TeamPeriodScore {
  period: number;
  periodType: string;
  score: number;
}

export interface TeamLeaders {
  homeLeaders: PlayerLeader;
  awayLeaders: PlayerLeader;
}

export interface PlayerLeader {
  personId: number;
  name: string;
  playerSlug?: string | null;
  jerseyNum?: string;
  position?: string;
  teamTricode: string;
  points: number;
  rebounds: number;
  assists: number;
}

export interface Broadcasters {
  nationalBroadcasters: Broadcaster[];
  nationalRadioBroadcasters: Broadcaster[];
  nationalOttBroadcasters: Broadcaster[];
  homeTvBroadcasters: Broadcaster[];
  homeRadioBroadcasters: Broadcaster[];
  homeOttBroadcasters: Broadcaster[];
  awayTvBroadcasters: Broadcaster[];
  awayRadioBroadcasters: Broadcaster[];
  awayOttBroadcasters: Broadcaster[];
}

export interface Broadcaster {
  broadcasterId: number;
  broadcastDisplay: string;
  broadcasterTeamId?: number | null;
  broadcasterDescription?: string | null;
}
