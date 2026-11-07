<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getCommodities, getCommodityMarkets, isApiError } from '../services/api'
import { formatDistance } from '../utils/datetime'
import type { Commodity, CommodityMarketItem, CommodityMarkets, MarketType } from '../types/api'

// Data saat ini mencakup Bandung, sehingga lokasi cadangan menggunakan pusat kota.
const DEFAULT_CENTER = { lat: -6.9175, lon: 107.6191 }
const RADIUS_OPTIONS = [1, 3, 5] as const

const TYPE_LABEL: Record<MarketType, string> = {
  TRADITIONAL: 'Pasar tradisional',
  CHEAP_MARKET: 'Pasar murah',
  STORE: 'Toko',
  SUPERMARKET: 'Supermarket',
}

const rupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID')

const commodities = ref<Commodity[]>([])
const selectedId = ref<number | null>(null)
const radius = ref<number>(5)
const sortBy = ref<'price' | 'distance'>('price')
const position = ref({ ...DEFAULT_CENTER })
const usingDefaultLocation = ref(true)

const result = ref<CommodityMarkets | null>(null)
const loading = ref(false)
const initializing = ref(true)
const errorMessage = ref('')
let requestId = 0

const selectedCommodity = computed(
  () => commodities.value.find((c) => c.id === selectedId.value) ?? null
)

const distOf = (item: CommodityMarketItem) => item.market.distanceKm ?? Number.POSITIVE_INFINITY

const byPrice = (a: CommodityMarketItem, b: CommodityMarketItem) =>
  a.price - b.price || distOf(a) - distOf(b)

const byDistance = (a: CommodityMarketItem, b: CommodityMarketItem) =>
  distOf(a) - distOf(b) || a.price - b.price

const items = computed(() => result.value?.items ?? [])

const sortedItems = computed(() =>
  [...items.value].sort(sortBy.value === 'price' ? byPrice : byDistance)
)

const cheapestId = computed(() => [...items.value].sort(byPrice)[0]?.market.id ?? null)

function savingText(item: CommodityMarketItem): string | null {
  const referencePrice = result.value?.reference.price

  if (referencePrice == null || referencePrice === 0) return null

  const difference = referencePrice - item.price
  if (difference === 0) return null

  const percentage = Math.round((Math.abs(difference) / referencePrice) * 100)

  return difference > 0
    ? `Hemat ${rupiah(difference)} (${percentage}%) dari harga acuan kota`
    : `${rupiah(-difference)} (${percentage}%) di atas harga acuan kota`
}

