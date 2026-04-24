<script lang="ts">
  import { arc } from 'd3-shape';
  import { scaleBand } from 'd3-scale';
  import { currentFramework } from '$lib/stores/framework.js';
  import { milestones, setMilestone } from '$lib/stores/milestones.js';
  import { focusedTrackId } from '$lib/stores/focus.js';
  import { categoryColorMapStore } from '$lib/stores/derived.js';
  import { maxMilestoneLevel } from '$lib/domain/scoring.js';

  const SIZE = 420;
  const CENTER = SIZE / 2;
  const INNER_RADIUS = 0.15 * SIZE;
  const OUTER_RADIUS = 0.48 * SIZE;
  const ZERO_INNER = 0;
  const ZERO_OUTER = INNER_RADIUS - 2;

  type Slice = {
    key: string;
    d: string;
    trackId: string;
    level: number;
    color: string;
    focused: boolean;
    rotation: number;
  };

  $: trackCount = $currentFramework?.tracks.length ?? 0;
  $: maxLevel = $currentFramework ? maxMilestoneLevel($currentFramework) : 0;

  $: radiusScale = scaleBand<number>()
    .domain(maxLevel > 0 ? Array.from({ length: maxLevel }, (_, i) => i + 1) : [1])
    .range([INNER_RADIUS, OUTER_RADIUS])
    .paddingInner(0.08);

  $: halfAngle = trackCount > 0 ? Math.PI / trackCount : 0;

  $: levelArc = arc<{ level: number }>()
    .innerRadius((d) => radiusScale(d.level) ?? INNER_RADIUS)
    .outerRadius((d) => (radiusScale(d.level) ?? INNER_RADIUS) + radiusScale.bandwidth())
    .startAngle(-halfAngle)
    .endAngle(halfAngle)
    .padAngle(0.012);

  $: centerArc = arc()
    .innerRadius(ZERO_INNER)
    .outerRadius(ZERO_OUTER)
    .startAngle(-halfAngle)
    .endAngle(halfAngle);

  $: rotationOffset = trackCount > 0 ? -180 / trackCount : 0;

  $: levelSlices = (() => {
    if (!$currentFramework) return [] as Slice[];
    const out: Slice[] = [];
    const colorMap = $categoryColorMapStore;
    const tracks = $currentFramework.tracks;
    for (let t = 0; t < tracks.length; t++) {
      const track = tracks[t];
      const current = $milestones[track.id] ?? 0;
      const rotation = (360 / trackCount) * t;
      for (let level = 1; level <= maxLevel; level++) {
        const filled = current >= level;
        out.push({
          key: `${track.id}-${level}`,
          d: levelArc({ level }) ?? '',
          trackId: track.id,
          level,
          color: filled ? colorMap.get(track.categoryId) ?? '#ccc' : '#e5e5e5',
          focused: track.id === $focusedTrackId && current === level,
          rotation
        });
      }
    }
    return out;
  })();

  $: centerSlices = (() => {
    if (!$currentFramework) return [] as Slice[];
    const out: Slice[] = [];
    const colorMap = $categoryColorMapStore;
    const tracks = $currentFramework.tracks;
    for (let t = 0; t < tracks.length; t++) {
      const track = tracks[t];
      const current = $milestones[track.id] ?? 0;
      const rotation = (360 / trackCount) * t;
      out.push({
        key: `${track.id}-0`,
        d: centerArc({} as never) ?? '',
        trackId: track.id,
        level: 0,
        color: current === 0 ? colorMap.get(track.categoryId) ?? '#ccc' : '#f4f4f4',
        focused: track.id === $focusedTrackId && current === 0,
        rotation
      });
    }
    return out;
  })();

  function onSliceClick(trackId: string, level: number) {
    const current = $milestones[trackId] ?? 0;
    setMilestone(trackId, current === level ? level - 1 : level);
    focusedTrackId.set(trackId);
  }

  function onSliceKey(event: KeyboardEvent, trackId: string, level: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSliceClick(trackId, level);
    }
  }
</script>

{#if $currentFramework}
  <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} class="chart" aria-label="Nightingale radar">
    <g transform={`translate(${CENTER},${CENTER}) rotate(${rotationOffset})`}>
      {#each centerSlices as slice (slice.key)}
        <path
          d={slice.d}
          transform={`rotate(${slice.rotation})`}
          fill={slice.color}
          stroke={slice.focused ? '#000' : '#fff'}
          stroke-width={slice.focused ? 3 : 1}
          on:click={() => onSliceClick(slice.trackId, 0)}
          on:keydown={(e) => onSliceKey(e, slice.trackId, 0)}
          role="button"
          aria-label={`Set ${slice.trackId} to milestone 0`}
          tabindex="0"
        />
      {/each}
      {#each levelSlices as slice (slice.key)}
        <path
          d={slice.d}
          transform={`rotate(${slice.rotation})`}
          fill={slice.color}
          stroke={slice.focused ? '#000' : '#fff'}
          stroke-width={slice.focused ? 3 : 1}
          on:click={() => onSliceClick(slice.trackId, slice.level)}
          on:keydown={(e) => onSliceKey(e, slice.trackId, slice.level)}
          role="button"
          aria-label={`Set ${slice.trackId} to milestone ${slice.level}`}
          tabindex="0"
        />
      {/each}
    </g>
  </svg>
{/if}

<style>
  .chart {
    display: block;
  }
  path {
    cursor: pointer;
    transition: fill 120ms ease;
  }
  path:hover {
    stroke: #000;
  }
</style>
