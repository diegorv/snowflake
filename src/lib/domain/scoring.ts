import type { CategoryPoints, Framework, MilestoneMap } from './types.js';

export function milestoneToPoints(framework: Framework, level: number): number {
  const clamped = Math.max(0, Math.min(framework.milestonePoints.length - 1, Math.floor(level)));
  return framework.milestonePoints[clamped];
}

export function maxMilestoneLevel(framework: Framework): number {
  // Schema guarantees tracks.length >= 1, but be defensive so this never
  // throws if callers pass a partially-constructed framework.
  return framework.tracks[0]?.milestones.length ?? 0;
}

export function totalPoints(framework: Framework, milestones: MilestoneMap): number {
  let sum = 0;
  for (const track of framework.tracks) {
    sum += milestoneToPoints(framework, milestones[track.id] ?? 0);
  }
  return sum;
}

export function categoryPoints(
  framework: Framework,
  milestones: MilestoneMap
): CategoryPoints[] {
  const bucket = new Map<string, number>();
  for (const category of framework.categories) {
    bucket.set(category.id, 0);
  }
  for (const track of framework.tracks) {
    const pts = milestoneToPoints(framework, milestones[track.id] ?? 0);
    bucket.set(track.categoryId, (bucket.get(track.categoryId) ?? 0) + pts);
  }
  return framework.categories.map((c) => ({
    categoryId: c.id,
    points: bucket.get(c.id) ?? 0
  }));
}

export function currentLevel(framework: Framework, total: number): string {
  let label = framework.pointsToLevels[0].label;
  for (const entry of framework.pointsToLevels) {
    if (total >= entry.minPoints) {
      label = entry.label;
    } else {
      break;
    }
  }
  return label;
}

export function pointsToNextLevel(
  framework: Framework,
  total: number
): number | 'N/A' {
  for (const entry of framework.pointsToLevels) {
    if (entry.minPoints > total) {
      return entry.minPoints - total;
    }
  }
  return 'N/A';
}

export function eligibleTitles(framework: Framework, total: number): string[] {
  return framework.titles
    .filter(
      (t) =>
        total >= t.minPoints &&
        (t.maxPoints === undefined || total <= t.maxPoints)
    )
    .map((t) => t.label);
}

export function maxAchievablePoints(framework: Framework): number {
  const maxPerTrack = framework.milestonePoints[framework.milestonePoints.length - 1];
  return framework.tracks.length * maxPerTrack;
}
