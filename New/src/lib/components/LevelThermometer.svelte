<script lang="ts">
  import { scaleLinear } from 'd3-scale';
  import { currentFramework } from '$lib/stores/framework.js';
  import {
    categoryColorMapStore,
    categoryPointsStore,
    currentLevelStore,
    maxPointsStore,
    totalPointsStore
  } from '$lib/stores/derived.js';

  const WIDTH = 550;
  const HEIGHT = 28;

  $: scale = scaleLinear().domain([0, $maxPointsStore || 1]).range([0, WIDTH]);

  $: segments = (() => {
    const out: {
      x: number;
      width: number;
      color: string;
      categoryId: string;
      points: number;
      label: string;
    }[] = [];
    let acc = 0;
    const categories = $currentFramework?.categories ?? [];
    for (const { categoryId, points } of $categoryPointsStore) {
      if (points === 0) continue;
      const x = scale(acc);
      const w = scale(acc + points) - x;
      out.push({
        x,
        width: w,
        color: $categoryColorMapStore.get(categoryId) ?? '#ccc',
        categoryId,
        points,
        label: categories.find((c) => c.id === categoryId)?.label ?? categoryId
      });
      acc += points;
    }
    return out;
  })();
</script>

<div class="thermometer" aria-label="Level progress">
  <svg
    viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    width="100%"
    class="bar"
    role="img"
    aria-label="Level thermometer"
    preserveAspectRatio="none"
  >
    <rect x="0" y="0" width={WIDTH} height={HEIGHT} rx="6" ry="6" fill="#f1f1f1" />
    <g clip-path="inset(0 round 6px)">
      {#each segments as seg (seg.categoryId)}
        <rect x={seg.x} y={0} width={seg.width} height={HEIGHT} fill={seg.color} />
      {/each}
    </g>
  </svg>
  <div class="progress">
    <span class="level">Level {$currentLevelStore || '—'}</span>
    <span class="points">{$totalPointsStore} / {$maxPointsStore} pts</span>
  </div>
  {#if segments.length}
    <ul class="legend">
      {#each segments as seg (seg.categoryId)}
        <li>
          <span class="swatch" style:background={seg.color}></span>
          <span class="lbl">{seg.label}</span>
          <span class="amt">{seg.points}</span>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .thermometer {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .bar {
    display: block;
    height: 28px;
  }
  .progress {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: #555;
  }
  .level {
    font-weight: 600;
    color: #222;
  }
  .legend {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 14px;
    font-size: 12px;
    color: #444;
  }
  .legend li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
  .amt {
    color: #888;
  }
</style>
