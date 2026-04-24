<script lang="ts">
  import { scaleLinear } from 'd3-scale';
  import { currentFramework } from '$lib/stores/framework.js';
  import {
    categoryColorMapStore,
    categoryPointsStore,
    maxPointsStore
  } from '$lib/stores/derived.js';

  const WIDTH = 550;
  const HEIGHT = 40;
  const TOP_PAD = 44;
  const BOTTOM_PAD = 44;
  const SIDE_PAD = 28;

  $: scale = scaleLinear().domain([0, $maxPointsStore || 1]).range([0, WIDTH]);

  $: segments = (() => {
    const out: { x: number; width: number; color: string; categoryId: string }[] = [];
    let acc = 0;
    for (const { categoryId, points } of $categoryPointsStore) {
      if (points === 0) continue;
      const x = scale(acc);
      const w = scale(acc + points) - x;
      out.push({
        x,
        width: w,
        color: $categoryColorMapStore.get(categoryId) ?? '#ccc',
        categoryId
      });
      acc += points;
    }
    return out;
  })();

  $: ticks = $currentFramework
    ? $currentFramework.pointsToLevels.map((lvl) => ({
        x: scale(lvl.minPoints),
        label: lvl.label,
        minPoints: lvl.minPoints
      }))
    : [];
</script>

<svg
  viewBox={`0 0 ${WIDTH + SIDE_PAD * 2} ${HEIGHT + TOP_PAD + BOTTOM_PAD}`}
  width="100%"
  class="bar"
  role="img"
  aria-label="Level thermometer"
  preserveAspectRatio="xMidYMid meet"
>
  <g transform={`translate(${SIDE_PAD}, ${TOP_PAD})`}>
    <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#f1f1f1" rx="4" ry="4" />
    {#each segments as seg (seg.categoryId)}
      <rect x={seg.x} y={0} width={seg.width} height={HEIGHT} fill={seg.color} />
    {/each}
    <g class="ticks">
      {#each ticks as tick (tick.minPoints)}
        <line x1={tick.x} x2={tick.x} y1={0} y2={HEIGHT} stroke="#fff" stroke-width="1" />
        <text
          x={tick.x}
          y={-6}
          text-anchor="end"
          transform={`rotate(-45, ${tick.x}, -6)`}
          class="lvl"
        >
          {tick.label}
        </text>
        <text
          x={tick.x}
          y={HEIGHT + 12}
          text-anchor="end"
          transform={`rotate(-45, ${tick.x}, ${HEIGHT + 12})`}
          class="pts"
        >
          {tick.minPoints}
        </text>
      {/each}
    </g>
  </g>
</svg>

<style>
  .bar {
    display: block;
    height: auto;
  }
  text {
    font-size: 11px;
    fill: #333;
    font-family: Helvetica, Arial, sans-serif;
  }
  .lvl {
    font-weight: 500;
  }
  .pts {
    fill: #888;
  }
</style>
