<script setup lang="ts">
import { onMounted, ref } from 'vue'
import MarketMap from '../components/MarketMap.vue'
import { getNearbyMarkets } from '../services/api'
import type { Market, MarketType } from '../types/api'

const fallbackLocation = {
  lat: -6.9175,
  lon: 107.6191,
}

const latitude = ref(fallbackLocation.lat)
const longitude = ref(fallbackLocation.lon)

const markets = ref<Market[]>([])
const selectedMarket = ref<Market | null>(null)

const radius = ref(5)
const selectedTypes = ref<MarketType[]>([])

const loading = ref(false)
const errorMessage = ref('')
const locationMessage = ref('Sedang mendeteksi lokasi...')

const marketTypes: { label: string; value: MarketType }[] = [
  { label: 'Pasar tradisional', value: 'TRADITIONAL' },
  { label: 'Pasar murah', value: 'CHEAP_MARKET' },
  { label: 'Toko', value: 'STORE' },
  { label: 'Supermarket', value: 'SUPERMARKET' },
]

async function loadMarkets() {
  loading.value = true
  errorMessage.value = ''
  selectedMarket.value = null

  try {
    const params: {
      lat: number
      lon: number
      radius: number
      limit: number
      type?: MarketType[]
    } = {
      lat: latitude.value,
      lon: longitude.value,
      radius: radius.value,
      limit: 20,
    }

    if (selectedTypes.value.length > 0) {
      params.type = [...selectedTypes.value]
    }

    markets.value = await getNearbyMarkets(params)
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'Gagal memuat data pasar. Silakan coba lagi.'
  } finally {
    loading.value = false
  }
}

function toggleType(type: MarketType) {
  if (selectedTypes.value.includes(type)) {
    selectedTypes.value = selectedTypes.value.filter((item) => item !== type)
  } else {
    selectedTypes.value = [...selectedTypes.value, type]
  }

  loadMarkets()
}

function resetFilters() {
  radius.value = 5
  selectedTypes.value = []
  loadMarkets()
}

function formatMarketType(type: MarketType) {
  const labels: Record<MarketType, string> = {
    TRADITIONAL: 'Pasar Tradisional',
    CHEAP_MARKET: 'Pasar Murah',
    STORE: 'Toko',
    SUPERMARKET: 'Supermarket',
  }

  return labels[type]
}

function formatPrice(price: number) {
  return `Rp ${price.toLocaleString('id-ID')}`
}

function selectMarket(market: Market) {
  selectedMarket.value = market
}

function detectLocation() {
  if (!navigator.geolocation) {
    locationMessage.value = 'Lokasi tidak didukung browser. Menampilkan pasar di Bandung.'
    loadMarkets()
    return
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      latitude.value = position.coords.latitude
      longitude.value = position.coords.longitude
      locationMessage.value = 'Menampilkan pasar di sekitar lokasimu.'
      loadMarkets()
    },
    () => {
      locationMessage.value = 'Lokasi tidak tersedia. Menampilkan pasar di sekitar Bandung.'
      loadMarkets()
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    }
  )
}

onMounted(() => {
  detectLocation()
})
</script>

