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

const CategorySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  color: z.string().min(1)
});

const MilestoneSchema = z.object({
  summary: z.string(),
  signals: z.array(z.string()),
  examples: z.array(z.string())
});

const TrackSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string(),
  milestones: z.array(MilestoneSchema).min(1)
});

const LevelThresholdSchema = z.object({
  minPoints: z.number().int().nonnegative(),
  label: z.string().min(1)
});

const TitleSchema = z.object({
  label: z.string().min(1),
  minPoints: z.number().int().nonnegative(),
  maxPoints: z.number().int().nonnegative().optional()
});

export const FrameworkSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  categories: z.array(CategorySchema).min(1),
  tracks: z.array(TrackSchema).min(1),
  milestonePoints: z.array(z.number().nonnegative()).min(2),
  pointsToLevels: z.array(LevelThresholdSchema).min(1),
  titles: z.array(TitleSchema).min(1)
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
