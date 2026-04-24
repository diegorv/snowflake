<script lang="ts">
  import { resetAll } from '$lib/stores/actions.js';

  function onClick() {
    const ok = typeof window !== 'undefined'
      ? window.confirm('Reset all milestones, name and title?')
      : true;
    if (ok) resetAll();
  }
</script>

<button type="button" class="reset" on:click={onClick} aria-label="Reset all values">
  Reset
</button>

<style>
  .reset {
    font-size: 14px;
    padding: 8px 14px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    color: #333;
    cursor: pointer;
    font-family: inherit;
    -webkit-tap-highlight-color: transparent;
  }
  .reset:hover {
    background: #f5f5f5;
    border-color: #999;
  }
  .reset:focus {
    outline: none;
  }
  .reset:focus-visible {
    outline: 2px solid #000;
    outline-offset: 1px;
  }
</style>
