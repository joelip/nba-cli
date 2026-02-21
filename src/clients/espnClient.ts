import type { ESPNScoreboardResponse, ESPNStandingsResponse } from "../models/espnScoreboard";

const ESPN_BASE = "https://site.api.espn.com/apis";

export class ESPNClient {
  private timeoutMs: number;

  constructor(opts?: { timeoutMs?: number }) {
    this.timeoutMs = opts?.timeoutMs ?? 15_000;
  }

  async scoreboard(dateISO: string): Promise<ESPNScoreboardResponse> {
    // dateISO is YYYY-MM-DD; ESPN wants YYYYMMDD
    const dateParam = dateISO.replace(/-/g, "");
    const url = `${ESPN_BASE}/site/v2/sports/basketball/nba/scoreboard?dates=${dateParam}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(this.timeoutMs) });
    if (!response.ok) {
      throw new Error(`ESPN scoreboard request failed: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<ESPNScoreboardResponse>;
  }

  async standings(): Promise<ESPNStandingsResponse> {
    const url = `${ESPN_BASE}/v2/sports/basketball/nba/standings`;
    const response = await fetch(url, { signal: AbortSignal.timeout(this.timeoutMs) });
    if (!response.ok) {
      throw new Error(`ESPN standings request failed: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<ESPNStandingsResponse>;
  }
}
