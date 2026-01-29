import { FileCache, type CacheStore } from "../cache/fileCache";
import {
  DEFAULT_STATS_HEADERS,
  STATS_BASE_URL,
  nbaFetchJson,
} from "../http/nbaHttp";
import type { ScoreboardV3Response } from "../models/scoreboardV3";
import type { ScheduleLeagueV2Response } from "../models/scheduleLeagueV2";

export interface StatsClientOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  cache?: CacheStore | null;
  cacheDir?: string;
  scheduleCacheTtlMs?: number | null;
}

export interface ScheduleLeagueV2Params {
  season?: string;
  leagueId?: string;
  useCache?: boolean;
  cacheTtlMs?: number | null;
}

export class StatsClient {
  private baseUrl: string;
  private headers: Record<string, string>;
  private timeoutMs?: number;
  private retries?: number;
  private retryDelayMs?: number;
  private cache: CacheStore | null;
  private scheduleCacheTtlMs: number | null;

  constructor(options: StatsClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? STATS_BASE_URL;
    this.headers = { ...DEFAULT_STATS_HEADERS, ...(options.headers ?? {}) };
    this.timeoutMs = options.timeoutMs;
    this.retries = options.retries;
    this.retryDelayMs = options.retryDelayMs;
    this.cache = options.cache === undefined ? new FileCache(options.cacheDir) : options.cache;
    this.scheduleCacheTtlMs = options.scheduleCacheTtlMs ?? 24 * 60 * 60 * 1000;
  }

  async scoreboardV3(gameDate: string, leagueId = "00"): Promise<ScoreboardV3Response> {
    return this.request<ScoreboardV3Response>("scoreboardv3", {
      GameDate: gameDate,
      LeagueID: leagueId,
    });
  }

  async scheduleLeagueV2(params: ScheduleLeagueV2Params = {}): Promise<ScheduleLeagueV2Response> {
    const {
      season,
      leagueId = "00",
      useCache = true,
      cacheTtlMs,
    } = params;

    const cacheKey = `scheduleleaguev2_${season ?? "default"}_${leagueId}`;
    if (useCache && this.cache) {
      const cached = await this.cache.get<ScheduleLeagueV2Response>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const response = await this.request<ScheduleLeagueV2Response>("scheduleleaguev2", {
      Season: season,
      LeagueID: leagueId,
    });

    if (useCache && this.cache) {
      await this.cache.set(cacheKey, response, {
        ttlMs: cacheTtlMs ?? this.scheduleCacheTtlMs,
      });
    }

    return response;
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
