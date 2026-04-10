import { AppError, Result } from '../../core/types';

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

export interface BaseClientConfig {
  baseUrl: string;
  pat: string;
  maxRetries?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
}

export class BaseClient {
  protected baseUrl: string;
  protected pat: string;
  protected maxRetries: number;
  protected retryDelayMs: number;
  protected timeoutMs: number;

  constructor(config: BaseClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.pat = config.pat;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 1000;
    this.timeoutMs = config.timeoutMs ?? 30000;
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.pat}`,
      'Content-Type': 'application/json',
    };
  }

  async request<T>(path: string, config: RequestConfig = {}): Promise<Result<T>> {
    const url = `${this.baseUrl}${path}`;
    const method = config.method ?? 'GET';
    const headers = { ...this.getAuthHeaders(), ...config.headers };

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), config.timeout ?? this.timeoutMs);

        const response = await fetch(url, {
          method,
          headers,
          body: config.body ? JSON.stringify(config.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (response.status === 401) {
          return { data: null, error: { code: '401', message: 'Authentication failed' }, success: false };
        }

        if (response.status === 403) {
          return { data: null, error: { code: '403', message: 'Permission denied' }, success: false };
        }

        if (response.status === 404) {
          return { data: null, error: { code: '404', message: 'Not found' }, success: false };
        }

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
          await this.delay(retryAfter * 1000);
          continue;
        }

        if (response.status >= 500 && attempt < this.maxRetries) {
          await this.delay(this.retryDelayMs * Math.pow(2, attempt - 1));
          continue;
        }

        if (!response.ok) {
          return { data: null, error: { code: String(response.status), message: response.statusText }, success: false };
        }

        if (response.status === 204) {
          return { data: null as any, error: null, success: true };
        }

        const data = await response.json() as T;
        return { data, error: null, success: true };

      } catch (err: any) {
        if (err.name === 'AbortError') {
          if (attempt < this.maxRetries) {
            await this.delay(this.retryDelayMs * Math.pow(2, attempt - 1));
            continue;
          }
          return { data: null, error: { code: 'TIMEOUT', message: 'Request timed out' }, success: false };
        }

        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelayMs * Math.pow(2, attempt - 1));
          continue;
        }

        return { data: null, error: { code: 'NETWORK', message: err.message || 'Network error' }, success: false };
      }
    }

    return { data: null, error: { code: 'MAX_RETRIES', message: 'Max retries exceeded' }, success: false };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
