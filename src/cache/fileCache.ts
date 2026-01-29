import { mkdir, rm } from "node:fs/promises";
import { dirname } from "node:path";
import { createHash } from "node:crypto";

export interface CacheStore {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, options?: { ttlMs?: number | null }): Promise<void>;
  delete(key: string): Promise<void>;
}

interface CacheEntry<T> {
  expiresAt: number | null;
  value: T;
}

export class FileCache implements CacheStore {
  private dir: string;

  constructor(dir = ".cache/nba-cli") {
    this.dir = dir;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const path = this.pathForKey(key);
    const file = Bun.file(path);
    if (!(await file.exists())) {
      return undefined;
    }

    const text = await file.text();
    const entry = JSON.parse(text) as CacheEntry<T>;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await this.delete(key);
      return undefined;
    }

    return entry.value;
  }

  async set<T>(key: string, value: T, options?: { ttlMs?: number | null }): Promise<void> {
    const path = this.pathForKey(key);
    await mkdir(dirname(path), { recursive: true });

    const ttlMs = options?.ttlMs ?? null;
    const entry: CacheEntry<T> = {
      expiresAt: ttlMs === null ? null : Date.now() + ttlMs,
      value,
    };

    await Bun.write(path, JSON.stringify(entry));
  }

  async delete(key: string): Promise<void> {
    const path = this.pathForKey(key);
    await rm(path, { force: true });
  }

  private pathForKey(key: string): string {
    const sanitized = key.replace(/[^a-zA-Z0-9._-]/g, "_");
    const needsSuffix = sanitized !== key || sanitized.length > 80;
    const suffix = needsSuffix ? `__${hashKey(key)}` : "";
    const truncated = sanitized.length > 120 ? sanitized.slice(0, 120) : sanitized;
    return `${this.dir}/${truncated}${suffix}.json`;
  }
}

function hashKey(key: string): string {
  return createHash("sha1").update(key).digest("hex").slice(0, 8);
}
