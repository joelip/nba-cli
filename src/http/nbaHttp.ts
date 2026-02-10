import { NBAHttpError } from "./errors";
import type { HttpRequestOptions, QueryParams } from "./types";

export const STATS_BASE_URL = "https://stats.nba.com/stats";
export const LIVE_BASE_URL = "https://cdn.nba.com/static/json/liveData";

export const DEFAULT_STATS_HEADERS: Record<string, string> = {
  Host: "stats.nba.com",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.5",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
  Referer: "https://stats.nba.com/",
  Pragma: "no-cache",
  "Cache-Control": "no-cache",
  "Sec-Ch-Ua": '"Chromium";v="140", "Google Chrome";v="140", "Not;A=Brand";v="24"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Fetch-Dest": "empty",
};

export const DEFAULT_LIVE_HEADERS: Record<string, string> = {
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "max-age=0",
  Connection: "keep-alive",
  Host: "cdn.nba.com",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
};

export const DEFAULT_TIMEOUT_MS = 30_000;
const CURL_STATUS_MARKER = "__NBA_CLI_HTTP_STATUS__:";

export function buildUrl(baseUrl: string, endpoint: string, params?: QueryParams): string {
  const trimmedBase = baseUrl.replace(/\/$/, "");
  const trimmedEndpoint = endpoint.replace(/^\//, "");
  const url = new URL(`${trimmedBase}/${trimmedEndpoint}`);

  if (params) {
    const entries = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .sort(([a], [b]) => a.localeCompare(b));

    const searchParams = new URLSearchParams();
    for (const [key, value] of entries) {
      searchParams.append(key, String(value));
    }
    const query = searchParams.toString();
    if (query) {
      url.search = query;
    }
  }

  return url.toString();
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  return parseJsonText<T>(text, response.status, response.url);
}

function parseJsonText<T>(text: string, status: number | undefined, url: string): T {
  if (!text) {
    throw new NBAHttpError("Empty response body", {
      status,
      url,
    });
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new NBAHttpError("Invalid JSON response", {
      status,
      url,
      body: text,
    });
  }
}

interface CurlResult {
  ok: boolean;
  body: string;
  status?: number;
  error?: string;
}

async function fetchViaCurl(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<CurlResult> {
  const timeoutSeconds = Math.max(1, Math.ceil(timeoutMs / 1000));
  const args = [
    "--silent",
    "--show-error",
    "--compressed",
    "--location",
    "--http1.1",
    "--max-time",
    String(timeoutSeconds),
    "--connect-timeout",
    String(timeoutSeconds),
    "--write-out",
    `\n${CURL_STATUS_MARKER}%{http_code}`,
  ];

  for (const [key, value] of Object.entries(headers)) {
    args.push("-H", `${key}: ${value}`);
  }
  args.push(url);

  let process: Bun.Subprocess<"pipe", "pipe", "ignore">;
  try {
    process = Bun.spawn({
      cmd: ["curl", ...args],
      stdout: "pipe",
      stderr: "pipe",
      stdin: "ignore",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to spawn curl";
    return { ok: false, body: "", error: message };
  }

  const [stdout, stderr, exitCode] = await Promise.all([
    process.stdout ? new Response(process.stdout).text() : Promise.resolve(""),
    process.stderr ? new Response(process.stderr).text() : Promise.resolve(""),
    process.exited,
  ]);

  if (exitCode !== 0) {
    return {
      ok: false,
      body: "",
      error: stderr.trim() || `curl exited with code ${exitCode}`,
    };
  }

  const marker = `\n${CURL_STATUS_MARKER}`;
  const markerIndex = stdout.lastIndexOf(marker);
  if (markerIndex === -1) {
    return { ok: false, body: stdout, error: "curl output missing status marker" };
  }

  const body = stdout.slice(0, markerIndex);
  const statusText = stdout.slice(markerIndex + marker.length).trim();
  const status = Number.parseInt(statusText, 10);

  if (!Number.isFinite(status)) {
    return { ok: false, body, error: `curl returned invalid status: ${statusText}` };
  }

  return { ok: status >= 200 && status < 300, body, status };
}

export async function nbaFetchJson<T>(options: HttpRequestOptions): Promise<T> {
  const {
    baseUrl,
    endpoint,
    params,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = 0,
    retryDelayMs = 250,
  } = options;

  const url = buildUrl(baseUrl, endpoint, params);
  const requestHeaders = headers ?? {};

  let attempt = 0;
  while (true) {
    const signal = AbortSignal.timeout(timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: requestHeaders,
        signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new NBAHttpError(`Request failed with status ${response.status}`, {
          status: response.status,
          url: response.url,
          body,
        });
      }

      return await parseJsonResponse<T>(response);
    } catch (error) {
      if (attempt < retries) {
        attempt += 1;
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        continue;
      }
      if (error instanceof NBAHttpError) {
        throw error;
      }

      const curlResult = await fetchViaCurl(url, requestHeaders, timeoutMs);
      if (curlResult.ok) {
        return parseJsonText<T>(curlResult.body, curlResult.status, url);
      }
      if (curlResult.status !== undefined) {
        throw new NBAHttpError(`Request failed with status ${curlResult.status}`, {
          status: curlResult.status,
          url,
          body: curlResult.body,
        });
      }

      const errorMessage =
        error instanceof Error ? error.message : "Unknown fetch error";
      const curlErrorMessage = curlResult.error
        ? `; curl fallback failed: ${curlResult.error}`
        : "";
      throw new NBAHttpError(`Request failed: ${errorMessage}${curlErrorMessage}`, {
        url,
      });
    } finally {
      // AbortSignal.timeout handles cleanup internally.
    }
  }
}
