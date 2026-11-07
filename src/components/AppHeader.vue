<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useLocation } from '../composables/useLocation'
import AppIcon from './Appicon.vue'

const { coords } = useLocation()
</script>

<template>
  <header class="app-header">
    <div class="bar">
      <RouterLink to="/" class="wordmark" aria-label="HargaPangan, ke beranda"
        >HargaPangan</RouterLink
      >

      <!-- city is fixed; without a location the chip leads to the district picker on Peta -->
      <span v-if="coords" class="chip"><AppIcon name="pin" :size="16" />Bandung</span>
      <RouterLink v-else to="/map" class="chip is-action"
        ><AppIcon name="pin" :size="16" />Pilih lokasi</RouterLink
      >
    </div>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  padding-top: env(safe-area-inset-top, 0px);
  background: var(--paper);
  border-bottom: 1px solid var(--line);
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
  height: 56px;
  max-width: var(--content-max);
  margin-inline: auto;
  padding-inline: var(--gutter);
}
.wordmark {
  font-family: var(--font-display);
  font-size: 20px;
  line-height: 28px;
  font-weight: var(--fw-semibold);
  color: var(--brand-ink);
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-4);
  min-height: var(--tap);
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  font-weight: var(--fw-semibold);
  color: var(--ink-muted);
}
.is-action {
  color: var(--brand);
}
</style>
