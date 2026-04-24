import type { Framework, MilestoneMap } from './types.js';

export function emptyMilestones(framework: Framework): MilestoneMap {
  const map: MilestoneMap = {};
  for (const track of framework.tracks) {
    map[track.id] = 0;
  }
  return map;
}
