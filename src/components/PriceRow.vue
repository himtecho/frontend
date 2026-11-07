<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { PriceSource, PriceTrend } from '../types/api'
import { formatNumber } from '../utils/format'
import SourceBadge from './SourceBadge.vue'
import TrendBadge from './TrendBadge.vue'

export interface PriceRowItem {
  commodityId: number
  name: string
  unit: string
  iconUrl?: string | null
  price: number
  changePercent: number
  trend: PriceTrend
  source: PriceSource
  sourceLabel?: string
}

const props = withDefaults(defineProps<{ item: PriceRowItem; variant?: 'default' | 'compact' }>(), {
  variant: 'default',
})

// iconUrl is nullable and may 404: fall back to a monogram tile.
const imgFailed = ref(false)
const initial = computed(() => props.item.name.charAt(0).toUpperCase())
</script>

<template>
  <RouterLink
    class="price-row"
    :class="{ compact: variant === 'compact' }"
    :to="`/commodity/${item.commodityId}`"
  >
    <span v-if="variant !== 'compact'" class="tile" aria-hidden="true">
      <img
        v-if="item.iconUrl && !imgFailed"
        :src="item.iconUrl"
        alt=""
        width="28"
        height="28"
        loading="lazy"
        @error="imgFailed = true"
      />
      <span v-else class="mono">{{ initial }}</span>
    </span>

    <span class="main">
      <span class="name">{{ item.name }}</span>
      <span class="meta">
        <span class="unit">per {{ item.unit }}</span>
        <SourceBadge :source="item.source" :label="item.sourceLabel" />
      </span>
    </span>

    <span class="figures">
      <span class="price num"><span class="cur">Rp</span>&nbsp;{{ formatNumber(item.price) }}</span>
      <TrendBadge :trend="item.trend" :percent="item.changePercent" />
    </span>
  </RouterLink>
</template>

<style scoped>
.price-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  column-gap: var(--space-12);
  min-height: 64px;
  padding: var(--space-12) var(--space-8);
  margin-inline: calc(var(--space-8) * -1);
  border-radius: var(--radius-sm);
  transition: background var(--dur-fast) var(--ease-out);
}
.price-row.compact {
  grid-template-columns: minmax(0, 1fr) auto;
  min-height: var(--tap);
  padding-block: var(--space-8);
}
.price-row:active {
  background: var(--brand-tint);
}

.tile {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: var(--brand-tint);
  color: var(--brand-ink);
}
.tile img {
  display: block;
  object-fit: contain;
}
.mono {
  font-size: var(--fs-heading);
  line-height: 1;
  font-weight: var(--fw-bold);
}

.main {
  display: grid;
  gap: 2px;
  min-width: 0;
}
.name {
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  font-weight: var(--fw-semibold);
  overflow-wrap: anywhere;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px var(--space-8);
}
.unit {
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  color: var(--ink-muted);
}

.figures {
  display: grid;
  justify-items: end;
  gap: 2px;
}
.price {
  font-size: var(--fs-title);
  line-height: var(--lh-title);
  font-weight: var(--fw-bold);
  white-space: nowrap;
}
.compact .price {
  font-size: var(--fs-heading);
  line-height: var(--lh-heading);
}
.cur {
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  color: var(--ink-muted);
}
</style>
