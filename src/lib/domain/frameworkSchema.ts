import { z } from 'zod';
import type { Framework } from './types.js';

export class FrameworkValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid framework JSON:\n  - ${issues.join('\n  - ')}`);
    this.issues = issues;
    this.name = 'FrameworkValidationError';
  }
}

// Upper bounds are deliberately permissive but finite, so a malicious or
// accidentally-huge preset (e.g. 10 000 signals per milestone) cannot DoS
// rendering or balloon memory when loaded.
const MAX_SIGNALS = 50;
const MAX_EXAMPLES = 50;
const MAX_MILESTONES = 20;
const MAX_TRACKS = 64;
const MAX_CATEGORIES = 16;
const MAX_LEVELS = 64;
const MAX_TITLES = 32;
const MAX_STRING = 2000;

const CategorySchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(120),
  color: z.string().min(1).max(32)
});

const MilestoneSchema = z.object({
  summary: z.string().max(MAX_STRING),
  signals: z.array(z.string().max(MAX_STRING)).max(MAX_SIGNALS),
  examples: z.array(z.string().max(MAX_STRING)).max(MAX_EXAMPLES)
});

const TrackSchema = z.object({
  id: z.string().min(1).max(64),
  displayName: z.string().min(1).max(120),
  categoryId: z.string().min(1).max(64),
  description: z.string().max(MAX_STRING),
  milestones: z.array(MilestoneSchema).min(1).max(MAX_MILESTONES)
});

const LevelThresholdSchema = z.object({
  minPoints: z.number().int().nonnegative(),
  label: z.string().min(1).max(64)
});

const TitleSchema = z.object({
  label: z.string().min(1).max(120),
  minPoints: z.number().int().nonnegative(),
  maxPoints: z.number().int().nonnegative().optional()
});

export const FrameworkSchema = z.object({
  id: z.string().min(1).max(64),
  displayName: z.string().min(1).max(120),
  categories: z.array(CategorySchema).min(1).max(MAX_CATEGORIES),
  tracks: z.array(TrackSchema).min(1).max(MAX_TRACKS),
  milestonePoints: z.array(z.number().nonnegative()).min(2).max(MAX_MILESTONES + 1),
  pointsToLevels: z.array(LevelThresholdSchema).min(1).max(MAX_LEVELS),
  titles: z.array(TitleSchema).min(1).max(MAX_TITLES)
});

function collectSemanticIssues(f: z.infer<typeof FrameworkSchema>): string[] {
  const issues: string[] = [];

  const categoryIds = new Set(f.categories.map((c) => c.id));
  for (const track of f.tracks) {
    if (!categoryIds.has(track.categoryId)) {
      issues.push(
        `track "${track.id}" references unknown categoryId "${track.categoryId}"`
      );
    }
  }

  const firstLen = f.tracks[0].milestones.length;
  for (const track of f.tracks) {
    if (track.milestones.length !== firstLen) {
      issues.push(
        `track "${track.id}" has ${track.milestones.length} milestones; expected ${firstLen} to match other tracks`
      );
    }
  }

  if (f.milestonePoints.length !== firstLen + 1) {
    issues.push(
      `milestonePoints.length (${f.milestonePoints.length}) must equal milestones-per-track + 1 (${firstLen + 1})`
    );
  }

  for (let i = 1; i < f.pointsToLevels.length; i++) {
    if (f.pointsToLevels[i].minPoints <= f.pointsToLevels[i - 1].minPoints) {
      issues.push(
        `pointsToLevels must be strictly ascending by minPoints (entry #${i} breaks order)`
      );
      break;
    }
  }
  if (f.pointsToLevels[0].minPoints !== 0) {
    issues.push(
      `pointsToLevels must start with minPoints=0 (got ${f.pointsToLevels[0].minPoints})`
    );
  }

  for (const title of f.titles) {
    if (title.maxPoints !== undefined && title.maxPoints < title.minPoints) {
      issues.push(
        `title "${title.label}" has maxPoints (${title.maxPoints}) < minPoints (${title.minPoints})`
      );
    }
  }

  const trackIds = new Set<string>();
  for (const track of f.tracks) {
    if (trackIds.has(track.id)) {
      issues.push(`duplicate track id "${track.id}"`);
    }
    trackIds.add(track.id);
  }

  return issues;
}

export function parseFramework(input: unknown): Framework {
  const shape = FrameworkSchema.safeParse(input);
  if (!shape.success) {
    const issues = shape.error.issues.map(
      (i) => `${i.path.join('.') || '(root)'}: ${i.message}`
    );
    throw new FrameworkValidationError(issues);
  }

  const semantic = collectSemanticIssues(shape.data);
  if (semantic.length > 0) {
    throw new FrameworkValidationError(semantic);
  }

  return shape.data;
}
