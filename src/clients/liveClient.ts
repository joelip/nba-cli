import {
  DEFAULT_LIVE_HEADERS,
  LIVE_BASE_URL,
  nbaFetchJson,
} from "../http/nbaHttp";
import type { LiveScoreboardResponse } from "../models/liveScoreboard";

export interface LiveClientOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

export class LiveClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private timeoutMs?: number;
  private retries?: number;
  private retryDelayMs?: number;

  constructor(options: LiveClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? LIVE_BASE_URL;
    this.headers = { ...DEFAULT_LIVE_HEADERS, ...(options.headers ?? {}) };
    this.timeoutMs = options.timeoutMs;
    this.retries = options.retries;
    this.retryDelayMs = options.retryDelayMs;
  }

  async todaysScoreboard(): Promise<LiveScoreboardResponse> {
    return this.request<LiveScoreboardResponse>(
      "scoreboard/todaysScoreboard_00.json",
      {},
    );
  }

  private async request<T>(endpoint: string, params: Record<string, string | number | null | undefined>): Promise<T> {
    return nbaFetchJson<T>({
      baseUrl: this.baseUrl,
      endpoint,
      params,
      headers: this.headers,
      timeoutMs: this.timeoutMs,
      retries: this.retries,
      retryDelayMs: this.retryDelayMs,
    });
  }
}
