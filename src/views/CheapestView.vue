<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getCommodities, getCommodityMarkets, isApiError } from '../services/api'
import { formatDistance } from '../utils/datetime'
import type { Commodity, CommodityMarketItem, CommodityMarkets, MarketType } from '../types/api'

// Data currently covers Bandung only, so the fallback location is the city center
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
const errorMessage = ref('')
let requestId = 0 // ignore stale responses when the user switches chips quickly

const selectedCommodity = computed(() => commodities.value.find((c) => c.id === selectedId.value) ?? null)

const distOf = (i: CommodityMarketItem) => i.market.distanceKm ?? Number.POSITIVE_INFINITY
const byPrice = (a: CommodityMarketItem, b: CommodityMarketItem) => a.price - b.price || distOf(a) - distOf(b)
const byDistance = (a: CommodityMarketItem, b: CommodityMarketItem) => distOf(a) - distOf(b) || a.price - b.price

const items = computed(() => result.value?.items ?? [])
const sortedItems = computed(() => [...items.value].sort(sortBy.value === 'price' ? byPrice : byDistance))
const cheapestId = computed(() => [...items.value].sort(byPrice)[0]?.market.id ?? null)

function savingText(item: CommodityMarketItem): string | null {
  const ref = result.value?.reference.price
  if (ref == null) return null
  const diff = ref - item.price
  if (diff === 0) return null
  const pct = Math.round((Math.abs(diff) / ref) * 100)
  return diff > 0
    ? `Hemat ${rupiah(diff)} (${pct}%) dari harga acuan kota`
    : `${rupiah(-diff)} (${pct}%) di atas harga acuan kota`
}

