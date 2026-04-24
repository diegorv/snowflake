import { describe, expect, it } from 'vitest';
import { FrameworkValidationError, parseFramework } from './frameworkSchema.js';
import { buildFramework } from './__fixtures__/framework.js';

describe('parseFramework', () => {
  it('accepts a valid minimal framework', () => {
    const valid = buildFramework();
    const parsed = parseFramework(valid);
    expect(parsed.id).toBe('test');
    expect(parsed.tracks).toHaveLength(2);
  });

  it('rejects when a track references an unknown categoryId', () => {
    const bad = buildFramework({
      tracks: [
        {
          id: 'T1',
          displayName: 'One',
          categoryId: 'nonexistent',
          description: '',
          milestones: [
            { summary: 's', signals: [], examples: [] },
            { summary: 's', signals: [], examples: [] },
            { summary: 's', signals: [], examples: [] }
          ]
        },
        {
          id: 'T2',
          displayName: 'Two',
          categoryId: 'a',
          description: '',
          milestones: [
            { summary: 's', signals: [], examples: [] },
            { summary: 's', signals: [], examples: [] },
            { summary: 's', signals: [], examples: [] }
          ]
        }
      ]
    });
    expect(() => parseFramework(bad)).toThrow(FrameworkValidationError);
    try {
      parseFramework(bad);
    } catch (err) {
      expect((err as FrameworkValidationError).issues.join('\n')).toContain('unknown categoryId');
    }
  });

  it('rejects when tracks have non-uniform milestone count', () => {
    const bad = buildFramework();
    bad.tracks[1].milestones = bad.tracks[1].milestones.slice(0, 2);
    expect(() => parseFramework(bad)).toThrow(/expected 3 to match other tracks/);
  });

  it('rejects when milestonePoints.length !== milestones + 1', () => {
    const bad = buildFramework({ milestonePoints: [0, 1, 2] }); // needs length 4
    expect(() => parseFramework(bad)).toThrow(/milestonePoints\.length/);
  });

  it('rejects when pointsToLevels is not strictly ascending', () => {
    const bad = buildFramework({
      pointsToLevels: [
        { minPoints: 0, label: 'A' },
        { minPoints: 5, label: 'B' },
        { minPoints: 5, label: 'C' }
      ]
    });
    expect(() => parseFramework(bad)).toThrow(/strictly ascending/);
  });

  it('rejects when pointsToLevels does not start at 0', () => {
    const bad = buildFramework({
      pointsToLevels: [
        { minPoints: 1, label: 'A' },
        { minPoints: 5, label: 'B' }
      ]
    });
    expect(() => parseFramework(bad)).toThrow(/start with minPoints=0/);
  });

  it('rejects when a title has maxPoints < minPoints', () => {
    const bad = buildFramework({
      titles: [{ label: 'Junior', minPoints: 10, maxPoints: 5 }]
    });
    expect(() => parseFramework(bad)).toThrow(/maxPoints .* < minPoints/);
  });

  it('rejects duplicate track ids', () => {
    const bad = buildFramework();
    bad.tracks[1].id = bad.tracks[0].id;
    expect(() => parseFramework(bad)).toThrow(/duplicate track id/);
  });

  it('produces a readable error that lists all issues', () => {
    const bad = buildFramework({
      pointsToLevels: [{ minPoints: 10, label: 'start' }], // not starting at 0
      milestonePoints: [0, 1] // wrong length
    });
    try {
      parseFramework(bad);
      throw new Error('should have thrown');
    } catch (err) {
      if (!(err instanceof FrameworkValidationError)) throw err;
      expect(err.issues.length).toBeGreaterThan(1);
      expect(err.message).toContain('Invalid framework JSON');
    }
  });
});
