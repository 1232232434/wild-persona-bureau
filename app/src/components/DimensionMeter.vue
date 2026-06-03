<script setup lang="ts">
defineProps<{
  label: string
  low: string
  high: string
  value: number
}>()
</script>

<template>
  <div class="dimension-meter">
    <div class="dimension-meter__top">
      <strong>{{ label }}</strong>
      <span>{{ value }} / 100</span>
    </div>
    <div class="dimension-meter__rail">
      <div class="dimension-meter__fill" :style="{ width: `${value}%` }"></div>
    </div>
    <div class="dimension-meter__labels">
      <small>{{ low }}</small>
      <small>{{ high }}</small>
    </div>
  </div>
</template>

<style scoped>
.dimension-meter {
  display: grid;
  gap: 8px;
}

.dimension-meter__top,
.dimension-meter__labels {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.dimension-meter__top strong,
.dimension-meter__top span {
  font-size: 0.98rem;
}

.dimension-meter__top span,
.dimension-meter__labels small {
  color: var(--muted);
}

.dimension-meter__rail {
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--line);
}

.dimension-meter__fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--accent-2), var(--accent));
}
</style>
