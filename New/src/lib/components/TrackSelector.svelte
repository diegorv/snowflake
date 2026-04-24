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
    grid-auto-columns: minmax(60px, 1fr);
    gap: 4px;
    margin: 24px 0;
    overflow-x: auto;
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
    padding: 4px 0;
    border-radius: 2px;
  }
</style>
