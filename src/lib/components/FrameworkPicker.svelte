<script lang="ts">
  import { frameworkManifest, currentFramework } from '$lib/stores/framework.js';
  import { selectFramework } from '$lib/stores/actions.js';

  async function onChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    await selectFramework(target.value);
  }
</script>

<label>
  Framework
  <select on:change={onChange} value={$currentFramework?.id ?? ''}>
    {#each $frameworkManifest as entry (entry.id)}
      <option value={entry.id}>{entry.label}</option>
    {/each}
  </select>
</label>

<style>
  label {
    display: inline-flex;
    flex-direction: column;
    font-size: 12px;
    color: #555;
    gap: 4px;
  }
  select {
    font-size: 16px;
    padding: 8px 10px;
    border-radius: 4px;
    min-width: 200px;
    max-width: 100%;
  }
  @media (max-width: 480px) {
    label {
      width: 100%;
    }
    select {
      min-width: 0;
      width: 100%;
    }
  }
</style>
