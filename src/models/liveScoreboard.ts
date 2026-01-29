export interface LiveScoreboardResponse {
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
    games: LiveScoreboardGame[];
  };
}

export interface LiveScoreboardGame {
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
  seriesText: string;
  homeTeam: LiveTeamBox;
  awayTeam: LiveTeamBox;
  gameLeaders?: LiveGameLeaders;
  pbOdds?: LivePbOdds;
}

export interface LiveTeamBox {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  wins: number;
  losses: number;
  score: number;
  inBonus: boolean | null;
  timeoutsRemaining: number;
  periods: LiveTeamPeriod[];
}

export interface LiveTeamPeriod {
  period: number;
  periodType: string;
  score: number;
}

export interface LiveGameLeaders {
  homeLeaders: LivePlayerLeader;
  awayLeaders: LivePlayerLeader;
}

export interface LivePlayerLeader {
  personId: number;
  name: string;
  jerseyNum: string;
  position: string;
  teamTricode: string;
  playerSlug?: string | null;
  points: number;
  rebounds: number;
  assists: number;
}

export interface LivePbOdds {
  team: string | null;
  odds: number;
  suspended: number;
}
