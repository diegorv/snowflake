<script lang="ts">
  import { currentFramework } from '$lib/stores/framework.js';
  import {
    categoryColorMapStore,
    categoryPointsStore,
    currentLevelStore,
    maxPointsStore,
    totalPointsStore
  } from '$lib/stores/derived.js';

  $: segments = (() => {
    const out: {
      categoryId: string;
      points: number;
      color: string;
      label: string;
      fraction: number;
    }[] = [];
    const categories = $currentFramework?.categories ?? [];
    const max = $maxPointsStore || 1;
    for (const { categoryId, points } of $categoryPointsStore) {
      if (points === 0) continue;
      out.push({
        categoryId,
        points,
        color: $categoryColorMapStore.get(categoryId) ?? '#ccc',
        label: categories.find((c) => c.id === categoryId)?.label ?? categoryId,
        fraction: points / max
      });
    }
    return out;
  })();

  $: remaining = Math.max(0, ($maxPointsStore || 0) - ($totalPointsStore || 0));
</script>

<div class="thermometer">
  <div
    class="bar"
    role="progressbar"
    aria-label="Level progress"
    aria-valuemin="0"
    aria-valuemax={$maxPointsStore || 0}
    aria-valuenow={$totalPointsStore || 0}
    aria-valuetext={`${$totalPointsStore} of ${$maxPointsStore} points, level ${$currentLevelStore || '—'}`}
  >
    {#each segments as seg (seg.categoryId)}
      <div
        class="segment"
        style:flex-grow={seg.points}
        style:background={seg.color}
        title={`${seg.label}: ${seg.points} pts`}
      >
        <span class="seg-label">{seg.points}</span>
      </div>
    {/each}
    {#if remaining > 0}
      <div class="segment rest" style:flex-grow={remaining} aria-hidden="true"></div>
    {/if}
  </div>
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
    display: flex;
    width: 100%;
    height: 36px;
    border-radius: 8px;
    overflow: hidden;
    background: #f1f1f1;
  }
  .segment {
    flex-basis: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    overflow: hidden;
  }
  .segment.rest {
    background: transparent;
  }
  .seg-label {
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.25);
    white-space: nowrap;
  }
  /* hide point label when the segment is narrower than ~28px of render space */
  .segment {
    container-type: inline-size;
  }
  @container (max-width: 24px) {
    .seg-label {
      display: none;
    }
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
