export interface ISTStandingsResponse {
  leagueId: string;
  seasonYear: string;
  teams: ISTStandingsTeam[];
}

export interface ISTStandingsTeam {
  teamId?: number;
  teamCity?: string;
  teamName?: string;
  teamAbbreviation?: string;
  teamSlug?: string;
  conference?: string;
  istGroup?: string;
  clinchIndicator?: string;
  clinchedIstKnockout?: string | number | null;
  clinchedIstGroup?: string | number | null;
  clinchedIstWildcard?: string | number | null;
  istWildcardRank?: number | string | null;
  istGroupRank?: number | string | null;
  istKnockoutRank?: number | string | null;
  wins?: number | string | null;
  losses?: number | string | null;
  pct?: number | string | null;
  istGroupGb?: number | string | null;
  istWildcardGb?: number | string | null;
  diff?: number | string | null;
  pts?: number | string | null;
  oppPts?: number | string | null;
  games: ISTStandingsGame[];
}

export interface ISTStandingsGame {
  gameNumber: number;
  gameId?: string;
  opponentTeamAbbreviation?: string;
  location?: string;
  gameStatus?: number | string | null;
  gameStatusText?: string;
  outcome?: string;
}
