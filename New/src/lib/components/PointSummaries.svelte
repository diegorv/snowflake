<script lang="ts">
  import {
    currentLevelStore,
    pointsToNextLevelStore,
    totalPointsStore
  } from '$lib/stores/derived.js';
</script>

<div class="summary">
  <div class="cell">
    <div class="label">Current level</div>
    <div class="value">{$currentLevelStore || '—'}</div>
  </div>
  <div class="cell">
    <div class="label">Total points</div>
    <div class="value">{$totalPointsStore}</div>
  </div>
  <div class="cell">
    <div class="label">Points to next level</div>
    <div class="value">{$pointsToNextLevelStore}</div>
  </div>
</div>

<style>
  .summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 16px;
  }
  .cell {
    border: 1px solid #eee;
    border-radius: 4px;
    padding: 10px;
    text-align: center;
    background: #fafafa;
  }
  .label {
    font-size: 12px;
    color: #666;
  }
  .value {
    font-size: 26px;
    font-weight: 600;
    margin-top: 4px;
  }
  @media (max-width: 480px) {
    .summary {
      gap: 6px;
    }
    .cell {
      padding: 8px 6px;
    }
    .value {
      font-size: 22px;
    }
    .label {
      font-size: 11px;
    }
  }
</style>
