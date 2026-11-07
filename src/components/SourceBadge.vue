<script setup lang="ts">
import { computed } from 'vue'
import type { PriceSource } from '../types/api'

const props = defineProps<{ source: PriceSource; label?: string }>()

const FALLBACK: Record<PriceSource, string> = {
  PIHPS: 'Harga acuan kota (PIHPS BI)',
  SEED: 'Estimasi',
  CITIZEN: 'Laporan warga',
}
const text = computed(() => props.label || FALLBACK[props.source])
</script>

<template>
  <span class="badge" :class="`is-${source.toLowerCase()}`">{{ text }}</span>
</template>

<style scoped>
.badge {
  display: inline-block;
  padding: 1px var(--space-8);
  border-radius: var(--radius-pill);
  font-size: var(--fs-micro);
  line-height: var(--lh-micro);
  font-weight: var(--fw-semibold);
}
.is-pihps {
  background: var(--src-pihps-tint);
  color: var(--src-pihps-ink);
}
.is-seed {
  background: var(--src-seed-tint);
  color: var(--src-seed-ink);
}
.is-citizen {
  background: var(--src-citizen-tint);
  color: var(--src-citizen-ink);
}
</style>
