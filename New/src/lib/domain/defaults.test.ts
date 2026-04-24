import { describe, expect, it } from 'vitest';
import { emptyMilestones } from './defaults.js';
import { buildFramework } from './__fixtures__/framework.js';

describe('defaults', () => {
  it('emptyMilestones returns 0 for every track id', () => {
    const f = buildFramework();
    expect(emptyMilestones(f)).toEqual({ T1: 0, T2: 0 });
  });
});
