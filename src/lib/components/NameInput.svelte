<script lang="ts">
  import { name } from '$lib/stores/identity.js';
</script>

<label>
  Name
  <input type="text" bind:value={$name} placeholder="Your name" />
</label>

<style>
  label {
    display: flex;
    flex-direction: column;
    font-size: 12px;
    color: #555;
    gap: 4px;
  }
  input {
    font-size: 24px;
    padding: 8px 10px;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 100%;
  }
  @media (max-width: 480px) {
    input {
      font-size: 20px;
    }
  }
</style>
