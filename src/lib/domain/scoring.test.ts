import { describe, expect, it } from 'vitest';
import {
  categoryPoints,
  currentLevel,
  eligibleTitles,
  maxAchievablePoints,
  maxMilestoneLevel,
  milestoneToPoints,
  pointsToNextLevel,
  totalPoints
} from './scoring.js';
import { buildFramework } from './__fixtures__/framework.js';

describe('scoring', () => {
  const f = buildFramework();

  it('milestoneToPoints clamps out-of-range levels', () => {
    expect(milestoneToPoints(f, 0)).toBe(0);
    expect(milestoneToPoints(f, 3)).toBe(10);
    expect(milestoneToPoints(f, -5)).toBe(0);
    expect(milestoneToPoints(f, 99)).toBe(10);
  });

  it('maxMilestoneLevel matches milestones-per-track', () => {
    expect(maxMilestoneLevel(f)).toBe(3);
  });

  it('totalPoints sums milestone points across all tracks', () => {
    expect(totalPoints(f, { T1: 2, T2: 3 })).toBe(5 + 10);
  });

  it('totalPoints returns 0 for empty map', () => {
    expect(totalPoints(f, {})).toBe(0);
  });

  it('categoryPoints buckets by categoryId and preserves category order', () => {
    const result = categoryPoints(f, { T1: 2, T2: 1 });
    expect(result).toEqual([
      { categoryId: 'a', points: 5 },
      { categoryId: 'b', points: 2 }
    ]);
  });

  it('categoryPoints returns a zero bucket for categories with no tracks used', () => {
    const result = categoryPoints(f, {});
    expect(result).toEqual([
      { categoryId: 'a', points: 0 },
      { categoryId: 'b', points: 0 }
    ]);
  });

  it('currentLevel returns the first label when total is 0', () => {
    expect(currentLevel(f, 0)).toBe('L1');
  });

  it('currentLevel returns the highest passed threshold', () => {
    expect(currentLevel(f, 4)).toBe('L1');
    expect(currentLevel(f, 5)).toBe('L2');
    expect(currentLevel(f, 11)).toBe('L2');
    expect(currentLevel(f, 12)).toBe('L3');
    expect(currentLevel(f, 100)).toBe('L3');
  });

  it('pointsToNextLevel returns the gap to the next threshold', () => {
    expect(pointsToNextLevel(f, 0)).toBe(5);
    expect(pointsToNextLevel(f, 4)).toBe(1);
    expect(pointsToNextLevel(f, 5)).toBe(7);
  });

  it("pointsToNextLevel returns 'N/A' when at the top level", () => {
    expect(pointsToNextLevel(f, 12)).toBe('N/A');
    expect(pointsToNextLevel(f, 999)).toBe('N/A');
  });

  it('eligibleTitles filters by minPoints and optional maxPoints, inclusive', () => {
    expect(eligibleTitles(f, 0)).toEqual(['Junior']);
    expect(eligibleTitles(f, 4)).toEqual(['Junior']);
    expect(eligibleTitles(f, 5)).toEqual(['Mid']);
    expect(eligibleTitles(f, 11)).toEqual(['Mid']);
    expect(eligibleTitles(f, 12)).toEqual(['Senior']);
    expect(eligibleTitles(f, 999)).toEqual(['Senior']);
  });

  it('maxAchievablePoints === track count * top milestonePoint', () => {
    expect(maxAchievablePoints(f)).toBe(2 * 10);
  });

  describe('minMilestonePerTrack balance gate', () => {
    const gated = buildFramework({
      titles: [
        { label: 'Junior', minPoints: 0, maxPoints: 4 },
        { label: 'Mid', minPoints: 5, maxPoints: 11, minMilestonePerTrack: 1 },
        { label: 'Senior', minPoints: 12, minMilestonePerTrack: 2 }
      ]
    });

    it('caps level when one track is at zero (single-axis maxing)', () => {
      // Total 10 (T1=3 maxes points), but T2=0 → blocked at the Mid band.
      expect(currentLevel(gated, 10, { T1: 3, T2: 0 })).toBe('L1');
    });

    it('unlocks the Mid band once every track has at least milestone 1', () => {
      // Total 5 with T1=1, T2=2 → Mid band unlocked, level L2.
      expect(currentLevel(gated, 7, { T1: 1, T2: 2 })).toBe('L2');
    });

    it('Senior band requires milestone 2 on every track', () => {
      // T1=3, T2=1 → 12 pts but minTrack=1 < 2, capped at top of Mid band.
      expect(currentLevel(gated, 12, { T1: 3, T2: 1 })).toBe('L2');
      // T1=2, T2=2 → 10 pts, minTrack=2, but only 10 pts so still L2.
      expect(currentLevel(gated, 10, { T1: 2, T2: 2 })).toBe('L2');
      // T1=3, T2=2 → 15 pts and minTrack=2 → unlocks Senior.
      expect(currentLevel(gated, 15, { T1: 3, T2: 2 })).toBe('L3');
    });

    it('eligibleTitles filters out bands the user cannot balance into', () => {
      expect(eligibleTitles(gated, 12, { T1: 3, T2: 0 })).toEqual(['Junior']);
      expect(eligibleTitles(gated, 12, { T1: 3, T2: 1 })).toEqual(['Mid']);
      expect(eligibleTitles(gated, 15, { T1: 3, T2: 2 })).toEqual(['Senior']);
    });

    it('falls back to legacy points-only behaviour when milestones omitted', () => {
      expect(currentLevel(gated, 12)).toBe('L3');
      expect(eligibleTitles(gated, 12)).toEqual(['Senior']);
    });

    it('one outlier high track does not promote the engineer past their weakest level', () => {
      // Cumulative-level intent: a single maxed track should not pull the
      // overall level above what every other track has demonstrated.
      // T1 maxed (3), T2 still at 1 → minTrack=1 stays in Mid band.
      expect(currentLevel(gated, 12, { T1: 3, T2: 1 })).toBe('L2');
      expect(eligibleTitles(gated, 12, { T1: 3, T2: 1 })).toEqual(['Mid']);
    });
  });
});
