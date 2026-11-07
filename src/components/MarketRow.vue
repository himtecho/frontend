<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { MarketType } from '../types/api.ts'
import { MARKET_TYPE_LABEL, formatDistance } from '../utils/format'
import AppIcon from './Appicon.vue'
import type { IconName } from './icons'

export interface MarketRowItem {
  id: number
  name: string
  type: MarketType
  address: string | null
  distanceKm: number | null
  isOpenNow: boolean | null
}

const props = defineProps<{ market: MarketRowItem }>()

const TYPE_ICON: Record<MarketType, IconName> = {
  TRADITIONAL: 'market-traditional',
  CHEAP_MARKET: 'market-cheap',
  STORE: 'market-store',
  SUPERMARKET: 'market-supermarket',
}

const status = computed(() =>
  props.market.isOpenNow === true
    ? { text: 'Buka', cls: 'is-open' }
    : props.market.isOpenNow === false
      ? { text: 'Tutup', cls: 'is-closed' }
      : { text: 'Jam belum diketahui', cls: 'is-unknown' }
)
</script>

<template>
  <RouterLink class="market-row" :to="`/market/${market.id}`">
    <span class="tile" aria-hidden="true"
      ><AppIcon :name="TYPE_ICON[market.type]" :size="22"
    /></span>

    <span class="main">
      <span class="name">{{ market.name }}</span>
      <span class="sub"
        >{{ MARKET_TYPE_LABEL[market.type] }} ·
        {{ market.address || 'Alamat belum tersedia' }}</span
      >
      <span class="chip" :class="status.cls">{{ status.text }}</span>
    </span>

    <span class="distance num">{{ formatDistance(market.distanceKm) }}</span>
  </RouterLink>
</template>

<style scoped>
.market-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: start;
  column-gap: var(--space-12);
  min-height: 64px;
  padding: var(--space-12) var(--space-8);
  margin-inline: calc(var(--space-8) * -1);
  border-radius: var(--radius-sm);
  transition: background var(--dur-fast) var(--ease-out);
}
.market-row:active {
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

.main {
  display: grid;
  gap: 2px;
  justify-items: start;
  min-width: 0;
}
.name,
.sub {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.name {
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  font-weight: var(--fw-semibold);
}
.sub {
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  color: var(--ink-muted);
}

.chip {
  margin-top: var(--space-4);
  padding: 1px var(--space-8);
  border-radius: var(--radius-pill);
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  font-weight: var(--fw-semibold);
}
.is-open {
  background: var(--brand-tint);
  color: var(--brand-ink);
}
.is-closed {
  background: var(--danger-tint);
  color: var(--danger);
}
.is-unknown {
  background: var(--neutral-tint);
  color: var(--ink-muted);
}

.distance {
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  font-weight: var(--fw-semibold);
  white-space: nowrap;
}
</style>
