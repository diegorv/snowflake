import { get } from 'svelte/store';
import { emptyMilestones } from '../domain/defaults.js';
import { eligibleTitles, totalPoints } from '../domain/scoring.js';
import type { MilestoneMap } from '../domain/types.js';
import { loadFramework } from '../frameworks/loader.js';
import { getFramework } from '../frameworks/registry.js';
import { currentFramework, frameworkManifest } from './framework.js';
import { focusedTrackId } from './focus.js';
import { name, title } from './identity.js';
import { milestones } from './milestones.js';

export function resetAll(): void {
  const framework = get(currentFramework);
  if (!framework) return;
  milestones.set(emptyMilestones(framework));
  name.set('');
  focusedTrackId.set(framework.tracks[0].id);
  // title auto-snaps via the eligibleTitlesStore subscription
}

export async function selectFramework(
  id: string,
  initialMilestones?: MilestoneMap
): Promise<void> {
  const manifest = get(frameworkManifest);
  const entry = manifest.find((m) => m.id === id);
  if (!entry) {
    throw new Error(`Unknown framework id "${id}"`);
  }

  const framework = getFramework(id) ?? (await loadFramework(entry));

  const seed = initialMilestones ?? emptyMilestones(framework);
  const sanitized: MilestoneMap = {};
  for (const track of framework.tracks) {
    sanitized[track.id] = seed[track.id] ?? 0;
  }

  currentFramework.set(framework);
  milestones.set(sanitized);
  focusedTrackId.set(framework.tracks[0].id);

  const total = totalPoints(framework, sanitized);
  const eligible = eligibleTitles(framework, total);
  const currentTitle = get(title);
  if (!eligible.includes(currentTitle)) {
    title.set(eligible[0] ?? '');
  }
}
