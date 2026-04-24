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

  import { get } from 'svelte/store';
  import { base } from '$app/paths';
  import { loadManifest } from '$lib/frameworks/manifest.js';
  import { loadFramework } from '$lib/frameworks/loader.js';
  import { frameworkManifest, currentFramework } from '$lib/stores/framework.js';
  import { selectFramework } from '$lib/stores/actions.js';
  import { name, title } from '$lib/stores/identity.js';
  import { milestones } from '$lib/stores/milestones.js';
  import { eligibleTitlesStore } from '$lib/stores/derived.js';
  import { readInitialHash, readHashOnce, startHashSync } from '$lib/stores/hashSync.js';

  let loading = true;
  let error = '';
  let unsubscribe: (() => void) | null = null;
  let unsubscribeTitle: (() => void) | null = null;

  onMount(() => {
    (async () => {
      try {
        const rawManifest = await loadManifest(fetch, `${base}/frameworks/index.json`);
        const manifest = rawManifest.map((entry) => ({
          ...entry,
          path: entry.path.startsWith('http')
            ? entry.path
            : `${base}${entry.path.startsWith('/') ? '' : '/'}${entry.path}`
        }));
        frameworkManifest.set(manifest);

        // Preload every manifest entry so hash decoding can find the referenced framework
        // synchronously. Presets are small and there aren't many of them.
        await Promise.all(manifest.map((entry) => loadFramework(entry).catch(() => null)));

        const decoded = readHashOnce(readInitialHash());
        if (decoded) {
          name.set(decoded.name);
          title.set(decoded.title);
          await selectFramework(decoded.frameworkId, decoded.milestones);
          // selectFramework overwrites title. If the hash's title is still eligible,
          // restore it; otherwise leave whatever selectFramework picked.
          if (decoded.title) title.set(decoded.title);
        } else {
          await selectFramework(manifest[0].id);
        }

        unsubscribe = startHashSync();

        // Auto-snap title whenever the eligible list changes (e.g. user adjusts
        // milestones and the current title is no longer valid for their points).
        unsubscribeTitle = eligibleTitlesStore.subscribe((eligible) => {
          if (eligible.length === 0) return;
          const current = get(title);
          if (!eligible.includes(current)) {
            title.set(eligible[0]);
          }
        });
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      } finally {
        loading = false;
      }
    })();

    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribeTitle) unsubscribeTitle();
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

  @media (max-width: 800px) {
    .layout {
      grid-template-columns: minmax(0, 1fr);
      gap: 16px;
    }
  }
</style>
