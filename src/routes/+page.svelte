<script lang="ts">
  import { onMount } from 'svelte';
  import DeprecationNotice from '$lib/components/DeprecationNotice.svelte';
  import FrameworkPicker from '$lib/components/FrameworkPicker.svelte';
  import NameInput from '$lib/components/NameInput.svelte';
  import TitleSelector from '$lib/components/TitleSelector.svelte';
  import PointSummaries from '$lib/components/PointSummaries.svelte';
  import LevelThermometer from '$lib/components/LevelThermometer.svelte';
  import NightingaleChart from '$lib/components/NightingaleChart.svelte';
  import TrackSelector from '$lib/components/TrackSelector.svelte';
  import Track from '$lib/components/Track.svelte';
  import KeyboardListener from '$lib/components/KeyboardListener.svelte';
  import ResetButton from '$lib/components/ResetButton.svelte';

  import { base } from '$app/paths';
  import { currentFramework } from '$lib/stores/framework.js';
  import { bootApp } from '$lib/stores/boot.js';

  let loading = true;
  let error = '';
  let warning = '';
  let teardown: (() => void) | null = null;

  onMount(() => {
    (async () => {
      try {
        const result = await bootApp({ fetch, base });
        teardown = result.teardown;
        if (result.failedIds.length > 0) {
          warning = `Some frameworks failed to load: ${result.failedIds.join(
            ', '
          )}. They won't appear in the picker.`;
        }
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      } finally {
        loading = false;
      }
    })();

    return () => {
      if (teardown) teardown();
    };
  });
</script>

<DeprecationNotice />

{#if loading}
  <p>Loading framework…</p>
{:else if error}
  <div class="error" role="alert">
    <strong>Failed to load framework:</strong>
    <pre>{error}</pre>
  </div>
{:else if $currentFramework}
  {#if warning}
    <div class="warning" role="status">{warning}</div>
  {/if}
  <div class="top">
    <FrameworkPicker />
    <ResetButton />
  </div>
  <div class="layout">
    <div class="left">
      <NameInput />
      <TitleSelector />
      <PointSummaries />
      <LevelThermometer />
    </div>
    <div class="right">
      <NightingaleChart />
    </div>
  </div>
  <TrackSelector />
  <Track />
  <KeyboardListener />
{/if}

<style>
  .top {
    margin-bottom: 12px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(300px, 420px);
    gap: 24px;
    align-items: start;
  }
  .left {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }
  .right {
    min-width: 0;
  }
  .error {
    background: #fff3f3;
    border: 1px solid #e88;
    padding: 12px;
    border-radius: 4px;
  }
  .error pre {
    white-space: pre-wrap;
    font-family: monospace;
    font-size: 13px;
  }
  .warning {
    background: #fff8dc;
    border: 1px solid #e0c060;
    padding: 10px 12px;
    border-radius: 4px;
    font-size: 13px;
    margin-bottom: 12px;
  }

  @media (max-width: 800px) {
    .layout {
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
    }
  }
</style>
