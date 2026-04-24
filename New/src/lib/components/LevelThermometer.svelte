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

  $: scale = scaleLinear().domain([0, $maxPointsStore || 1]).range([0, WIDTH]);

  $: segments = (() => {
    const out: { x: number; width: number; color: string; categoryId: string }[] = [];
    let acc = 0;
    for (const { categoryId, points } of $categoryPointsStore) {
      if (points === 0) {
        acc += 0;
        continue;
      }
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

<svg viewBox={`0 0 ${WIDTH + 40} ${HEIGHT + 60}`} width="100%" role="img" aria-label="Level thermometer">
  <g transform="translate(20, 28)">
    <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#f1f1f1" rx="4" ry="4" />
    {#each segments as seg (seg.categoryId)}
      <rect x={seg.x} y={0} width={seg.width} height={HEIGHT} fill={seg.color} />
    {/each}
    <g class="ticks">
      {#each ticks as tick (tick.minPoints)}
        <line x1={tick.x} x2={tick.x} y1={0} y2={HEIGHT} stroke="#fff" stroke-width="1" />
        <text x={tick.x} y={-6} text-anchor="middle">{tick.label}</text>
        <text x={tick.x} y={HEIGHT + 14} text-anchor="middle" class="pts">{tick.minPoints}</text>
      {/each}
    </g>
  </g>
</svg>

<style>
  text {
    font-size: 10px;
    fill: #333;
    font-family: Helvetica, Arial, sans-serif;
  }
  .pts {
    fill: #888;
  }
</style>
