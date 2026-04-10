export interface CacheEntry<T> {
  data: T;
  version: string;
  timestamp: number;
  ttlMs?: number;
}

export interface StorageAdapter {
  get(key: string): Promise<any>;
  set(items: Record<string, any>): Promise<void>;
  remove(key: string): Promise<void>;
  getBytesInUse(): Promise<number>;
}

export interface CacheConfig {
  defaultTtlMs?: number;
  storage: StorageAdapter;
}

export class CacheManager {
  private l1: Map<string, CacheEntry<any>> = new Map();
  private storage: StorageAdapter;
  private defaultTtlMs: number;

  constructor(config: CacheConfig) {
    this.defaultTtlMs = config.defaultTtlMs ?? 10 * 60 * 1000;
    this.storage = config.storage;
  }

  getL1<T>(key: string): T | null {
    const entry = this.l1.get(key);
    if (!entry) return null;
    if (this.isExpired(entry)) { this.l1.delete(key); return null; }
    return entry.data as T;
  }

  setL1<T>(key: string, data: T, version: string, ttlMs?: number): void {
    this.l1.set(key, { data, version, timestamp: Date.now(), ttlMs: ttlMs ?? this.defaultTtlMs });
  }

  async getL2<T>(key: string): Promise<T | null> {
    try {
      const result = await this.storage.get(key);
      const entry = result[key] as CacheEntry<T> | undefined;
      if (!entry) return null;
      if (this.isExpired(entry)) { await this.storage.remove(key); return null; }
      this.setL1(key, entry.data, entry.version, entry.ttlMs);
      return entry.data;
    } catch { return null; }
  }

  async setL2<T>(key: string, data: T, version: string, ttlMs?: number): Promise<void> {
    const entry: CacheEntry<T> = { data, version, timestamp: Date.now(), ttlMs: ttlMs ?? this.defaultTtlMs };
    await this.storage.set({ [key]: entry });
    this.setL1(key, data, version, ttlMs);
  }

  async get<T>(key: string): Promise<T | null> {
    const l1 = this.getL1<T>(key);
    if (l1 !== null) return l1;
    return this.getL2<T>(key);
  }

  async set<T>(key: string, data: T, version: string, ttlMs?: number): Promise<void> {
    this.setL1(key, data, version, ttlMs);
    await this.setL2(key, data, version, ttlMs);
  }

  async invalidate(key: string): Promise<void> {
    this.l1.delete(key);
    await this.storage.remove(key);
  }

  async selectiveUpdate<T>(
    changedKeys: string[], fetcher: (key: string) => Promise<T>, version: string,
  ): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    await Promise.all(changedKeys.map(async (key) => {
      const data = await fetcher(key);
      await this.set(key, data, version);
      results.set(key, data);
    }));
    return results;
  }

  clearL1(): void { this.l1.clear(); }
  async getL2UsageBytes(): Promise<number> { try { return await this.storage.getBytesInUse(); } catch { return 0; } }
  get l1Size(): number { return this.l1.size; }

  private isExpired(entry: CacheEntry<any>): boolean {
    if (!entry.ttlMs) return false;
    return Date.now() - entry.timestamp > entry.ttlMs;
  }
}
