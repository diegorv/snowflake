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
    line-height: 1.3;
    overflow-wrap: break-word;
  }
  .value {
    font-size: 26px;
    font-weight: 600;
    margin-top: 4px;
    line-height: 1.1;
    overflow-wrap: break-word;
  }
  @media (max-width: 480px) {
    .summary {
      gap: 6px;
    }
    .cell {
      padding: 8px 4px;
    }
    .value {
      font-size: 20px;
    }
    .label {
      font-size: 10px;
      letter-spacing: -0.01em;
    }
  }
</style>
