<script lang="ts">
  import { title } from '$lib/stores/identity.js';
  import { eligibleTitlesStore } from '$lib/stores/derived.js';
</script>

<label>
  Title
  <select bind:value={$title}>
    {#each $eligibleTitlesStore as option (option)}
      <option value={option}>{option}</option>
    {/each}
  </select>
</label>

<style>
  label {
    display: flex;
    flex-direction: column;
    font-size: 12px;
    color: #555;
    gap: 4px;
  }
  select {
    font-size: 18px;
    padding: 4px 6px;
  }
</style>
