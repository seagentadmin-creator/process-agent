interface QueueItem {
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export class RequestQueue {
  private queue: QueueItem[] = [];
  private active = 0;
  private maxConcurrent: number;
  private intervalMs: number;
  private lastRequestTime = 0;

  constructor(maxConcurrent = 5, intervalMs = 100) {
    this.maxConcurrent = maxConcurrent;
    this.intervalMs = intervalMs;
  }

  async enqueue<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ execute, resolve, reject });
      this.processNext();
    });
  }

  private async processNext(): Promise<void> {
    if (this.active >= this.maxConcurrent || this.queue.length === 0) return;

    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.intervalMs) {
      setTimeout(() => this.processNext(), this.intervalMs - elapsed);
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.active++;
    this.lastRequestTime = Date.now();

    try {
      const result = await item.execute();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    } finally {
      this.active--;
      if (this.queue.length > 0) {
        setTimeout(() => this.processNext(), this.intervalMs);
      }
    }
  }

  get pending(): number { return this.queue.length; }
  get running(): number { return this.active; }
  clear(): void { this.queue = []; }
}
