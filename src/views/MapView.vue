<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '../components/AppButton.vue'
import AppHeader from '../components/AppHeader.vue'
import AppIcon from '../components/Appicon.vue'
import EmptyState from '../components/EmptyState.vue'
import ErrorState from '../components/ErrorState.vue'
import InlineAlert from '../components/InlineAlert.vue'
import MarketMap from '../components/MarketMap.vue'
import SkeletonRow from '../components/SkeletonRow.vue'
import SourceBadge from '../components/SourceBadge.vue'
import { useFetch } from '../composables/useFetch'
import { DEFAULT_CENTER, useGeolocation } from '../composables/useGeolocation'
import { useOnline } from '../composables/useOnline'
import { districts } from '../data/districts'
import { getNearbyMarkets } from '../services/api'
import type { Market, MarketType } from '../types/api'

const online = useOnline()
const { coords, status, label, needsManualPick, ensure, request, setManual } = useGeolocation()
onMounted(ensure)

const RADIUS_OPTIONS = [1, 3, 5] as const

const radius = ref<number>(5)
const selectedTypes = ref<MarketType[]>([])
const selectedMarket = ref<Market | null>(null)
const districtIndex = ref<number | ''>('')
const sheetEl = ref<HTMLElement | null>(null)

// Each type gets a distinct icon (the map markers must use the same shape/color mapping)
type MarketIcon = 'market-traditional' | 'market-cheap' | 'market-store' | 'market-supermarket'

const marketTypes: { label: string; value: MarketType; icon: MarketIcon }[] = [
  { label: 'Pasar Tradisional', value: 'TRADITIONAL', icon: 'market-traditional' },
  { label: 'Pasar Murah', value: 'CHEAP_MARKET', icon: 'market-cheap' },
  { label: 'Toko', value: 'STORE', icon: 'market-store' },
  { label: 'Supermarket', value: 'SUPERMARKET', icon: 'market-supermarket' },
]
const typeMeta = Object.fromEntries(marketTypes.map((t) => [t.value, t])) as Record<
  MarketType,
  (typeof marketTypes)[number]
>

// Keep the picker visible after a district is chosen so it can be changed again
const showPicker = computed(() => needsManualPick.value || status.value === 'manual')
const origin = computed(() => coords.value ?? DEFAULT_CENTER)
const geoPending = computed(() => status.value === 'idle' || status.value === 'loading')

// Refetches automatically when location, location status, radius or type filter changes
const {
  data,
  loading,
  error: errorMessage,
  reload,
} = useFetch(
  async (): Promise<Market[]> => {
    if (geoPending.value) return [] // wait for the location result before calling the API
    return getNearbyMarkets({
      lat: origin.value.lat,
      lon: origin.value.lon,
      radius: radius.value,
      limit: 20,
      ...(selectedTypes.value.length ? { type: [...selectedTypes.value] } : {}),
    })
  },
  { watch: [coords, status, radius, selectedTypes] }
)

const markets = computed(() => data.value ?? [])
const boardLoading = computed(() => geoPending.value || (loading.value && !data.value))

// Close the detail card whenever a new result set arrives
watch(data, () => {
  selectedMarket.value = null
})

const locationMessage = computed(() => {
  switch (status.value) {
    case 'granted':
      return 'Menampilkan pasar di sekitar lokasimu.'
    case 'manual':
      return `Menampilkan pasar di sekitar ${label.value}.`
    case 'denied':
      return 'Izin lokasi ditolak. Menampilkan pasar di pusat kota Bandung. Pilih kecamatanmu di bawah.'
    case 'unavailable':
      return 'Lokasi tidak tersedia. Menampilkan pasar di pusat kota Bandung. Pilih kecamatanmu di bawah.'
    default:
      return 'Sedang mendeteksi lokasi...'
  }
})
const locationIsProblem = computed(
  () => status.value === 'denied' || status.value === 'unavailable'
)

function pickDistrict() {
  if (districtIndex.value === '') return
  const d = districts[districtIndex.value]
  setManual({ lat: d.lat, lon: d.lon }, d.name)
}

function toggleType(type: MarketType) {
  selectedTypes.value = selectedTypes.value.includes(type)
    ? selectedTypes.value.filter((item) => item !== type)
    : [...selectedTypes.value, type]
}

