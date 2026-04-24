<script lang="ts">
  import { currentFramework } from '$lib/stores/framework.js';
  import { milestones, setMilestone } from '$lib/stores/milestones.js';
  import { focusedTrackId } from '$lib/stores/focus.js';
  import { categoryColorMapStore } from '$lib/stores/derived.js';
  import { maxMilestoneLevel } from '$lib/domain/scoring.js';

  $: track = $currentFramework?.tracks.find((t) => t.id === $focusedTrackId);
  $: current = track ? $milestones[track.id] ?? 0 : 0;
  $: detail = track && current > 0 ? track.milestones[current - 1] : null;
  $: color = track ? $categoryColorMapStore.get(track.categoryId) ?? '#ccc' : '#ccc';
  $: levels = $currentFramework
    ? Array.from({ length: maxMilestoneLevel($currentFramework) + 1 }, (_, i) => i).reverse()
    : [];
</script>

{#if track && $currentFramework}
  <section>
    <header>
      <h2>{track.displayName}</h2>
      <p class="description">{track.description}</p>
    </header>

    <div class="picker" role="radiogroup" aria-label="Milestone">
      {#each levels as level (level)}
        <button
          type="button"
          class="level"
          class:met={level <= current && level > 0}
          class:zero={level === 0}
          class:active={level === current}
          style:background={level <= current && level > 0 ? color : undefined}
          on:click={() => setMilestone(track.id, level)}
          aria-pressed={level === current}
        >
          {level}
        </button>
      {/each}
    </div>

    {#if detail}
      <div class="detail">
        <h3>Milestone {current}: {detail.summary}</h3>
        {#if detail.signals.length}
          <h4>Signals</h4>
          <ul>
            {#each detail.signals as s, i (i)}<li>{s}</li>{/each}
          </ul>
        {/if}
        {#if detail.examples.length}
          <h4>Examples</h4>
          <ul>
            {#each detail.examples as e, i (i)}<li>{e}</li>{/each}
          </ul>
        {/if}
      </div>
    {:else}
      <p class="empty">Not yet at milestone 1.</p>
    {/if}
  </section>
{/if}

<style>
  section {
    margin-top: 12px;
  }
  h2 {
    margin: 0;
    font-size: 24px;
  }
  .description {
    color: #555;
    margin: 4px 0 12px;
  }
  .picker {
    display: flex;
    flex-direction: row-reverse;
    justify-content: flex-end;
    gap: 6px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  .level {
    width: 44px;
    height: 44px;
    border: 2px solid #ccc;
    border-radius: 4px;
    font-size: 18px;
    font-weight: 600;
    background: #eee;
    cursor: pointer;
  }
  .level.met {
    color: #fff;
  }
  .level.zero {
    background: #f9f9f9;
  }
  .level.active {
    border-color: #000;
    border-width: 3px;
  }
  .detail h3 {
    margin-top: 0;
  }
  .detail h4 {
    margin-bottom: 4px;
  }
  .empty {
    color: #888;
    font-style: italic;
  }
</style>
