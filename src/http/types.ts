export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface HttpRequestOptions {
  baseUrl: string;
  endpoint: string;
  params?: QueryParams;
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}
