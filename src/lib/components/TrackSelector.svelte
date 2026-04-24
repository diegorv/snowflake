<script lang="ts">
  import { currentFramework } from '$lib/stores/framework.js';
  import { milestones } from '$lib/stores/milestones.js';
  import { focusedTrackId } from '$lib/stores/focus.js';
  import { categoryColorMapStore } from '$lib/stores/derived.js';

  function onPick(trackId: string) {
    focusedTrackId.set(trackId);
  }
</script>

{#if $currentFramework}
  <div class="selector" role="list">
    {#each $currentFramework.tracks as track (track.id)}
      {@const focused = track.id === $focusedTrackId}
      {@const color = $categoryColorMapStore.get(track.categoryId) ?? '#ccc'}
      <button
        type="button"
        class="cell"
        class:focused
        style:border-color={focused ? '#000' : color}
        on:click={() => onPick(track.id)}
      >
        <div class="name">{track.displayName}</div>
        <div class="level" style:background={color}>
          {$milestones[track.id] ?? 0}
        </div>
      </button>
    {/each}
  </div>
{/if}

<style>
  .selector {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(72px, 1fr);
    gap: 4px;
    margin: 20px 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scroll-snap-type: x proximity;
    scroll-padding: 8px;
    padding-bottom: 4px;
  }
  .cell {
    border: 2px solid #ccc;
    border-radius: 4px;
    background: #fff;
    padding: 4px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: center;
    scroll-snap-align: start;
    min-height: 72px;
    color: #111;
    font: inherit;
    -webkit-tap-highlight-color: transparent;
  }
  .cell:focus {
    outline: none;
  }
  .cell:focus-visible {
    outline: 2px solid #000;
    outline-offset: 1px;
  }
  .cell.focused {
    border-width: 3px;
  }
  .name {
    font-size: 11px;
    line-height: 1.1;
    min-height: 24px;
  }
  .level {
    font-weight: 700;
    color: #fff;
    padding: 6px 0;
    border-radius: 2px;
    font-size: 16px;
  }
</style>
