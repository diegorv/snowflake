import { arc } from 'd3-shape';
import { scaleBand } from 'd3-scale';
import type { Framework, MilestoneMap } from './types.js';
import { maxMilestoneLevel } from './scoring.js';

export interface NightingaleDimensions {
  /** Outer canvas size (square). Inner/outer radii are derived as ratios of this. */
  size: number;
  /** Inner radius ratio of `size` (start of the first level ring). */
  innerRadiusRatio?: number;
  /** Outer radius ratio of `size` (end of the last level ring). */
  outerRadiusRatio?: number;
  /** Gap between consecutive rings, 0–1. */
  ringPadding?: number;
  /** Small spacing between arcs of neighboring tracks, in radians. */
  padAngle?: number;
}

export interface NightingaleSlice {
  /** Stable key for Svelte `{#each}`. */
  key: string;
  /** SVG path d-attribute for this arc. */
  d: string;
  trackId: string;
  trackName: string;
  /** 0 = centre wedge. 1..maxLevel = outer rings. */
  level: number;
  /** Fill color. */
  color: string;
  /** True if this is the currently focused (track, milestone) pair. */
  focused: boolean;
  /** Rotation in degrees for this slice's group. */
  rotation: number;
}

export interface NightingaleGeometry {
  /** Wedges at the center of the radar (milestone 0 click target). */
  center: NightingaleSlice[];
  /** Outer level rings, ordered by track then level. */
  levels: NightingaleSlice[];
  /** Initial rotation (in degrees) so the first track sits on top. */
  rotationOffset: number;
}

const EMPTY_COLOR = '#e5e5e5';

/**
 * Pure (framework, state) → (arc paths, colors, focused flags) geometry.
 *
 * Extracted from NightingaleChart.svelte so the maths can be unit-tested and
 * the component can stay focused on rendering + event wiring.
 */
export function buildNightingaleGeometry(
  framework: Framework,
  milestones: MilestoneMap,
  focusedTrackId: string,
  categoryColors: Map<string, string>,
  dimensions: NightingaleDimensions
): NightingaleGeometry {
  const {
    size,
    innerRadiusRatio = 0.15,
    outerRadiusRatio = 0.48,
    ringPadding = 0.08,
    padAngle = 0.012
  } = dimensions;

  const trackCount = framework.tracks.length;
  const maxLevel = maxMilestoneLevel(framework);
  const innerRadius = innerRadiusRatio * size;
  const outerRadius = outerRadiusRatio * size;
  const zeroOuter = Math.max(0, innerRadius - 2);

  const radiusScale = scaleBand<number>()
    .domain(Array.from({ length: Math.max(1, maxLevel) }, (_, i) => i + 1))
    .range([innerRadius, outerRadius])
    .paddingInner(ringPadding);

  const halfAngle = trackCount > 0 ? Math.PI / trackCount : 0;

  const levelArc = arc<{ level: number }>()
    .innerRadius((d) => radiusScale(d.level) ?? innerRadius)
    .outerRadius((d) => (radiusScale(d.level) ?? innerRadius) + radiusScale.bandwidth())
    .startAngle(-halfAngle)
    .endAngle(halfAngle)
    .padAngle(padAngle);

  const centerArc = arc()
    .innerRadius(0)
    .outerRadius(zeroOuter)
    .startAngle(-halfAngle)
    .endAngle(halfAngle);

  const center: NightingaleSlice[] = [];
  const levels: NightingaleSlice[] = [];

  for (let t = 0; t < trackCount; t++) {
    const track = framework.tracks[t];
    const current = milestones[track.id] ?? 0;
    const rotation = (360 / trackCount) * t;
    const categoryColor = categoryColors.get(track.categoryId) ?? '#ccc';

    center.push({
      key: `${track.id}-0`,
      d: centerArc({} as never) ?? '',
      trackId: track.id,
      trackName: track.displayName,
      level: 0,
      color: categoryColor,
      focused: track.id === focusedTrackId && current === 0,
      rotation
    });

    for (let level = 1; level <= maxLevel; level++) {
      const filled = current >= level;
      levels.push({
        key: `${track.id}-${level}`,
        d: levelArc({ level }) ?? '',
        trackId: track.id,
        trackName: track.displayName,
        level,
        color: filled ? categoryColor : EMPTY_COLOR,
        focused: track.id === focusedTrackId && current === level,
        rotation
      });
    }
  }

  return {
    center,
    levels,
    rotationOffset: trackCount > 0 ? -180 / trackCount : 0
  };
}
