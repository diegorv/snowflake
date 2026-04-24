export interface Category {
  id: string;
  label: string;
  color: string;
}

export interface MilestoneDef {
  summary: string;
  signals: string[];
  examples: string[];
}

export interface TrackDef {
  id: string;
  displayName: string;
  categoryId: string;
  description: string;
  milestones: MilestoneDef[];
}

export interface LevelThreshold {
  minPoints: number;
  label: string;
}

export interface TitleDef {
  label: string;
  minPoints: number;
  maxPoints?: number;
}

export interface Framework {
  id: string;
  displayName: string;
  categories: Category[];
  tracks: TrackDef[];
  milestonePoints: number[];
  pointsToLevels: LevelThreshold[];
  titles: TitleDef[];
}

export type MilestoneMap = Record<string, number>;

export interface CategoryPoints {
  categoryId: string;
  points: number;
}

export interface SharedState {
  frameworkId: string;
  milestones: MilestoneMap;
  name: string;
  title: string;
}
