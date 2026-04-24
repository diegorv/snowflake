import type { Framework, MilestoneMap, SharedState } from './types.js';
import { maxMilestoneLevel } from './scoring.js';

export function encodeHash(state: SharedState, framework: Framework): string {
  const milestoneValues = framework.tracks
    .map((t) => String(state.milestones[t.id] ?? 0))
    .join(',');
  const params = new URLSearchParams();
  params.set('f', state.frameworkId);
  params.set('m', milestoneValues);
  if (state.name) params.set('n', state.name);
  if (state.title) params.set('t', state.title);
  return params.toString();
}

export interface DecodedHash {
  frameworkId: string;
  milestones: MilestoneMap;
  name: string;
  title: string;
}

export function decodeHash(
  hash: string,
  frameworksById: Map<string, Framework>
): DecodedHash | null {
  const clean = hash.startsWith('#') ? hash.slice(1) : hash;
  if (!clean) return null;

  let params: URLSearchParams;
  try {
    params = new URLSearchParams(clean);
  } catch {
    return null;
  }

  const frameworkId = params.get('f');
  if (!frameworkId) return null;

  const framework = frameworksById.get(frameworkId);
  if (!framework) return null;

  const rawMilestones = params.get('m') ?? '';
  const values = rawMilestones ? rawMilestones.split(',') : [];
  if (values.length !== framework.tracks.length) return null;

  const max = maxMilestoneLevel(framework);
  const milestones: MilestoneMap = {};
  for (let i = 0; i < framework.tracks.length; i++) {
    const parsed = Number.parseInt(values[i], 10);
    if (Number.isNaN(parsed)) {
      milestones[framework.tracks[i].id] = 0;
      continue;
    }
    milestones[framework.tracks[i].id] = Math.max(0, Math.min(max, parsed));
  }

  return {
    frameworkId,
    milestones,
    name: params.get('n') ?? '',
    title: params.get('t') ?? ''
  };
}