function routeUrl(item: CommodityMarketItem) {
  const { latitude, longitude, name } = item.market
  const destination =
    latitude != null && longitude != null ? `${latitude},${longitude}` : encodeURIComponent(`${name} Bandung`)
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`
}

function locate(): Promise<void> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) return resolve()
    navigator.geolocation.getCurrentPosition(
      (p) => {
        position.value = { lat: p.coords.latitude, lon: p.coords.longitude }
        usingDefaultLocation.value = false
        resolve()
      },
      () => resolve(), // denied or unavailable: keep the default center
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
    const res = await getCommodityMarkets(selectedId.value, {
      lat: position.value.lat,
      lon: position.value.lon,
      radius: radius.value,
      limit: 30,
    })
    if (id === requestId) result.value = res
  } catch (error) {
    if (id === requestId) {
      errorMessage.value = isApiError(error) ? error.message : 'Gagal memuat daftar harga.'
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
    selectedId.value = commodities.value[0]?.id ?? null // triggers load() via the watcher
  } catch (error) {
    errorMessage.value = isApiError(error) ? error.message : 'Gagal memuat daftar komoditas.'
  }
}

watch([selectedId, radius], load)
onMounted(init)
</script>

<template>
  <main class="cheapest-page">
    <header class="page-header">
      <div class="header-content">
        <span class="eyebrow">CARI TERMURAH</span>
        <h1>Pasar Termurah di Sekitarmu</h1>
        <p>Pilih bahan pokok, lalu lihat pasar atau toko terdekat dengan harga paling murah.</p>
      </div>
      <div class="header-icon">🛒</div>
    </header>

    <section class="content">
      <h2 class="label">Pilih bahan pokok</h2>
      <div class="chip-row">
        <button
          v-for="c in commodities"
          :key="c.id"
          class="chip"
          :class="{ selected: c.id === selectedId }"
          @click="selectedId = c.id"
        >
          {{ c.name }}
        </button>
      </div>

      <div class="controls">
        <div class="control-group">
          <span class="label">Radius</span>
          <button
            v-for="r in RADIUS_OPTIONS"
            :key="r"
            class="chip small"
            :class="{ selected: r === radius }"
            @click="radius = r"
          >
            {{ r }} km
          </button>
        </div>
        <div class="control-group">
          <span class="label">Urutkan</span>
          <button class="chip small" :class="{ selected: sortBy === 'price' }" @click="sortBy = 'price'">
            Termurah
          </button>
          <button class="chip small" :class="{ selected: sortBy === 'distance' }" @click="sortBy = 'distance'">
            Terdekat
          </button>
        </div>
      </div>

      <p v-if="usingDefaultLocation" class="hint">
        📍 Memakai pusat Kota Bandung (lokasimu belum tersedia atau izin ditolak).
      </p>
      <p v-if="result && selectedCommodity" class="reference">
        Harga acuan kota: <strong>{{ rupiah(result.reference.price) }}/{{ selectedCommodity.unit }}</strong>
        · {{ result.reference.sourceLabel }}
      </p>

      <div v-if="loading" class="state-card">
        <div class="loader"></div>
        <p>Mencari harga termurah...</p>
      </div>

      <div v-else-if="errorMessage" class="state-card">
        <span>⚠️</span>
        <p>{{ errorMessage }}</p>
        <button @click="load">Coba lagi</button>
      </div>

      <div v-else-if="result && sortedItems.length === 0" class="state-card">
        <span>📭</span>
        <h3>Tidak ada lokasi dalam radius {{ radius }} km</h3>
        <p>Data saat ini baru mencakup Kota Bandung.</p>
        <button v-if="!usingDefaultLocation" @click="useCityCenter">Pakai pusat Kota Bandung</button>
      </div>

      <ol v-else class="result-list">
        <li v-for="(item, index) in sortedItems" :key="item.market.id" class="result-card">
          <div class="card-top">
            <span class="rank">{{ index + 1 }}</span>
            <span class="type-tag">{{ TYPE_LABEL[item.market.type] }}</span>
            <span v-if="item.market.id === cheapestId" class="best-badge">Termurah</span>
          </div>

          <h3>{{ item.market.name }}</h3>

          <div class="price-row">
            <span class="price">{{ rupiah(item.price) }}</span>
            <span class="unit">/{{ selectedCommodity?.unit }}</span>
            <span class="source" :class="item.source.toLowerCase()">{{ item.sourceLabel }}</span>
          </div>

          <p v-if="savingText(item)" class="saving">{{ savingText(item) }}</p>

          <div class="meta-row">
            <span v-if="item.market.distanceKm != null">🚶 {{ formatDistance(item.market.distanceKm) }}</span>
            <a :href="routeUrl(item)" target="_blank" rel="noopener">Lihat rute →</a>
          </div>
        </li>
      </ol>

      <p class="note">
        Harga berlabel “Estimasi” adalah perkiraan dari harga acuan kota, bukan harga yang dicek langsung di lokasi.
      </p>
    </section>
  </main>
</template>

<style scoped>
.cheapest-page {
  min-height: 100vh;
  padding-bottom: 100px;
  background: #f6f9f3;
  color: #203b2d;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 35px 7% 40px;
  background: linear-gradient(135deg, #126b3b, #229653);
  color: white;
  border-radius: 0 0 28px 28px;
}
.eyebrow {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #ffe28a;
}
.page-header h1 {
  margin: 12px 0;
  font-size: clamp(24px, 5vw, 34px);
}
.page-header p {
  margin: 0;
  color: #e3f4e8;
  font-size: 14px;
  line-height: 1.6;
}
.header-icon {
  font-size: 52px;
}

.content {
  width: min(900px, 90%);
  margin: 26px auto;
}
.label {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: #657469;
}

.chip-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 6px;
}
.chip {
  flex: none;
  padding: 9px 15px;
  border: 1px solid #dce8dc;
  border-radius: 30px;
  background: white;
  color: #657469;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.chip.small {
  padding: 7px 12px;
  font-size: 12px;
}
.chip.selected {
  background: #16834a;
  border-color: #16834a;
  color: white;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 24px;
  margin: 16px 0;
}
.control-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.control-group .label {
  margin: 0;
}

.hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: #8a6d00;
}
.reference {
  margin: 0 0 16px;
  font-size: 13px;
  color: #56675a;
}

.result-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 14px;
}
.result-card {
  padding: 18px;
  border: 1px solid #e8eee5;
  border-radius: 16px;
  background: white;
  box-shadow: 0 4px 15px rgba(32, 59, 45, 0.04);
}
.card-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.rank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e6f6eb;
  color: #16834a;
  font-size: 12px;
  font-weight: 800;
  display: grid;
  place-items: center;
}
.type-tag {
  font-size: 12px;
  color: #839087;
}
.best-badge {
  margin-left: auto;
  padding: 4px 10px;
  border-radius: 20px;
  background: #fff4cf;
  color: #9b7200;
  font-size: 11px;
  font-weight: 800;
}
.result-card h3 {
  margin: 10px 0 8px;
  font-size: 17px;
}
.price-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 6px;
}
.price {
  font-size: 26px;
  font-weight: 800;
  color: #126b3b;
}
.unit {
  font-size: 13px;
  color: #839087;
}
.source {
  margin-left: auto;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  background: #edf0ed;
  color: #78817a;
}
.source.pihps {
  background: #e3f0fb;
  color: #1c5f9a;
}
.source.citizen {
  background: #e6f6eb;
  color: #16834a;
}
.source.seed {
  background: #fff4cf;
  color: #9b7200;
}
.saving {
  margin: 8px 0 0;
  font-size: 13px;
  color: #16834a;
}
.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #edf1eb;
  font-size: 13px;
  color: #56675a;
}
.meta-row a {
  color: #16834a;
  font-weight: 700;
  text-decoration: none;
}

.state-card {
  padding: 36px 20px;
  border-radius: 16px;
  background: white;
  text-align: center;
  color: #758278;
}
.state-card > span {
  font-size: 30px;
}
.state-card h3 {
  color: #203b2d;
}
.state-card button {
  padding: 9px 18px;
  border: none;
  border-radius: 9px;
  background: #16834a;
  color: white;
  cursor: pointer;
}
.loader {
  width: 27px;
  height: 27px;
  margin: auto;
  border: 3px solid #dceadd;
  border-top-color: #16834a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.note {
  margin-top: 22px;
  font-size: 11px;
  text-align: center;
  color: #89958b;
}
</style>