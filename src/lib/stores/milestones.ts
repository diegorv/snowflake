import { get, writable } from 'svelte/store';
import type { MilestoneMap } from '../domain/types.js';
import { maxMilestoneLevel } from '../domain/scoring.js';
import { currentFramework } from './framework.js';

export const milestones = writable<MilestoneMap>({});

export function setMilestone(trackId: string, level: number): void {
  const framework = get(currentFramework);
  if (!framework) return;
  const max = maxMilestoneLevel(framework);
  const clamped = Math.max(0, Math.min(max, Math.floor(level)));
  milestones.update((m) => ({ ...m, [trackId]: clamped }));
}

export function shiftMilestone(trackId: string, delta: number): void {
  const current = get(milestones)[trackId] ?? 0;
  setMilestone(trackId, current + delta);
}
