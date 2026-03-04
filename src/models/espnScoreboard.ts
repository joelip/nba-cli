/** Minimal types for ESPN NBA Scoreboard & Standings APIs. */

export interface ESPNScoreboardResponse {
  leagues?: unknown[];
  season: { type: number; year: number };
  day: { date: string };
  events: ESPNEvent[];
}

export interface ESPNEvent {
  id: string;
  uid: string;
  date: string; // ISO 8601
  name: string;
  shortName: string;
  competitions: ESPNCompetition[];
  status: ESPNStatus;
}

export interface ESPNCompetition {
  id: string;
  date?: string;
  competitors?: ESPNCompetitor[] | null;
  broadcasts?: ESPNBroadcast[] | null;
  notes?: unknown[] | null;
  status?: ESPNStatus | null;
}

export interface ESPNCompetitor {
  id: string;
  homeAway?: "home" | "away" | string;
  team: ESPNTeam;
  score: string | number | null;
  records: ESPNRecord[];
  leaders?: ESPNLeaderCategory[] | null;
}

export interface ESPNTeam {
  id: string;
  location: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
}

export interface ESPNRecord {
  name: string;
  type: string;
  /**
   * Win-loss summary from ESPN's standings object, for example "32-24".
   */
  summary: string;
}

export interface ESPNLeaderCategory {
  name: string;
  displayName: string;
  /**
   * Category abbreviation in ESPN payload, such as "PTS", "REB", "AST", etc.
   */
  abbreviation: string;
  leaders: ESPNLeaderEntry[];
}

export interface ESPNLeaderEntry {
  displayValue: string;
  value: number | string;
  athlete: ESPNAthlete;
}

export interface ESPNAthlete {
  id: string;
  fullName: string;
  displayName: string;
  shortName: string;
  jersey?: string;
  position?: { abbreviation: string };
  team?: { id: string };
}

export interface ESPNBroadcast {
  market?: string; // "national" | "home" | "away"
  type?: {
    shortName?: string;
    displayName?: string;
  };
  names?: string[] | null;
}

export interface ESPNStatus {
  clock: number;
  displayClock: string;
  period: number;
  type: {
    /**
     * ESPN status code id for game phase: "1" (scheduled), "2" (in progress), "3" (final).
     */
    id: string;
    name: string;
    /**
     * Broad state bucket for the status (for example: "pre", "in", "post", "halftime", "final").
     */
    state: string;
    completed: boolean;
    description: string;
    detail: string;
    shortDetail: string;
  };
}

// Standings types
export interface ESPNStandingsResponse {
  uid: string;
  id: string;
  name: string;
  abbreviation: string;
  children: ESPNConference[];
}

export interface ESPNConference {
  uid: string;
  id: string;
  name: string;
  abbreviation: string;
  standings: {
    entries: ESPNStandingsEntry[];
  };
}

export interface ESPNStandingsEntry {
  team: ESPNTeam;
  stats: ESPNStat[];
}

export interface ESPNStat {
  name: string;
  displayName: string;
  abbreviation: string;
  value: number | string;
  displayValue: string;
}
