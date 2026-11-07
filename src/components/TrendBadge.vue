<script setup lang="ts">
import { computed } from 'vue'
import type { PriceTrend } from '../types/api'
import { formatPercent } from '../utils/format'
import AppIcon from './Appicon.vue'
import type { IconName } from './icons'

const props = defineProps<{ trend: PriceTrend; percent: number }>()

const icon = computed<IconName>(() =>
  props.trend === 'UP' ? 'arrow-up' : props.trend === 'DOWN' ? 'arrow-down' : 'dash'
)
const text = computed(() => formatPercent(props.percent))
// Spoken version: direction is stated in words, never by color alone.
const spoken = computed(() => {
  const word = props.trend === 'UP' ? 'Naik' : props.trend === 'DOWN' ? 'Turun' : 'Stabil'
  return `${word} ${formatPercent(props.percent, false).replace('%', ' persen')}`
})
</script>

<template>
  <span class="trend" :class="`is-${trend.toLowerCase()}`">
    <AppIcon :name="icon" :size="14" />
    <span class="num" aria-hidden="true">{{ text }}</span>
    <span class="sr-only">{{ spoken }}</span>
  </span>
</template>

<style scoped>
.trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  font-weight: var(--fw-semibold);
  white-space: nowrap;
}
.is-up {
  color: var(--up);
}
.is-down {
  color: var(--down);
}
.is-stable {
  color: var(--stable);
}
</style>
