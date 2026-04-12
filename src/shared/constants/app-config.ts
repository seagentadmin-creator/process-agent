export const APP_CONFIG = {
  name: 'Process Agent',
  get version(): string {
    try { return chrome.runtime.getManifest().version; } catch { return '1.0.0'; }
  },
  defaults: {
    pollingIntervalMs: 10 * 60 * 1000,
    cacheDefaultTtlMs: 10 * 60 * 1000,
    maxEnvironmentSets: 5,
    requestThrottleMs: 100,
    maxConcurrentRequests: 5,
  },
} as const;