const filtersActive = computed(() => radius.value !== 5 || selectedTypes.value.length > 0)

function resetFilters() {
  radius.value = 5
  selectedTypes.value = []
}

async function selectMarket(market: Market) {
  selectedMarket.value = market
  await nextTick()
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  sheetEl.value?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' })
}

// ---- formatting (Indonesian) ----
const formatPrice = (price: number) => `Rp ${price.toLocaleString('id-ID')}`

function formatDistance(km: number | null | undefined) {
  if (km === null || km === undefined) return '-'
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`
}

function openStatus(m: Market) {
  if (m.isOpenNow === null || m.isOpenNow === undefined)
    return { text: 'Jam belum diketahui', tone: 'unknown' }
  return m.isOpenNow ? { text: 'Buka', tone: 'open' } : { text: 'Tutup', tone: 'closed' }
}

// Source of a top price (nullable on the API side, so read it defensively)
const sourceOf = (item: unknown) => (item as { source?: 'PIHPS' | 'SEED' | 'CITIZEN' }).source
const selectedHasSeed = computed(
  () => selectedMarket.value?.topPrices.slice(0, 3).some((p) => sourceOf(p) === 'SEED') ?? false
)
</script>

<template>
  <div>
    <AppHeader />

    <main class="page map-page">
      <InlineAlert v-if="!online" icon="wifi-off" class="offline">
        Kamu sedang offline. Data yang tampil mungkin bukan yang terbaru.
      </InlineAlert>

      <!-- title -->
      <section class="intro" aria-labelledby="map-title">
        <p class="eyebrow">Jelajahi sekitarmu</p>
        <h1 id="map-title" class="title">Pasar terdekat</h1>
      </section>

      <!-- location status + manual district picker -->
      <div class="notice" :class="{ problem: locationIsProblem }" role="status">
        <div class="notice-line">
          <AppIcon name="pin" :size="20" class="notice-icon" />
          <p class="notice-text">{{ locationMessage }}</p>
        </div>
        <div v-if="showPicker || locationIsProblem" class="notice-actions">
          <label for="district" class="sr-only">Pilih kecamatan</label>
          <select
            v-if="districts.length"
            id="district"
            v-model="districtIndex"
            class="select"
            @change="pickDistrict"
          >
            <option value="" disabled>Pilih kecamatan</option>
            <option v-for="(d, i) in districts" :key="d.name" :value="i">{{ d.name }}</option>
          </select>
          <AppButton variant="secondary" @click="request">Pakai lokasiku</AppButton>
        </div>
      </div>

      <!-- filters -->
      <section class="filters" aria-label="Filter pencarian">
        <div class="chips" role="group" aria-label="Jenis pasar">
          <button
            v-for="option in marketTypes"
            :key="option.value"
            type="button"
            class="chip"
            :class="{ active: selectedTypes.includes(option.value) }"
            :aria-pressed="selectedTypes.includes(option.value)"
            @click="toggleType(option.value)"
          >
            <AppIcon :name="option.icon" :size="18" />
            {{ option.label }}
          </button>
        </div>

        <div class="filters-row">
          <div class="segmented" role="radiogroup" aria-label="Jarak pencarian">
            <button
              v-for="km in RADIUS_OPTIONS"
              :key="km"
              type="button"
              role="radio"
              class="seg"
              :class="{ active: radius === km }"
              :aria-checked="radius === km"
              @click="radius = km"
            >
              {{ km }} km
            </button>
          </div>
          <button type="button" class="ghost" :disabled="!filtersActive" @click="resetFilters">
            Reset
          </button>
        </div>
      </section>

      <!-- map: roughly the top half of the viewport -->
      <div class="map-frame">
        <div v-if="boardLoading" class="map-skeleton" aria-busy="true" aria-label="Memuat peta" />
        <MarketMap
          v-else
          :markets="markets"
          :selected-id="selectedMarket?.id ?? null"
          :center="origin"
          :show-user="status === 'granted' || status === 'manual'"
          @select="selectMarket"
        />
      </div>

      <!-- bottom sheet -->
      <section ref="sheetEl" class="sheet" aria-labelledby="sheet-title">
        <span class="sheet-handle" aria-hidden="true" />

        <div class="section-head">
          <h2 id="sheet-title" class="section-title">Daftar pasar</h2>
          <p v-if="!boardLoading && !errorMessage" class="count" aria-live="polite">
            {{ markets.length }} lokasi
          </p>
        </div>

        <!-- detail card of the selected market -->
        <Transition name="slide">
          <article v-if="selectedMarket" class="detail" aria-label="Pasar dipilih">
            <div class="detail-head">
              <div class="detail-title">
                <p class="eyebrow">{{ typeMeta[selectedMarket.type].label }}</p>
                <h3 class="detail-name">{{ selectedMarket.name }}</h3>
              </div>
              <button
                type="button"
                class="icon-button"
                aria-label="Tutup detail pasar"
                @click="selectedMarket = null"
              >
                <AppIcon name="x" :size="20" />
              </button>
            </div>

            <p class="detail-address">{{ selectedMarket.address }}</p>

            <ul class="meta">
              <li class="meta-item">{{ formatDistance(selectedMarket.distanceKm) }}</li>
              <li class="meta-item" :class="`status-${openStatus(selectedMarket).tone}`">
                {{ openStatus(selectedMarket).text }}
              </li>
              <li v-if="selectedMarket.openHours" class="meta-item">
                {{ selectedMarket.openHours }}
              </li>
            </ul>

            <div v-if="selectedMarket.topPrices.length" class="prices">
              <h4 class="prices-title">Harga unggulan</h4>
              <ul>
                <li
                  v-for="item in selectedMarket.topPrices.slice(0, 3)"
                  :key="item.commodityId"
                  class="price-row"
                >
                  <div class="price-name">
                    <span class="price-label">{{ item.name }}</span>
                    <span class="price-unit">per {{ item.unit }}</span>
                    <SourceBadge v-if="sourceOf(item)" :source="sourceOf(item)!" />
                  </div>
                  <strong class="price">{{ formatPrice(item.price) }}</strong>
                </li>
              </ul>
              <p v-if="selectedHasSeed" class="footnote">
                Harga berlabel Estimasi adalah perkiraan dari harga acuan kota, bukan harga yang
                dicek langsung di lokasi.
              </p>
            </div>

            <RouterLink :to="`/market/${selectedMarket.id}`" class="detail-link">
              Lihat detail pasar<AppIcon name="chevron-right" :size="18" />
            </RouterLink>
          </article>
        </Transition>

        <!-- states: loading / error / empty / list -->
        <div v-if="boardLoading" class="board" aria-busy="true" aria-label="Memuat pasar terdekat">
          <SkeletonRow v-for="n in 4" :key="n" variant="market" />
        </div>

        <ErrorState
          v-else-if="errorMessage"
          title="Belum berhasil memuat data"
          :message="String(errorMessage)"
          @retry="reload"
        />

        <EmptyState
          v-else-if="markets.length === 0"
          title="Belum ada pasar ditemukan"
          text="Coba ubah jenis pasar atau perluas jarak pencarian."
        >
          <AppButton v-if="filtersActive" @click="resetFilters">Reset filter</AppButton>
        </EmptyState>

        <ul v-else class="board">
          <li v-for="m in markets" :key="m.id" class="board-item">
            <button
              type="button"
              class="row"
              :class="{ selected: selectedMarket?.id === m.id }"
              :aria-pressed="selectedMarket?.id === m.id"
              @click="selectMarket(m)"
            >
              <span class="row-icon" aria-hidden="true">
                <AppIcon :name="typeMeta[m.type].icon" :size="22" />
              </span>
              <span class="row-body">
                <span class="row-name">{{ m.name }}</span>
                <span class="row-meta">
                  {{ typeMeta[m.type].label }} · {{ formatDistance(m.distanceKm) }}
                </span>
              </span>
              <span class="status" :class="`status-${openStatus(m).tone}`">
                {{ openStatus(m).text }}
              </span>
              <AppIcon name="chevron-right" :size="20" class="row-chevron" />
            </button>
          </li>
        </ul>
      </section>
    </main>
  </div>
</template>

<style scoped>
.offline {
  margin-top: var(--space-12);
}

/* intro */
.intro {
  padding: var(--space-24) 0 var(--space-12);
}
.eyebrow {
  font-size: var(--fs-micro);
  line-height: var(--lh-micro);
  font-weight: var(--fw-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--ink-muted);
}
.title {
  margin-top: var(--space-4);
  font-size: var(--fs-title);
  line-height: var(--lh-title);
  font-weight: var(--fw-bold);
  letter-spacing: -0.01em;
}

/* location notice */
.notice {
  display: grid;
  gap: var(--space-12);
  padding: var(--space-12) var(--space-16);
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}
.notice.problem {
  border-color: var(--line-strong);
}
.notice-line {
  display: flex;
  align-items: flex-start;
  gap: var(--space-8);
}
.notice-icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--brand);
}
.notice-text {
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  color: var(--ink-muted);
}
.notice-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-8);
}
.select {
  flex: 1;
  min-width: 160px;
  height: 48px;
  padding: 0 var(--space-12);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-card);
  background: var(--surface);
  color: var(--ink);
  font: inherit;
  font-size: 16px; /* 16px stops iOS zooming on focus */
}

/* filters */
.filters {
  display: grid;
  gap: var(--space-12);
  margin-top: var(--space-16);
}
.chips {
  display: flex;
  gap: var(--space-8);
  margin-inline: calc(var(--space-16) * -1);
  padding-inline: var(--space-16);
  overflow-x: auto;
  scrollbar-width: none;
}
.chips::-webkit-scrollbar {
  display: none;
}
.chip {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: var(--space-8);
  min-height: var(--tap);
  padding: 0 var(--space-16);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-pill, 999px);
  background: var(--surface);
  color: var(--ink);
  font: inherit;
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out);
}
.chip.active {
  border-color: var(--brand);
  background: var(--brand-tint);
  color: var(--brand-ink);
  box-shadow: inset 0 0 0 1px var(--brand); /* thicker border, so the state is not color-only */
}
.filters-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
}
.segmented {
  display: inline-flex;
  padding: 2px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-card);
  background: var(--surface);
}
.seg {
  min-width: 64px;
  min-height: 40px;
  padding: 0 var(--space-12);
  border: 0;
  border-radius: calc(var(--radius-card) - 2px);
  background: transparent;
  color: var(--ink-muted);
  font: inherit;
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out);
}
.seg.active {
  background: var(--brand);
  color: var(--surface);
}
.ghost {
  min-height: var(--tap);
  padding: 0 var(--space-12);
  border: 0;
  background: transparent;
  color: var(--brand);
  font: inherit;
  font-size: var(--fs-caption);
  font-weight: var(--fw-semibold);
  cursor: pointer;
}
.ghost:disabled {
  color: var(--ink-muted);
  cursor: default;
  opacity: 0.6;
}

/* map: about half of the viewport, full-bleed */
.map-frame {
  height: clamp(260px, 46vh, 480px);
  margin: var(--space-16) calc(var(--space-16) * -1) 0;
  background: var(--skeleton-base);
}
.map-frame > :deep(*) {
  width: 100%;
  height: 100%;
}
.map-skeleton {
  width: 100%;
  height: 100%;
  background: var(--skeleton-base);
}

/* bottom sheet: the only place that uses the soft shadow, together with the bottom nav */
.sheet {
  position: relative;
  z-index: var(--z-sheet, 10);
  margin: calc(var(--space-16) * -1) calc(var(--space-16) * -1) 0;
  padding: var(--space-8) var(--space-16) var(--space-32);
  border-radius: var(--radius-card) var(--radius-card) 0 0;
  background: var(--paper);
  box-shadow: var(--shadow-sheet);
}
.sheet-handle {
  display: block;
  width: 40px;
  height: 4px;
  margin: 0 auto var(--space-4);
  border-radius: var(--radius-pill, 999px);
  background: var(--line-strong);
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
  min-height: var(--tap);
}
.section-title {
  font-size: var(--fs-heading);
  line-height: var(--lh-heading);
  font-weight: var(--fw-bold);
}
.count {
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  font-weight: var(--fw-semibold);
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
}

/* selected market detail */
.detail {
  margin: var(--space-4) 0 var(--space-16);
  padding: var(--space-16);
  border: 1px solid var(--brand);
  border-radius: var(--radius-card);
  background: var(--surface);
}
.detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-12);
}
.detail-title {
  min-width: 0;
}
.detail-name {
  margin-top: var(--space-4);
  font-size: var(--fs-heading);
  line-height: var(--lh-heading);
  font-weight: var(--fw-bold);
  overflow-wrap: anywhere;
}
.icon-button {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: var(--tap);
  height: var(--tap);
  margin: calc(var(--space-8) * -1) calc(var(--space-8) * -1) 0 0;
  border: 0;
  background: transparent;
  color: var(--ink-muted);
  cursor: pointer;
}
.detail-address {
  margin-top: var(--space-8);
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  color: var(--ink-muted);
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
  margin-top: var(--space-12);
}
.meta-item {
  padding: var(--space-4) var(--space-12);
  border: 1px solid var(--line);
  border-radius: var(--radius-pill, 999px);
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  font-variant-numeric: tabular-nums;
}
.prices {
  margin-top: var(--space-16);
}
.prices-title {
  padding-bottom: var(--space-8);
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  font-weight: var(--fw-bold);
}
.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-12);
  padding: var(--space-12) 0;
  border-top: 1px solid var(--line);
}
.price-name {
  display: grid;
  min-width: 0;
  gap: 2px;
  justify-items: start;
}
.price-label {
  max-width: 100%;
  overflow: hidden;
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  font-weight: var(--fw-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.price-unit {
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  color: var(--ink-muted);
}
.price {
  flex-shrink: 0;
  font-size: var(--fs-heading);
  line-height: var(--lh-heading);
  font-weight: var(--fw-bold);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.footnote {
  margin-top: var(--space-8);
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  color: var(--ink-muted);
}
.detail-link {
  display: inline-flex;
  align-items: center;
  min-height: var(--tap);
  margin-top: var(--space-8);
  font-size: var(--fs-body);
  font-weight: var(--fw-semibold);
  color: var(--brand);
}

/* ruled list: hairlines, two columns from 640px up */
.board {
  border-top: 1px solid var(--line);
}
.board-item {
  border-bottom: 1px solid var(--line);
}
.row {
  display: flex;
  width: 100%;
  min-height: 64px;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-12) 0;
  border: 0;
  background: transparent;
  color: var(--ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.row.selected {
  background: var(--brand-tint);
  box-shadow:
    -16px 0 0 var(--brand-tint),
    16px 0 0 var(--brand-tint);
}
.row-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  color: var(--brand);
}
.row-body {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 2px;
}
.row-name {
  overflow: hidden;
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  font-weight: var(--fw-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row-meta {
  overflow: hidden;
  font-size: var(--fs-caption);
  line-height: var(--lh-caption);
  color: var(--ink-muted);
  font-variant-numeric: tabular-nums;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row-chevron {
  flex-shrink: 0;
  color: var(--ink-muted);
}

/* open/closed: always text, never color alone */
.status {
  flex-shrink: 0;
  padding: 2px var(--space-8);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-pill, 999px);
  font-size: var(--fs-micro);
  line-height: var(--lh-micro);
  font-weight: var(--fw-semibold);
  color: var(--ink-muted);
}
.status-open {
  border-color: var(--brand);
  background: var(--brand-tint);
  color: var(--brand-ink);
}
.meta-item.status-open {
  font-weight: var(--fw-semibold);
}

/* sheet slide: functional motion only */
.slide-enter-active,
.slide-leave-active {
  transition:
    opacity var(--dur-base, 200ms) var(--ease-out),
    transform var(--dur-base, 200ms) var(--ease-out);
}
.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
@media (prefers-reduced-motion: reduce) {
  .slide-enter-active,
  .slide-leave-active,
  .chip,
  .seg {
    transition: none;
  }
}

@media (min-width: 640px) {
  ul.board {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: var(--space-32);
    border-top: 0;
  }
  ul.board > .board-item:nth-child(-n + 2) {
    border-top: 1px solid var(--line);
  }
  .row.selected {
    box-shadow: none;
  }
}
</style>
