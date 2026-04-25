import { derived } from 'svelte/store';
import {
  categoryPoints,
  currentLevel,
  eligibleTitles,
  maxAchievablePoints,
  pointsToNextLevel,
  totalPoints
} from '../domain/scoring.js';
import { currentFramework } from './framework.js';
import { milestones } from './milestones.js';

export const totalPointsStore = derived(
  [currentFramework, milestones],
  ([$framework, $milestones]) => ($framework ? totalPoints($framework, $milestones) : 0)
);

export const categoryPointsStore = derived(
  [currentFramework, milestones],
  ([$framework, $milestones]) =>
    $framework ? categoryPoints($framework, $milestones) : []
);

export const currentLevelStore = derived(
  [currentFramework, totalPointsStore, milestones],
  ([$framework, $total, $milestones]) =>
    $framework ? currentLevel($framework, $total, $milestones) : ''
);

export const pointsToNextLevelStore = derived(
  [currentFramework, totalPointsStore],
  ([$framework, $total]) => ($framework ? pointsToNextLevel($framework, $total) : 'N/A')
);

export const eligibleTitlesStore = derived(
  [currentFramework, totalPointsStore, milestones],
  ([$framework, $total, $milestones]) =>
    $framework ? eligibleTitles($framework, $total, $milestones) : []
);

export const maxPointsStore = derived(currentFramework, ($framework) =>
  $framework ? maxAchievablePoints($framework) : 0
);

export const categoryColorMapStore = derived(currentFramework, ($framework) => {
  const map = new Map<string, string>();
  if ($framework) {
    for (const c of $framework.categories) {
      map.set(c.id, c.color);
    }
  }
  return map;
});
