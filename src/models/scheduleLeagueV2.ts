export interface ScheduleLeagueV2Response {
  meta: {
    version: number;
    request: string;
    time: string;
    code?: number;
  };
  leagueSchedule: {
    seasonYear: string;
    leagueId: string;
    gameDates: ScheduleGameDate[];
    weeks?: ScheduleWeek[];
  };
}

export interface ScheduleGameDate {
  gameDate: string;
  games: ScheduleGame[];
}

export interface ScheduleGame {
  gameId: string;
  gameCode: string;
  gameStatus: number;
  gameStatusText: string;
  gameSequence: number;
  gameDateEst: string;
  gameTimeEst: string;
  gameDateTimeEst: string;
  gameDateUTC: string;
  gameTimeUTC: string;
  gameDateTimeUTC: string;
  awayTeamTime: string;
  homeTeamTime: string;
  day: string;
  monthNum: number;
  weekNumber: number;
  weekName: string;
  ifNecessary: string;
  seriesGameNumber: string;
  gameLabel: string;
  gameSubLabel: string;
  seriesText: string;
  arenaName: string;
  arenaState: string;
  arenaCity: string;
  postponedStatus: string;
  branchLink: string;
  gameSubtype: string;
  isNeutral: boolean;
  broadcasters: ScheduleBroadcasters;
  homeTeam: ScheduleTeam;
  awayTeam: ScheduleTeam;
  pointsLeaders: SchedulePointsLeader[];
}

export interface ScheduleTeam {
  teamId: number;
  teamName: string;
  teamCity: string;
  teamTricode: string;
  teamSlug: string;
  wins: number;
  losses: number;
  score: number;
  seed: number | null;
}

export interface SchedulePointsLeader {
  personId: number;
  firstName: string;
  lastName: string;
  teamId: number;
  teamCity: string;
  teamName: string;
  teamTricode: string;
  points: number;
}

export interface ScheduleBroadcasters {
  nationalBroadcasters: ScheduleBroadcaster[];
  nationalRadioBroadcasters: ScheduleBroadcaster[];
  nationalOttBroadcasters: ScheduleBroadcaster[];
  homeTvBroadcasters: ScheduleBroadcaster[];
  homeRadioBroadcasters: ScheduleBroadcaster[];
  homeOttBroadcasters: ScheduleBroadcaster[];
  awayTvBroadcasters: ScheduleBroadcaster[];
  awayRadioBroadcasters: ScheduleBroadcaster[];
  awayOttBroadcasters: ScheduleBroadcaster[];
}

export interface ScheduleBroadcaster {
  broadcasterScope?: string;
  broadcasterMedia?: string;
  broadcasterId: number;
  broadcasterDisplay: string;
  broadcasterAbbreviation?: string;
  tapeDelayComments?: string;
  broadcasterVideoLink?: string;
  broadcasterDescription?: string;
  broadcasterTeamId?: number;
}

export interface ScheduleWeek {
  weekNumber: number;
  weekName: string;
  startDate: string;
  endDate: string;
}
