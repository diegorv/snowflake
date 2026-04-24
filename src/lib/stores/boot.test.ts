import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';
import { bootApp } from './boot.js';
import { currentFramework, frameworkManifest } from './framework.js';
import { focusedTrackId } from './focus.js';
import { name, title } from './identity.js';
import { milestones } from './milestones.js';
import { clearRegistry } from '../frameworks/registry.js';
import { buildFramework } from '../domain/__fixtures__/framework.js';
import type { Framework } from '../domain/types.js';

function resetStores() {
  currentFramework.set(null);
  frameworkManifest.set([]);
  milestones.set({});
  name.set('');
  title.set('');
  focusedTrackId.set('');
}

type Fixture = Record<string, unknown>;

/**
 * Make a fetch stub that answers the manifest URL with the given manifest and
 * each framework URL with the corresponding JSON body (by id).
 */
function makeFetch(
  manifest: { id: string; label: string; path: string }[],
  frameworks: Record<string, Fixture | Error>
): typeof fetch {
  return vi.fn(async (url: string) => {
    if (url.endsWith('/frameworks/index.json')) {
      return {
        ok: true,
        status: 200,
        json: async () => manifest
      } as Response;
    }
    const entry = manifest.find((m) => url.endsWith(m.path));
    if (!entry) {
      return { ok: false, status: 404, json: async () => ({}) } as Response;
    }
    const body = frameworks[entry.id];
    if (body instanceof Error) throw body;
    if (!body) {
      return { ok: false, status: 500, json: async () => ({}) } as Response;
    }
    return { ok: true, status: 200, json: async () => body } as Response;
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  clearRegistry();
  resetStores();
});

afterEach(() => {
  clearRegistry();
  resetStores();
});

describe('bootApp', () => {
  const medium: Framework = buildFramework({ id: 'medium' });
  const small: Framework = buildFramework({ id: 'small' });

  const manifest = [
    { id: 'medium', label: 'Medium', path: '/frameworks/medium.json' },
    { id: 'small', label: 'Small', path: '/frameworks/small.json' }
  ];

  it('selects the first framework when no hash is provided', async () => {
    const fetchImpl = makeFetch(manifest, {
      medium: medium as unknown as Fixture,
      small: small as unknown as Fixture
    });
    const result = await bootApp({ fetch: fetchImpl, initialHash: '' });

    expect(get(currentFramework)?.id).toBe('medium');
    expect(result.failedIds).toEqual([]);
    result.teardown();
  });

  it('restores state from a valid hash', async () => {
    const fetchImpl = makeFetch(manifest, {
      medium: medium as unknown as Fixture,
      small: small as unknown as Fixture
    });

    const result = await bootApp({
      fetch: fetchImpl,
      initialHash: '#f=small&m=1,2&n=Ada&t=Junior'
    });

    expect(get(currentFramework)?.id).toBe('small');
    expect(get(milestones)).toEqual({ T1: 1, T2: 2 });
    expect(get(name)).toBe('Ada');
    result.teardown();
  });

  it('falls back to the first framework when the hash references an unknown id', async () => {
    const fetchImpl = makeFetch(manifest, {
      medium: medium as unknown as Fixture,
      small: small as unknown as Fixture
    });

    const result = await bootApp({
      fetch: fetchImpl,
      initialHash: '#f=ghost&m=1,2,3'
    });

    expect(get(currentFramework)?.id).toBe('medium');
    result.teardown();
  });

  it('removes preload failures from the manifest and reports them', async () => {
    const fetchImpl = makeFetch(manifest, {
      medium: medium as unknown as Fixture,
      small: new Error('network down')
    });

    const result = await bootApp({ fetch: fetchImpl, initialHash: '' });

    expect(result.failedIds).toEqual(['small']);
    expect(get(frameworkManifest).map((m) => m.id)).toEqual(['medium']);
    result.teardown();
  });

  it('throws when every framework fails to load', async () => {
    const fetchImpl = makeFetch(manifest, {
      medium: new Error('a'),
      small: new Error('b')
    });

    await expect(bootApp({ fetch: fetchImpl, initialHash: '' })).rejects.toThrow(
      /No frameworks could be loaded/
    );
  });

  it('throws when the manifest is empty', async () => {
    const fetchImpl = makeFetch([], {});

    await expect(bootApp({ fetch: fetchImpl, initialHash: '' })).rejects.toThrow(
      /No frameworks configured/
    );
  });
});
