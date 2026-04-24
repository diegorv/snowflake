import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadFramework } from './loader.js';
import { clearRegistry, getFramework } from './registry.js';
import { buildFramework } from '../domain/__fixtures__/framework.js';
import { FrameworkValidationError } from '../domain/frameworkSchema.js';

afterEach(() => {
  clearRegistry();
});

function makeFetch(payload: unknown, ok = true): typeof fetch {
  return vi.fn(async () => ({
    ok,
    status: ok ? 200 : 500,
    json: async () => payload
  })) as unknown as typeof fetch;
}

describe('loadFramework', () => {
  const entry = { id: 'test', label: 'Test', path: '/frameworks/test.json' };

  it('fetches, validates, and registers the framework', async () => {
    const f = buildFramework();
    const fetchImpl = makeFetch(f);
    const result = await loadFramework(entry, fetchImpl);
    expect(result.id).toBe('test');
    expect(getFramework('test')).toBe(result);
  });

  it('caches by id and only calls fetch once', async () => {
    const f = buildFramework();
    const fetchImpl = makeFetch(f);
    await loadFramework(entry, fetchImpl);
    await loadFramework(entry, fetchImpl);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('throws FrameworkValidationError on bad JSON', async () => {
    const bad = buildFramework();
    (bad as unknown as { tracks: unknown[] }).tracks = [];
    const fetchImpl = makeFetch(bad);
    await expect(loadFramework(entry, fetchImpl)).rejects.toBeInstanceOf(
      FrameworkValidationError
    );
  });

  it('throws when manifest id does not match JSON id', async () => {
    const f = buildFramework({ id: 'other' });
    const fetchImpl = makeFetch(f);
    await expect(loadFramework(entry, fetchImpl)).rejects.toThrow(/id mismatch/);
  });

  it('throws on non-ok HTTP response', async () => {
    const fetchImpl = makeFetch({}, false);
    await expect(loadFramework(entry, fetchImpl)).rejects.toThrow(/Failed to fetch/);
  });
});
