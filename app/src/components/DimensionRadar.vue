<script setup lang="ts">
import { computed } from 'vue'

import type { DimensionKey } from '../types/quiz'

interface RadarItem {
  key: DimensionKey
  label: string
  value: number
}

const props = defineProps<{
  items: RadarItem[]
}>()

const chartWidth = 540
const chartHeight = 460
const centerX = chartWidth / 2
const centerY = 224
const chartRadius = 148
const labelRadius = 194
const gridLevels = [20, 40, 60, 80, 100]

const pointAt = (index: number, radius: number, value = 100) => {
  const angle = ((index * 72 - 90) * Math.PI) / 180
  const normalizedValue = Math.max(0, Math.min(value, 100)) / 100
  const actualRadius = radius * normalizedValue

  return {
    x: centerX + Math.cos(angle) * actualRadius,
    y: centerY + Math.sin(angle) * actualRadius,
  }
}

const axisData = computed(() =>
  props.items.map((item, index) => {
    const labelPoint = pointAt(index, labelRadius)
    const labelAnchor = labelPoint.x < centerX - 10 ? 'end' : labelPoint.x > centerX + 10 ? 'start' : 'middle'

    return {
      ...item,
      axisPoint: pointAt(index, chartRadius),
      dataPoint: pointAt(index, chartRadius, item.value),
      labelPoint,
      labelAnchor,
    }
  }),
)

const gridPolygons = computed(() =>
  gridLevels.map((level) =>
    props.items
      .map((_, index) => {
        const point = pointAt(index, chartRadius, level)
        return `${point.x},${point.y}`
      })
      .join(' '),
  ),
)

const dataPolygon = computed(() => axisData.value.map((item) => `${item.dataPoint.x},${item.dataPoint.y}`).join(' '))
const ariaLabel = computed(() => `五维雷达图：${props.items.map((item) => `${item.label}${item.value}分`).join('，')}`)
</script>

<template>
  <div class="dimension-radar">
    <div class="dimension-radar__heading">
      <div>
        <div class="muted-label">五维雷达图</div>
        <h3>你的分数形状</h3>
      </div>
      <span class="dimension-radar__hint">越靠外，分数越高</span>
    </div>

    <svg
      class="dimension-radar__chart"
      :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
      role="img"
      :aria-label="ariaLabel"
    >
      <polygon
        v-for="(points, index) in gridPolygons"
        :key="`grid-${gridLevels[index]}`"
        class="dimension-radar__grid"
        :points="points"
      />

      <line
        v-for="item in axisData"
        :key="`axis-${item.key}`"
        class="dimension-radar__axis"
        :x1="centerX"
        :y1="centerY"
        :x2="item.axisPoint.x"
        :y2="item.axisPoint.y"
      />

      <polygon class="dimension-radar__area" :points="dataPolygon" />

      <circle
        v-for="item in axisData"
        :key="`point-${item.key}`"
        class="dimension-radar__point"
        :cx="item.dataPoint.x"
        :cy="item.dataPoint.y"
        r="6"
      />

      <g v-for="item in axisData" :key="`label-${item.key}`">
        <text
          class="dimension-radar__label"
          :x="item.labelPoint.x"
          :y="item.labelPoint.y"
          :text-anchor="item.labelAnchor"
        >
          {{ item.label }}
        </text>
        <text
          class="dimension-radar__score"
          :x="item.labelPoint.x"
          :y="item.labelPoint.y + 24"
          :text-anchor="item.labelAnchor"
        >
          {{ item.value }} 分
        </text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.dimension-radar {
  margin-top: 18px;
  padding: 18px 18px 8px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--line);
  background:
    radial-gradient(circle at 50% 42%, rgba(124, 166, 149, 0.1), transparent 42%),
    rgba(255, 255, 255, 0.025);
}

.dimension-radar__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.dimension-radar__heading h3 {
  margin: 8px 0 0;
  font-size: clamp(1.45rem, 2.4vw, 2rem);
}

.dimension-radar__hint {
  flex: 0 0 auto;
  padding: 8px 11px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  font-size: 0.8rem;
}

.dimension-radar__chart {
  display: block;
  width: min(100%, 540px);
  height: auto;
  margin: 4px auto 0;
  overflow: visible;
}

.dimension-radar__grid {
  fill: rgba(255, 255, 255, 0.012);
  stroke: rgba(217, 197, 148, 0.2);
  stroke-width: 1;
}

.dimension-radar__axis {
  stroke: rgba(217, 197, 148, 0.18);
  stroke-width: 1;
}

.dimension-radar__area {
  fill: rgba(214, 191, 134, 0.24);
  stroke: var(--accent);
  stroke-width: 3;
  stroke-linejoin: round;
  filter: drop-shadow(0 8px 16px rgba(214, 191, 134, 0.12));
}

.dimension-radar__point {
  fill: var(--accent);
  stroke: var(--bg-1);
  stroke-width: 3;
}

.dimension-radar__label {
  fill: var(--text);
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 800;
}

.dimension-radar__score {
  fill: var(--accent);
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 640px) {
  .dimension-radar {
    padding: 16px 8px 4px;
  }

  .dimension-radar__heading {
    display: grid;
  }

  .dimension-radar__hint {
    width: fit-content;
  }
}
</style>