<template>
  <main class="map-page">
    <header class="map-header">
      <div>
        <span class="eyebrow">JELAJAHI SEKITARMU</span>
        <h1>Temukan Pasar <span>Terdekat!</span></h1>
        <p>Cari pasar murah dan bandingkan harga kebutuhan pokok di sekitarmu.</p>
      </div>

      <div class="location-info">
        <span class="location-icon">⌖</span>
        <span>{{ locationMessage }}</span>
      </div>
    </header>

    <section class="filter-card">
      <div class="section-heading">
        <div>
          <h2>Filter Pencarian</h2>
          <p>Sesuaikan pasar yang ingin kamu temukan.</p>
        </div>

        <button class="reset-button" @click="resetFilters">Reset</button>
      </div>

      <div class="filter-group">
        <label for="radius">Jarak pencarian</label>

        <select id="radius" v-model.number="radius" @change="loadMarkets">
          <option :value="1">1 km</option>
          <option :value="3">3 km</option>
          <option :value="5">5 km</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Jenis pasar</label>

        <div class="type-filters">
          <button
            v-for="option in marketTypes"
            :key="option.value"
            type="button"
            class="type-chip"
            :class="{ active: selectedTypes.includes(option.value) }"
            :aria-pressed="selectedTypes.includes(option.value)"
            @click="toggleType(option.value)"
          >
            <span v-if="selectedTypes.includes(option.value)">✓ </span>
            {{ option.label }}
          </button>
        </div>
      </div>
    </section>

    <section class="map-section">
      <div class="section-heading">
        <div>
          <h2>Peta Pasar</h2>
          <p>Lihat lokasi pasar dan informasi harga.</p>
        </div>

        <span class="result-count"> {{ markets.length }} lokasi </span>
      </div>

      <div v-if="loading" class="status-card">
        <div class="loader"></div>
        <p>Sedang mencari pasar terdekat...</p>
      </div>

      <div v-else-if="errorMessage" class="status-card error-card">
        <span class="status-icon">!</span>
        <h3>Belum berhasil memuat data</h3>
        <p>{{ errorMessage }}</p>
        <button class="primary-button" @click="loadMarkets">Coba lagi</button>
      </div>

      <div v-else-if="markets.length === 0" class="status-card">
        <span class="status-icon">⌖</span>
        <h3>Belum ada pasar ditemukan</h3>
        <p>Coba ubah jenis pasar atau perluas jarak pencarian.</p>
      </div>

      <template v-else>
        <MarketMap :markets="markets" @select="selectMarket" />

        <div v-if="selectedMarket" class="selected-market">
          <div class="selected-heading">
            <div>
              <span class="selected-label">PASAR DIPILIH</span>
              <h3>{{ selectedMarket.name }}</h3>
            </div>

            <button
              class="close-button"
              aria-label="Tutup detail pasar"
              @click="selectedMarket = null"
            >
              ×
            </button>
          </div>

          <p class="market-address">
            {{ selectedMarket.address }}
          </p>

          <div class="market-meta">
            <span>{{ formatMarketType(selectedMarket.type) }}</span>
            <span>{{ selectedMarket.distanceKm.toFixed(1) }} km</span>
            <span>
              {{
                selectedMarket.isOpenNow === null
                  ? 'Jam belum diketahui'
                  : selectedMarket.isOpenNow
                    ? 'Sedang buka'
                    : 'Sedang tutup'
              }}
            </span>
          </div>

          <div v-if="selectedMarket.topPrices.length" class="selected-prices">
            <h4>Harga unggulan</h4>

            <div
              v-for="item in selectedMarket.topPrices.slice(0, 3)"
              :key="item.commodityId"
              class="price-row"
            >
              <span>{{ item.name }} / {{ item.unit }}</span>
              <strong>{{ formatPrice(item.price) }}</strong>
            </div>
          </div>
        </div>
      </template>
    </section>

    <section class="market-list-section">
      <div class="section-heading">
        <div>
          <h2>Daftar Pasar</h2>
          <p>Pilih pasar untuk melihat informasi singkatnya.</p>
        </div>
      </div>

      <div v-if="!loading && markets.length" class="market-list">
        <button
          v-for="market in markets"
          :key="market.id"
          class="market-list-item"
          :class="{ 'is-selected': selectedMarket?.id === market.id }"
          @click="selectMarket(market)"
        >
          <div class="market-list-icon">🛒</div>

          <div class="market-list-content">
            <strong>{{ market.name }}</strong>
            <span>{{ formatMarketType(market.type) }}</span>
            <small>{{ market.distanceKm.toFixed(1) }} km dari lokasi</small>
          </div>

          <span class="market-arrow">›</span>
        </button>
      </div>

      <div v-else-if="!loading && !errorMessage && markets.length === 0" class="empty-list">
        Belum ada pasar untuk ditampilkan.
      </div>
    </section>
  </main>
</template>

<style scoped>
.map-page {
  width: 100%;
  max-width: 760px;
  margin: 0 auto;
  padding: 24px 18px 110px;
  color: #203b2d;
}

.map-header {
  padding: 25px 22px;
  border-radius: 22px;
  background: linear-gradient(135deg, #176b42, #26945b);
  color: white;
  box-shadow: 0 8px 22px rgba(23, 107, 66, 0.16);
}

.eyebrow {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #ffe38a;
}

.map-header h1 {
  margin: 10px 0;
  font-size: clamp(25px, 6vw, 34px);
  line-height: 1.2;
}

.map-header h1 span {
  color: #ffdf69;
}

.map-header p {
  max-width: 440px;
  margin: 0;
  color: #e5f4e9;
  font-size: 13px;
  line-height: 1.6;
}

.location-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.13);
  font-size: 11px;
}

.location-icon {
  font-size: 19px;
}

.filter-card,
.map-section,
.market-list-section {
  margin-top: 22px;
}

