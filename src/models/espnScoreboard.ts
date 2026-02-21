/** Minimal types for ESPN NBA Scoreboard & Standings APIs. */

export interface ESPNScoreboardResponse {
  leagues: unknown[];
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
  date: string;
  competitors: ESPNCompetitor[];
  broadcasts: ESPNBroadcast[];
  notes: unknown[];
  status: ESPNStatus;
}

export interface ESPNCompetitor {
  id: string;
  homeAway: "home" | "away";
  team: ESPNTeam;
  score: string;
  records: ESPNRecord[];
  leaders?: ESPNLeaderCategory[];
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
  summary: string; // e.g. "32-24"
}

export interface ESPNLeaderCategory {
  name: string;
  displayName: string;
  abbreviation: string;
  leaders: ESPNLeaderEntry[];
}

export interface ESPNLeaderEntry {
  displayValue: string;
  value: number;
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
  market: string; // "national" | "home" | "away"
  names: string[];
}

export interface ESPNStatus {
  clock: number;
  displayClock: string;
  period: number;
  type: {
    id: string; // "1"=scheduled, "2"=in progress, "3"=final
    name: string;
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
  value: number;
  displayValue: string;
}
