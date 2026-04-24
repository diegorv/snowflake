import type { Framework } from '../types.js';

export function buildFramework(overrides: Partial<Framework> = {}): Framework {
  return {
    id: 'test',
    displayName: 'Test Framework',
    categories: [
      { id: 'a', label: 'Alpha', color: '#111' },
      { id: 'b', label: 'Beta', color: '#222' }
    ],
    tracks: [
      {
        id: 'T1',
        displayName: 'Track One',
        categoryId: 'a',
        description: 'desc 1',
        milestones: [
          { summary: 's1', signals: [], examples: [] },
          { summary: 's2', signals: [], examples: [] },
          { summary: 's3', signals: [], examples: [] }
        ]
      },
      {
        id: 'T2',
        displayName: 'Track Two',
        categoryId: 'b',
        description: 'desc 2',
        milestones: [
          { summary: 's1', signals: [], examples: [] },
          { summary: 's2', signals: [], examples: [] },
          { summary: 's3', signals: [], examples: [] }
        ]
      }
    ],
    milestonePoints: [0, 2, 5, 10],
    pointsToLevels: [
      { minPoints: 0, label: 'L1' },
      { minPoints: 5, label: 'L2' },
      { minPoints: 12, label: 'L3' }
    ],
    titles: [
      { label: 'Junior', minPoints: 0, maxPoints: 4 },
      { label: 'Mid', minPoints: 5, maxPoints: 11 },
      { label: 'Senior', minPoints: 12 }
    ],
    ...overrides
  };
}
