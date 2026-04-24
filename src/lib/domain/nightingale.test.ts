import { describe, expect, it } from 'vitest';
import { buildNightingaleGeometry } from './nightingale.js';
import { buildFramework } from './__fixtures__/framework.js';

function colorMap(entries: [string, string][]) {
  return new Map(entries);
}

describe('buildNightingaleGeometry', () => {
  const framework = buildFramework();
  const colors = colorMap([
    ['a', '#111'],
    ['b', '#222']
  ]);

  it('emits one center slice per track', () => {
    const g = buildNightingaleGeometry(framework, {}, '', colors, { size: 420 });
    expect(g.center).toHaveLength(framework.tracks.length);
    expect(g.center.map((s) => s.level)).toEqual(
      framework.tracks.map(() => 0)
    );
  });

  it('emits one level slice per (track, level) pair', () => {
    const g = buildNightingaleGeometry(framework, {}, '', colors, { size: 420 });
    const maxLevel = framework.tracks[0].milestones.length;
    expect(g.levels).toHaveLength(framework.tracks.length * maxLevel);
  });

  it('always paints centre wedges in the category color regardless of milestone', () => {
    // Track T1 is in category "a" (#111)
    const g1 = buildNightingaleGeometry(framework, { T1: 0 }, '', colors, { size: 420 });
    const g2 = buildNightingaleGeometry(framework, { T1: 3 }, '', colors, { size: 420 });
    const t1Center1 = g1.center.find((s) => s.trackId === 'T1');
    const t1Center2 = g2.center.find((s) => s.trackId === 'T1');
    expect(t1Center1?.color).toBe('#111');
    expect(t1Center2?.color).toBe('#111');
  });

  it('colors filled levels and leaves unfilled levels grey', () => {
    // T1 at milestone 2: levels 1 and 2 are filled, 3 is empty
    const g = buildNightingaleGeometry(framework, { T1: 2 }, '', colors, { size: 420 });
    const t1Levels = g.levels.filter((s) => s.trackId === 'T1');
    expect(t1Levels[0].color).toBe('#111'); // level 1 filled
    expect(t1Levels[1].color).toBe('#111'); // level 2 filled
    expect(t1Levels[2].color).not.toBe('#111'); // level 3 empty
  });

  it('marks only the (focusedTrackId, currentLevel) slice as focused', () => {
    const g = buildNightingaleGeometry(framework, { T1: 2, T2: 1 }, 'T1', colors, { size: 420 });
    const focused = [...g.center, ...g.levels].filter((s) => s.focused);
    expect(focused).toHaveLength(1);
    expect(focused[0]).toMatchObject({ trackId: 'T1', level: 2 });
  });

  it('focuses the centre wedge when the track is at milestone 0', () => {
    const g = buildNightingaleGeometry(framework, { T1: 0 }, 'T1', colors, { size: 420 });
    const focused = [...g.center, ...g.levels].filter((s) => s.focused);
    expect(focused).toHaveLength(1);
    expect(focused[0]).toMatchObject({ trackId: 'T1', level: 0 });
  });

  it('rotation offset centres the first track on top', () => {
    const g = buildNightingaleGeometry(framework, {}, '', colors, { size: 420 });
    // 2 tracks => each arc spans 180°; offset is -180/N = -90
    expect(g.rotationOffset).toBe(-90);
  });

  it('rotation offset is 0 for an empty framework (defensive)', () => {
    // Build a framework and then zero out tracks to simulate the guard.
    // The schema won't let this happen at parse time; this is just making
    // sure the geometry doesn't NaN when called with trackCount = 0.
    const g = buildNightingaleGeometry(
      { ...framework, tracks: [] },
      {},
      '',
      colors,
      { size: 420 }
    );
    expect(g.rotationOffset).toBe(0);
    expect(g.center).toEqual([]);
    expect(g.levels).toEqual([]);
  });

  it('produces non-empty SVG path strings', () => {
    const g = buildNightingaleGeometry(framework, { T1: 1 }, '', colors, { size: 420 });
    expect(g.center[0].d).toMatch(/^M/);
    expect(g.levels[0].d).toMatch(/^M/);
  });
});