.filter-card {
  padding: 19px;
  border: 1px solid #e8eee8;
  border-radius: 18px;
  background: white;
  box-shadow: 0 4px 15px rgba(32, 59, 45, 0.04);
}

.section-heading,
.selected-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-heading h2,
.selected-heading h3 {
  margin: 0;
  font-size: 17px;
}

.section-heading p {
  margin: 5px 0 0;
  color: #849188;
  font-size: 11px;
}

.reset-button {
  padding: 7px 12px;
  border: 0;
  border-radius: 9px;
  background: #fff5d8;
  color: #916a00;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.filter-group {
  margin-top: 19px;
}

.filter-group label {
  display: block;
  margin-bottom: 9px;
  font-size: 12px;
  font-weight: 700;
}

.filter-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2eae3;
  border-radius: 11px;
  background: #f9fbf8;
  color: #203b2d;
  font: inherit;
  font-size: 12px;
}

.type-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type-chip {
  padding: 9px 11px;
  border: 1px solid #e2eae3;
  border-radius: 20px;
  background: #f9fbf8;
  color: #637369;
  font-size: 10px;
  cursor: pointer;
  transition: 0.2s;
}

.type-chip.active {
  border-color: #16834a;
  background: #e8f5ec;
  color: #16834a;
  font-weight: 700;
}

.result-count {
  padding: 7px 10px;
  border-radius: 20px;
  background: #e8f5ec;
  color: #16834a;
  font-size: 11px;
  font-weight: 700;
}

.map-section > .section-heading {
  margin-bottom: 13px;
}

.status-card {
  display: flex;
  min-height: 190px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 1px dashed #dce8dd;
  border-radius: 18px;
  background: white;
  text-align: center;
}

.status-card h3 {
  margin: 10px 0 5px;
  font-size: 15px;
}

.status-card p {
  max-width: 320px;
  margin: 5px 0;
  color: #87938a;
  font-size: 11px;
  line-height: 1.6;
}

.status-icon {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 50%;
  background: #fff3d0;
  color: #a77b00;
  font-size: 22px;
}

.loader {
  width: 30px;
  height: 30px;
  border: 3px solid #e0eee4;
  border-top-color: #16834a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.primary-button {
  margin-top: 12px;
  padding: 10px 18px;
  border: 0;
  border-radius: 10px;
  background: #16834a;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.selected-market {
  margin-top: 13px;
  padding: 17px;
  border: 1px solid #dcebdd;
  border-radius: 16px;
  background: #f8fcf8;
}

.selected-label {
  color: #16834a;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 1px;
}

.selected-heading h3 {
  margin-top: 5px;
}

.close-button {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: #e8f1e9;
  color: #41634d;
  font-size: 21px;
  cursor: pointer;
}

.market-address {
  margin: 10px 0;
  color: #758278;
  font-size: 11px;
  line-height: 1.5;
}

.market-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.market-meta span {
  padding: 6px 9px;
  border-radius: 20px;
  background: #eaf3eb;
  color: #477052;
  font-size: 9px;
}

.selected-prices {
  margin-top: 16px;
}

.selected-prices h4 {
  margin: 0 0 8px;
  font-size: 12px;
}

.price-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 0;
  border-top: 1px solid #e6eee6;
  font-size: 11px;
}

.price-row strong {
  color: #16834a;
  white-space: nowrap;
}

.market-list-section > .section-heading {
  margin-bottom: 13px;
}

.market-list {
  display: grid;
  gap: 10px;
}

.market-list-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;
  padding: 13px;
  border: 1px solid #e9eee9;
  border-radius: 15px;
  background: white;
  color: #203b2d;
  text-align: left;
  cursor: pointer;
  transition: 0.2s;
}

.market-list-item:hover,
.market-list-item.is-selected {
  border-color: #8fc5a0;
  background: #f4faf5;
}

.market-list-icon {
  display: grid;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 12px;
  background: #e8f5ec;
  font-size: 19px;
}

.market-list-content {
  display: grid;
  min-width: 0;
  flex: 1;
  gap: 3px;
}

.market-list-content strong {
  overflow: hidden;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.market-list-content span {
  color: #16834a;
  font-size: 10px;
}

.market-list-content small {
  color: #929d94;
  font-size: 10px;
}

.market-arrow {
  color: #16834a;
  font-size: 24px;
}

.empty-list {
  padding: 20px;
  border-radius: 14px;
  background: white;
  color: #87938a;
  font-size: 12px;
  text-align: center;
}

@media (min-width: 700px) {
  .map-page {
    padding: 30px 24px 50px;
  }
}
</style>
