import { describe, expect, it } from 'vitest';
import { decodeHash, encodeHash } from './hash.js';
import { buildFramework } from './__fixtures__/framework.js';

describe('hash codec', () => {
  const f = buildFramework();
  const registry = new Map([[f.id, f]]);

  it('encodes current state into a URL-param string', () => {
    const hash = encodeHash(
      {
        frameworkId: 'test',
        milestones: { T1: 1, T2: 2 },
        name: 'Ada Lovelace',
        title: 'Senior'
      },
      f
    );
    expect(hash).toContain('f=test');
    expect(hash).toContain('m=1%2C2'); // URL-encoded comma
    expect(hash).toContain('n=Ada+Lovelace');
    expect(hash).toContain('t=Senior');
  });

  it('round-trips encode -> decode for a valid state', () => {
    const state = {
      frameworkId: 'test',
      milestones: { T1: 2, T2: 3 },
      name: 'Grace Hopper',
      title: 'Senior'
    };
    const encoded = encodeHash(state, f);
    const decoded = decodeHash('#' + encoded, registry);
    expect(decoded).toEqual(state);
  });

  it('URL-encodes unicode in name and title', () => {
    const encoded = encodeHash(
      {
        frameworkId: 'test',
        milestones: { T1: 0, T2: 0 },
        name: 'Café ☕',
        title: 'Sênior'
      },
      f
    );
    const decoded = decodeHash('#' + encoded, registry);
    expect(decoded?.name).toBe('Café ☕');
    expect(decoded?.title).toBe('Sênior');
  });

  it('returns null when the framework id is unknown', () => {
    expect(decodeHash('#f=other&m=0,0', registry)).toBeNull();
  });

  it('returns null when m length does not match the track count', () => {
    expect(decodeHash('#f=test&m=1,2,3', registry)).toBeNull();
    expect(decodeHash('#f=test&m=1', registry)).toBeNull();
  });

  it('clamps milestones above the framework max level', () => {
    const decoded = decodeHash('#f=test&m=99,-4', registry);
    expect(decoded?.milestones.T1).toBe(3);
    expect(decoded?.milestones.T2).toBe(0);
  });

  it('tolerates missing n and t (older short links)', () => {
    const decoded = decodeHash('#f=test&m=1,0', registry);
    expect(decoded?.name).toBe('');
    expect(decoded?.title).toBe('');
  });

  it('returns null when the hash is empty', () => {
    expect(decodeHash('', registry)).toBeNull();
    expect(decodeHash('#', registry)).toBeNull();
  });

  it('returns null when f is missing', () => {
    expect(decodeHash('#m=1,2', registry)).toBeNull();
  });

  it('ignores unknown keys gracefully', () => {
    const decoded = decodeHash('#f=test&m=1,2&foo=bar', registry);
    expect(decoded?.frameworkId).toBe('test');
    expect(decoded?.milestones).toEqual({ T1: 1, T2: 2 });
  });

  it('parses non-numeric milestone entries as 0', () => {
    const decoded = decodeHash('#f=test&m=abc,2', registry);
    expect(decoded?.milestones.T1).toBe(0);
    expect(decoded?.milestones.T2).toBe(2);
  });

  it('does not throw on malformed percent-encoding', () => {
    // A trailing lone `%` is a classic URL parser foot-gun. The function
    // should never throw; at worst, return null or a best-effort decode.
    expect(() => decodeHash('#f=test&m=1,2&n=%', registry)).not.toThrow();
  });
});
