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

function minTrackMilestone(
  framework: Framework,
  milestones: MilestoneMap | undefined
): number {
  // No milestone map → no balance constraint can be evaluated, so callers
  // get the legacy points-only behaviour.
  if (!milestones) return Number.POSITIVE_INFINITY;
  let min = Number.POSITIVE_INFINITY;
  for (const track of framework.tracks) {
    const m = milestones[track.id] ?? 0;
    if (m < min) min = m;
  }
  return min;
}

function titleForLevel(framework: Framework, levelMinPoints: number) {
  return framework.titles.find(
    (t) =>
      levelMinPoints >= t.minPoints &&
      (t.maxPoints === undefined || levelMinPoints <= t.maxPoints)
  );
}

function isLevelUnlocked(
  framework: Framework,
  levelMinPoints: number,
  minTrack: number
): boolean {
  if (minTrack === Number.POSITIVE_INFINITY) return true;
  const title = titleForLevel(framework, levelMinPoints);
  if (!title?.minMilestonePerTrack) return true;
  return minTrack >= title.minMilestonePerTrack;
}

export function currentLevel(
  framework: Framework,
  total: number,
  milestones?: MilestoneMap
): string {
  const minTrack = minTrackMilestone(framework, milestones);
  let label = framework.pointsToLevels[0].label;
  for (const entry of framework.pointsToLevels) {
    if (total < entry.minPoints) break;
    if (!isLevelUnlocked(framework, entry.minPoints, minTrack)) break;
    label = entry.label;
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

export function eligibleTitles(
  framework: Framework,
  total: number,
  milestones?: MilestoneMap
): string[] {
  const minTrack = minTrackMilestone(framework, milestones);
  // Walk titles in order. The user is "at" the highest title whose minPoints
  // is reached AND whose balance gate (if any) passes. If their total exceeds
  // a title's maxPoints but the next title is blocked, they stay at the last
  // reachable title rather than falling off the chart.
  let result: string[] = [];
  for (const t of framework.titles) {
    if (total < t.minPoints) break;
    if (
      minTrack !== Number.POSITIVE_INFINITY &&
      t.minMilestonePerTrack !== undefined &&
      minTrack < t.minMilestonePerTrack
    ) {
      break;
    }
    result = [t.label];
  }
  return result;
}

export function maxAchievablePoints(framework: Framework): number {
  const maxPerTrack = framework.milestonePoints[framework.milestonePoints.length - 1];
  return framework.tracks.length * maxPerTrack;
}
