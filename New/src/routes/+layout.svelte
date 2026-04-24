<script lang="ts">
  import Wordmark from '$lib/components/Wordmark.svelte';
</script>

<div class="chrome">
  <header>
    <Wordmark />
  </header>
  <main>
    <slot />
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: Helvetica, Arial, sans-serif;
    color: #111;
    background: #fff;
    -webkit-tap-highlight-color: transparent;
  }
  :global(*) {
    box-sizing: border-box;
  }
  :global(button) {
    font-family: inherit;
  }
  .chrome {
    max-width: 960px;
    margin: 0 auto;
    padding: 24px 16px 64px;
  }
  header {
    margin-bottom: 16px;
  }
  @media (max-width: 480px) {
    .chrome {
      padding: 16px 12px 48px;
    }
  }
</style>
