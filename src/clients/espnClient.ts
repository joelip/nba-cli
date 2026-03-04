import type { ESPNScoreboardResponse, ESPNStandingsResponse } from "../models/espnScoreboard";

const ESPN_BASE_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

export class ESPNClient {
  private timeoutMs: number;

  constructor(opts?: { timeoutMs?: number }) {
    this.timeoutMs = opts?.timeoutMs ?? 15_000;
  }

  private async requestJson<T>(path: string): Promise<T> {
    const url = `${ESPN_BASE_URL}/${path.replace(/^\//, "")}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(this.timeoutMs) });
    if (!response.ok) {
      throw new Error(`ESPN request failed: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  async scoreboard(dateISO: string): Promise<ESPNScoreboardResponse> {
    const dateParam = dateISO.replace(/-/g, "");
    return this.requestJson<ESPNScoreboardResponse>(
      `scoreboard?dates=${dateParam}`,
    );
  }

  async standings(): Promise<ESPNStandingsResponse> {
    return this.requestJson<ESPNStandingsResponse>("standings");
  }
}
