export const APP_CONFIG = {
  name: 'Process Agent',
  shortName: 'PA',
  version: '1.0',
  description: 'AI-powered Process Agent for Jira Task Management',
  github: 'process-agent',
  releasePrefix: 'process-agent',
  defaults: {
    slmProjectPrefix: 'SLM',
    slmStructurePrefix: '[RFC',
    maxEnvironmentSets: 5,
    pollingIntervalMs: 10 * 60 * 1000,
    cacheInactiveDays: 7,
    maxLocalSnapshots: 50,
    requestThrottleMs: 100,
    maxConcurrentRequests: 5,
    dragHoldMs: 300,
    undoTimeoutMs: 5000,
    debounceMs: 300,
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
