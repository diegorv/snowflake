<script lang="ts">
  import { currentFramework } from '$lib/stores/framework.js';
  import { milestones, setMilestone } from '$lib/stores/milestones.js';
  import { focusedTrackId } from '$lib/stores/focus.js';
  import { categoryColorMapStore } from '$lib/stores/derived.js';
  import { buildNightingaleGeometry } from '$lib/domain/nightingale.js';

  const SIZE = 420;
  const CENTER = SIZE / 2;

  $: geometry = $currentFramework
    ? buildNightingaleGeometry(
        $currentFramework,
        $milestones,
        $focusedTrackId,
        $categoryColorMapStore,
        { size: SIZE }
      )
    : null;

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

{#if geometry}
  <svg
    viewBox={`0 0 ${SIZE} ${SIZE}`}
    class="chart"
    role="group"
    aria-label="Nightingale radar"
    preserveAspectRatio="xMidYMid meet"
  >
    <g transform={`translate(${CENTER},${CENTER}) rotate(${geometry.rotationOffset})`}>
      {#each geometry.center as slice (slice.key)}
        <g
          class="slice"
          role="button"
          tabindex="0"
          aria-label={`${slice.trackName}: set to milestone 0`}
          on:click={() => onSliceClick(slice.trackId, 0)}
          on:keydown={(e) => onSliceKey(e, slice.trackId, 0)}
        >
          <title>{slice.trackName}: milestone 0</title>
          <path
            d={slice.d}
            transform={`rotate(${slice.rotation})`}
            fill={slice.color}
            stroke={slice.focused ? '#000' : '#fff'}
            stroke-width={slice.focused ? 3 : 1}
          />
        </g>
      {/each}
      {#each geometry.levels as slice (slice.key)}
        <g
          class="slice"
          role="button"
          tabindex="0"
          aria-label={`${slice.trackName}: set to milestone ${slice.level}`}
          on:click={() => onSliceClick(slice.trackId, slice.level)}
          on:keydown={(e) => onSliceKey(e, slice.trackId, slice.level)}
        >
          <title>{slice.trackName}: milestone {slice.level}</title>
          <path
            d={slice.d}
            transform={`rotate(${slice.rotation})`}
            fill={slice.color}
            stroke={slice.focused ? '#000' : '#fff'}
            stroke-width={slice.focused ? 3 : 1}
          />
        </g>
      {/each}
    </g>
  </svg>
{/if}

<style>
  .chart {
    display: block;
    width: 100%;
    max-width: 420px;
    height: auto;
    margin: 0 auto;
  }
  .slice {
    cursor: pointer;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }
  .slice path {
    transition: fill 120ms ease;
  }
  .slice:hover path {
    stroke: #000;
  }
  .slice:focus-visible path {
    stroke: #000;
    stroke-width: 3;
  }
</style>