function routeUrl(item: CommodityMarketItem) {
  const { latitude, longitude, name } = item.market

  const destination =
    latitude != null && longitude != null
      ? `${latitude},${longitude}`
      : encodeURIComponent(`${name} Bandung`)

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`
}

function locate(): Promise<void> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve()

    navigator.geolocation.getCurrentPosition(
      (positionResult) => {
        position.value = {
          lat: positionResult.coords.latitude,
          lon: positionResult.coords.longitude,
        }
        usingDefaultLocation.value = false
        resolve()
      },
      () => resolve(),
      { timeout: 8000 }
    )
  })
}

async function load() {
  if (selectedId.value == null) return

  const id = ++requestId
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await getCommodityMarkets(selectedId.value, {
      lat: position.value.lat,
      lon: position.value.lon,
      radius: radius.value,
      limit: 30,
    })

    if (id === requestId) result.value = response
  } catch (error) {
    if (id === requestId) {
      errorMessage.value = isApiError(error)
        ? error.message
        : 'Gagal memuat daftar harga. Silakan coba lagi.'
    }
  } finally {
    if (id === requestId) loading.value = false
  }
}

function useCityCenter() {
  position.value = { ...DEFAULT_CENTER }
  usingDefaultLocation.value = true
  load()
}

async function init() {
  await locate()

  try {
    commodities.value = await getCommodities()
    selectedId.value = commodities.value[0]?.id ?? null
  } catch (error) {
    errorMessage.value = isApiError(error) ? error.message : 'Gagal memuat daftar bahan pokok.'
  } finally {
    initializing.value = false
  }
}

watch([selectedId, radius], load)
onMounted(init)
</script>

<template>
  <main class="cheapest-page">
    <div class="page-container">
      <header class="page-header">
        <div class="header-copy">
          <span class="eyebrow">INFORMASI HARGA PANGAN</span>
          <h1>Temukan Harga Terbaik di Sekitarmu</h1>
          <p>Bandingkan harga bahan pokok di pasar dan toko sekitar agar belanja lebih hemat.</p>
        </div>

        <div class="header-symbol" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path
              d="M8 17h32l-3 24H11L8 17Z"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linejoin="round"
            />
            <path
              d="m16 17 8-10 8 10M17 25v9M24 25v9M31 25v9"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </header>

      <section class="filter-section" aria-labelledby="commodity-heading">
        <div class="section-heading">
          <div>
            <span class="section-kicker">01 / PILIH KOMODITAS</span>
            <h2 id="commodity-heading">Apa yang ingin kamu beli?</h2>
          </div>
          <span class="section-caption">Pilih satu bahan pokok</span>
        </div>

        <div v-if="commodities.length" class="commodity-list">
          <button
            v-for="commodity in commodities"
            :key="commodity.id"
            class="commodity-chip"
            :class="{ 'is-selected': commodity.id === selectedId }"
            :aria-pressed="commodity.id === selectedId"
            @click="selectedId = commodity.id"
          >
            {{ commodity.name }}
          </button>
        </div>

        <div v-else-if="initializing" class="loading-copy">Memuat daftar bahan pokok...</div>
        <div v-else-if="!errorMessage" class="empty-copy">
          Belum ada pilihan bahan pokok yang tersedia.
        </div>
      </section>

      <section class="filter-section settings-section" aria-label="Pengaturan pencarian">
        <div class="setting-group">
          <span class="setting-label">Jarak pencarian</span>
          <div class="segmented-options">
            <button
              v-for="distance in RADIUS_OPTIONS"
              :key="distance"
              class="option-button"
              :class="{ 'is-active': distance === radius }"
              :aria-pressed="distance === radius"
              @click="radius = distance"
            >
              {{ distance }} km
            </button>
          </div>
        </div>

        <div class="setting-group">
          <span class="setting-label">Urutkan berdasarkan</span>
          <div class="segmented-options">
            <button
              class="option-button"
              :class="{ 'is-active': sortBy === 'price' }"
              :aria-pressed="sortBy === 'price'"
              @click="sortBy = 'price'"
            >
              Harga terendah
            </button>
            <button
              class="option-button"
              :class="{ 'is-active': sortBy === 'distance' }"
              :aria-pressed="sortBy === 'distance'"
              @click="sortBy = 'distance'"
            >
              Jarak terdekat
            </button>
          </div>
        </div>
      </section>

      <div v-if="usingDefaultLocation" class="location-notice">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M16 8.3c0 4.2-6 9-6 9s-6-4.8-6-9a6 6 0 1 1 12 0Z"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <circle cx="10" cy="8" r="2" stroke="currentColor" stroke-width="1.5" />
        </svg>
        <span> Menggunakan pusat Kota Bandung karena lokasi perangkat belum tersedia. </span>
      </div>

      <section v-if="result && selectedCommodity" class="reference-strip">
        <div>
          <span class="reference-label">HARGA ACUAN KOTA</span>
          <p class="reference-price">
            {{ rupiah(result.reference.price) }}
            <span>/ {{ selectedCommodity.unit }}</span>
          </p>
        </div>
        <span class="reference-source">{{ result.reference.sourceLabel }}</span>
      </section>

      <section class="results-section" aria-labelledby="results-heading">
        <div class="results-heading">
          <div>
            <span class="section-kicker">02 / HASIL PENCARIAN</span>
            <h2 id="results-heading">Pilihan pasar untukmu</h2>
          </div>

          <span v-if="!loading && result" class="result-count">
            {{ sortedItems.length }} lokasi
          </span>
        </div>

        <div v-if="initializing || loading" class="state-panel" aria-live="polite">
          <span class="loader" aria-hidden="true"></span>
          <h3>Sedang mencari harga</h3>
          <p>Kami sedang membandingkan harga di sekitar lokasimu.</p>
        </div>

        <div v-else-if="errorMessage" class="state-panel" role="alert">
          <div class="state-symbol" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M16 4 29 27H3L16 4Z"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linejoin="round"
              />
              <path
                d="M16 12v7m0 3v.5"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <h3>Belum berhasil memuat data</h3>
          <p>{{ errorMessage }}</p>
          <button class="retry-button" @click="load">Coba lagi</button>
        </div>

        <div v-else-if="result && sortedItems.length === 0" class="state-panel">
          <div class="state-symbol" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <circle cx="14" cy="14" r="9" stroke="currentColor" stroke-width="1.7" />
              <path
                d="m21 21 6 6M10 14h8"
                stroke="currentColor"
                stroke-width="1.7"
                stroke-linecap="round"
              />
            </svg>
          </div>
          <h3>Belum ada lokasi ditemukan</h3>
          <p>
            Belum ada data {{ selectedCommodity?.name ?? 'komoditas' }} dalam radius
            {{ radius }} km. Coba perluas jarak pencarian.
          </p>
          <button v-if="!usingDefaultLocation" class="retry-button" @click="useCityCenter">
            Gunakan pusat Kota Bandung
          </button>
        </div>

        <ol v-else-if="result" class="market-list">
          <li
            v-for="(item, index) in sortedItems"
            :key="item.market.id"
            class="market-item"
            :class="{ 'is-cheapest': item.market.id === cheapestId }"
          >
            <div class="market-rank">
              {{ String(index + 1).padStart(2, '0') }}
            </div>

            <div class="market-details">
              <div class="market-overline">
                <span class="market-type">{{ TYPE_LABEL[item.market.type] }}</span>
                <span v-if="item.market.id === cheapestId" class="cheapest-label"> TERMURAH </span>
              </div>

              <h3>{{ item.market.name }}</h3>

              <div class="market-meta">
                <span v-if="item.market.distanceKm != null">
                  {{ formatDistance(item.market.distanceKm) }} dari lokasimu
                </span>
                <span v-else>Jarak belum tersedia</span>
                <span class="meta-dot" aria-hidden="true">·</span>
                <span>{{ item.sourceLabel }}</span>
              </div>

              <p v-if="savingText(item)" class="saving-note">
                {{ savingText(item) }}
              </p>
            </div>

            <div class="market-price-block">
              <span class="price-label">HARGA</span>
              <p class="market-price">{{ rupiah(item.price) }}</p>
              <span class="price-unit">/ {{ selectedCommodity?.unit }}</span>
              <a
                class="route-link"
                :href="routeUrl(item)"
                target="_blank"
                rel="noopener noreferrer"
              >
                Lihat rute
                <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path
                    d="M3 13 13 3M5 3h8v8"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </a>
            </div>
          </li>
        </ol>

        <p v-if="result && sortedItems.length > 0" class="results-footnote">
          Harga berlabel “Estimasi” merupakan perkiraan dari harga acuan kota, bukan harga yang
          diperiksa langsung di lokasi.
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.cheapest-page {
  --page-bg: #f8f8f3;
  --surface: #fff;
  --ink: #203b2d;
  --muted: #718075;
  --line: #e5e9e1;
  --green: #245b3d;
  --green-soft: #edf3ed;
  --yellow: #f3d77a;
  --yellow-ink: #69500b;

  min-height: 100vh;
  padding: 32px 16px 112px;
  color: var(--ink);
  background: var(--page-bg);
}

.page-container {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 8px 0 28px;
  border-bottom: 1px solid var(--line);
}

.header-copy {
  max-width: 540px;
}

.eyebrow,
.section-kicker,
.reference-label,
.price-label {
  display: block;
  color: var(--green);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
}

.page-header h1 {
  margin: 12px 0 8px;
  color: var(--ink);
  font-size: clamp(27px, 5vw, 36px);
  font-weight: 750;
  letter-spacing: -1.2px;
  line-height: 1.18;
}

.page-header p {
  max-width: 470px;
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.7;
}

.header-symbol {
  display: grid;
  flex: 0 0 64px;
  width: 64px;
  height: 64px;
  place-items: center;
  border: 1px solid #dce5da;
  border-radius: 16px;
  color: var(--green);
  background: var(--green-soft);
}

.header-symbol svg {
  width: 36px;
  height: 36px;
}

.filter-section {
  padding: 26px 0;
  border-bottom: 1px solid var(--line);
}

.section-heading,
.results-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-heading h2,
.results-heading h2 {
  margin: 7px 0 0;
  color: var(--ink);
  font-size: 18px;
  font-weight: 750;
  letter-spacing: -0.4px;
}

.section-caption {
  color: var(--muted);
  font-size: 11px;
}

.commodity-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.commodity-chip,
.option-button {
  min-height: 42px;
  padding: 9px 15px;
  border: 1px solid #dce4da;
  border-radius: 999px;
  color: #53675a;
  background: var(--surface);
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
}

.commodity-chip:hover,
.option-button:hover {
  border-color: #9db5a0;
}

.commodity-chip.is-selected,
.option-button.is-active {
  border-color: var(--green);
  color: #fff;
  background: var(--green);
}

.loading-copy,
.empty-copy {
  color: var(--muted);
  font-size: 13px;
}

.settings-section {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 22px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 9px;
}

.setting-label {
  color: #53675a;
  font-size: 12px;
  font-weight: 700;
}

.segmented-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.option-button {
  min-height: 36px;
  padding: 7px 12px;
  font-size: 11px;
}

.location-notice {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin: 18px 0 0;
  padding: 12px 14px;
  border: 1px solid #e8e4d3;
  border-radius: 10px;
  color: #76652f;
  background: #fbf8ed;
  font-size: 12px;
  line-height: 1.55;
}

.location-notice svg {
  flex: 0 0 18px;
  width: 18px;
  height: 18px;
}

.reference-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 20px;
  padding: 15px 17px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
}

.reference-label {
  color: var(--muted);
  font-size: 9px;
  letter-spacing: 1.2px;
}

.reference-price {
  margin: 5px 0 0;
  color: var(--ink);
  font-size: 19px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.reference-price span {
  color: var(--muted);
  font-size: 11px;
  font-weight: 500;
}

.reference-source {
  color: var(--muted);
  font-size: 11px;
  text-align: right;
}

.results-section {
  padding-top: 30px;
}

.results-heading {
  margin-bottom: 14px;
}

.result-count {
  flex: none;
  padding: 5px 10px;
  border-radius: 999px;
  color: var(--green);
  background: var(--green-soft);
  font-size: 11px;
  font-weight: 700;
}

.market-list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--line);
}

.market-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 13px;
  align-items: start;
  padding: 20px 4px;
  border-bottom: 1px solid var(--line);
}

.market-rank {
  padding-top: 3px;
  color: #9aa69b;
  font-size: 12px;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
}

.market-details {
  min-width: 0;
}

.market-overline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.market-type {
  color: var(--muted);
  font-size: 10px;
  font-weight: 600;
}

.cheapest-label {
  padding: 4px 8px;
  border-radius: 999px;
  color: var(--yellow-ink);
  background: var(--yellow);
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.6px;
}

.market-details h3 {
  overflow-wrap: anywhere;
  margin: 8px 0 6px;
  color: var(--ink);
  font-size: 15px;
  font-weight: 750;
  line-height: 1.4;
}

.market-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  color: var(--muted);
  font-size: 10px;
  line-height: 1.5;
}

.meta-dot {
  color: #b0b9af;
}

.saving-note {
  margin: 8px 0 0;
  color: var(--green);
  font-size: 11px;
  font-weight: 650;
  line-height: 1.5;
}

.market-price-block {
  min-width: 120px;
  text-align: right;
}

.price-label {
  color: var(--muted);
  font-size: 9px;
  letter-spacing: 1px;
}

.market-price {
  margin: 5px 0 0;
  color: var(--green);
  font-size: clamp(17px, 3vw, 21px);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.5px;
  white-space: nowrap;
}

.price-unit {
  display: block;
  margin-top: 2px;
  color: var(--muted);
  font-size: 10px;
}

.route-link {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  margin-top: 7px;
  color: var(--green);
  font-size: 11px;
  font-weight: 750;
  text-decoration: none;
}

.route-link:hover {
  text-decoration: underline;
}

.route-link svg {
  width: 13px;
  height: 13px;
}

.results-footnote {
  margin: 18px 0 0;
  color: #89958b;
  font-size: 10px;
  line-height: 1.7;
}

.state-panel {
  display: flex;
  min-height: 210px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 20px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  text-align: center;
}

.state-panel h3 {
  margin: 12px 0 5px;
  color: var(--ink);
  font-size: 15px;
  font-weight: 750;
}

.state-panel p {
  max-width: 360px;
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.7;
}

.state-symbol {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 50%;
  color: var(--green);
  background: var(--green-soft);
}

.state-symbol svg {
  width: 25px;
  height: 25px;
}

.retry-button {
  min-height: 42px;
  margin-top: 16px;
  padding: 9px 17px;
  border: 1px solid var(--green);
  border-radius: 999px;
  color: #fff;
  background: var(--green);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.loader {
  width: 25px;
  height: 25px;
  border: 2px solid #dce7dc;
  border-top-color: var(--green);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

button:focus-visible,
a:focus-visible {
  outline: 3px solid #c5a83f;
  outline-offset: 3px;
}

@media (max-width: 520px) {
  .cheapest-page {
    padding: 24px 16px 100px;
  }

  .page-header {
    gap: 12px;
    padding-bottom: 22px;
  }

  .header-symbol {
    flex-basis: 48px;
    width: 48px;
    height: 48px;
    border-radius: 12px;
  }

  .header-symbol svg {
    width: 29px;
    height: 29px;
  }

  .page-header h1 {
    font-size: 27px;
  }

  .page-header p {
    font-size: 12px;
  }

  .section-heading,
  .results-heading {
    align-items: flex-start;
  }

  .section-caption {
    max-width: 100px;
    text-align: right;
  }

  .settings-section {
    flex-direction: column;
  }

  .reference-strip {
    align-items: flex-start;
  }

  .reference-source {
    max-width: 110px;
    line-height: 1.5;
  }

  .market-item {
    grid-template-columns: 25px minmax(0, 1fr) auto;
    gap: 9px;
    padding: 17px 0;
  }

  .market-price-block {
    min-width: 104px;
  }

  .market-price {
    font-size: 16px;
  }

  .market-details h3 {
    font-size: 13px;
  }

  .market-meta {
    font-size: 9px;
  }
}

@media (max-width: 360px) {
  .market-item {
    grid-template-columns: 22px minmax(0, 1fr);
  }

  .market-price-block {
    grid-column: 2;
    display: grid;
    grid-template-columns: auto 1fr;
    justify-items: start;
    align-items: baseline;
    column-gap: 5px;
    margin-top: 8px;
    text-align: left;
  }

  .market-price {
    margin: 0;
  }

  .price-label,
  .price-unit {
    display: none;
  }

  .route-link {
    grid-column: 1 / -1;
    margin-top: 2px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
