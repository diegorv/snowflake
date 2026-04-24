<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { focusedTrackId, shiftFocus } from '$lib/stores/focus.js';
  import { shiftMilestone } from '$lib/stores/milestones.js';

  function onKeyDown(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

    switch (event.key) {
      case 'ArrowUp':
        shiftMilestone(get(focusedTrackId), +1);
        event.preventDefault();
        return;
      case 'ArrowDown':
        shiftMilestone(get(focusedTrackId), -1);
        event.preventDefault();
        return;
      case 'ArrowRight':
        shiftFocus(+1);
        event.preventDefault();
        return;
      case 'ArrowLeft':
        shiftFocus(-1);
        event.preventDefault();
        return;
    }
  }

  onMount(() => {
    window.addEventListener('keydown', onKeyDown);
  });

  onDestroy(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', onKeyDown);
    }
  });
</script>
