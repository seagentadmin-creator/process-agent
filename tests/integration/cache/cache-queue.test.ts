import { RequestQueue } from '../../../src/core/api/request-queue';
import { CacheManager, StorageAdapter } from '../../../src/core/cache/cache-manager';

describe('RequestQueue', () => {
  test('RQ-01: 순차 실행', async () => {
    const queue = new RequestQueue(5, 10);
    const order: number[] = [];
    await Promise.all([
      queue.enqueue(async () => { order.push(1); return 1; }),
      queue.enqueue(async () => { order.push(2); return 2; }),
      queue.enqueue(async () => { order.push(3); return 3; }),
    ]);
    expect(order).toEqual([1, 2, 3]);
  });

  test('RQ-02: 결과 반환', async () => {
    const queue = new RequestQueue(5, 10);
    expect(await queue.enqueue(async () => 42)).toBe(42);
  });

  test('RQ-03: 에러 전파', async () => {
    const queue = new RequestQueue(5, 10);
    await expect(queue.enqueue(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
  });

  test('RQ-04: pending/running', () => {
    const q = new RequestQueue(1, 10);
    expect(q.pending).toBe(0);
    expect(q.running).toBe(0);
  });

  test('RQ-05: clear', () => {
    const q = new RequestQueue(1, 10);
    q.clear();
    expect(q.pending).toBe(0);
  });
});

describe('CacheManager', () => {
  let cache: CacheManager;
  let store: Record<string, any>;

  function createMockStorage(): StorageAdapter {
    store = {};
    return {
      get: (key: string) => Promise.resolve({ [key]: store[key] }),
      set: (items: Record<string, any>) => { Object.assign(store, items); return Promise.resolve(); },
      remove: (key: string) => { delete store[key]; return Promise.resolve(); },
      getBytesInUse: () => Promise.resolve(2048),
    };
  }

  beforeEach(() => {
    cache = new CacheManager({ defaultTtlMs: 60000, storage: createMockStorage() });
  });

  test('CM-01: L1 히트', () => {
    cache.setL1('k1', { x: 1 }, 'v1');
    expect(cache.getL1('k1')).toEqual({ x: 1 });
  });

  test('CM-02: L1 미스', () => {
    expect(cache.getL1('nope')).toBeNull();
  });

  test('CM-03: L1 만료', (done) => {
    cache.setL1('k2', 'old', 'v1', 1);
    setTimeout(() => { expect(cache.getL1('k2')).toBeNull(); done(); }, 10);
  });

  test('CM-04: L2 저장+조회', async () => {
    await cache.setL2('k3', 'val', 'v1');
    expect(store['k3']).toBeDefined();
    expect(store['k3'].data).toBe('val');
    const result = await cache.getL2('k3');
    expect(result).toBe('val');
  });

  test('CM-05: get L1→L2', async () => {
    await cache.setL2('k4', 'from-l2', 'v1');
    cache.clearL1();
    const result = await cache.get('k4');
    expect(result).toBe('from-l2');
    expect(cache.getL1('k4')).toBe('from-l2');
  });

  test('CM-06: set L1+L2', async () => {
    await cache.set('k5', 'both', 'v1');
    expect(cache.getL1('k5')).toBe('both');
    expect(store['k5'].data).toBe('both');
  });

  test('CM-07: invalidate', async () => {
    await cache.set('k6', 'bye', 'v1');
    await cache.invalidate('k6');
    expect(cache.getL1('k6')).toBeNull();
    expect(store['k6']).toBeUndefined();
  });

  test('CM-08: clearL1 세트 전환', () => {
    cache.setL1('a', 1, 'v1');
    cache.setL1('b', 2, 'v1');
    expect(cache.l1Size).toBe(2);
    cache.clearL1();
    expect(cache.l1Size).toBe(0);
  });

  test('CM-09: selectiveUpdate', async () => {
    const fetcher = jest.fn((key: string) => Promise.resolve(`data-${key}`));
    const results = await cache.selectiveUpdate(['A-001', 'A-004'], fetcher, 'v1.2');
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(results.get('A-001')).toBe('data-A-001');
    expect(cache.getL1('A-001')).toBe('data-A-001');
  });

  test('CM-10: L2 용량', async () => {
    expect(await cache.getL2UsageBytes()).toBe(2048);
  });
});
