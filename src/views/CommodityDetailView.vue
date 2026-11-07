<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useFetch } from '../composables/useFetch'
import { DEFAULT_CENTER, useGeolocation } from '../composables/useGeolocation'
import { getCommodityDetail, getCommodityHistory, getCommodityMarkets } from '../services/api'

const route = useRoute()
const id = computed(() => Number(route.params.id))
const days = ref<7 | 30>(30)

// Header: reference price, trend, source
const {
  data: commodity,
  loading,
  error,
  reload,
} = useFetch(() => getCommodityDetail(id.value), { watch: [id] })

// Chart data: refetch when the toggle or the commodity changes
const { data: history, loading: historyLoading } = useFetch(
  () => getCommodityHistory(id.value, days.value),
  { watch: [id, days] }
)

// Cheapest locations: wait for the location result, then refetch when it changes
const { coords, status, ensure } = useGeolocation()
onMounted(ensure)
const origin = computed(() => coords.value ?? DEFAULT_CENTER)
const geoPending = computed(() => status.value === 'idle' || status.value === 'loading')

const { data: marketsData, loading: marketsLoading } = useFetch(
  async () => {
    if (geoPending.value) return null
    return getCommodityMarkets(id.value, {
      lat: origin.value.lat,
      lon: origin.value.lon,
      radius: 5,
      limit: 5,
    })
  },
  { watch: [id, coords, status] }
)

const markets = computed(() => marketsData.value?.items ?? [])

// Simple SVG line chart (no chart library needed)
const W = 320
const H = 140
const PAD = 8

const chart = computed(() => {
  const pts = history.value?.points ?? []
  if (pts.length < 2) return null
  const prices = pts.map((p) => p.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const span = max - min || 1
  const x = (i: number) => PAD + (i / (pts.length - 1)) * (W - PAD * 2)
  const y = (v: number) => H - PAD - ((v - min) / span) * (H - PAD * 2)
  const line = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.price).toFixed(1)}`)
    .join(' ')
  const area = `${line} L${x(pts.length - 1).toFixed(1)},${H - PAD} L${x(0).toFixed(1)},${H - PAD} Z`
  return { line, area, first: pts[0].date, last: pts[pts.length - 1].date }
})

const stats = computed(() => history.value?.stats ?? null)

const formatPrice = (n: number) => 'Rp ' + n.toLocaleString('id-ID')
const formatKm = (km: number | null | undefined) => (km == null ? '-' : `${km.toFixed(1)} km`)
const formatDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

function formatChange(pct: number) {
  return `${pct > 0 ? '+' : ''}${pct.toFixed(1).replace('.', ',')}%`
}
const trendIcon = (trend: string) => (trend === 'UP' ? '🔺' : trend === 'DOWN' ? '🔻' : '➖')
</script>

<template>
  <main class="detail-page">
    <RouterLink to="/" class="back">← Kembali</RouterLink>

    <p v-if="loading" class="muted">Memuat detail komoditas...</p>

    <div v-else-if="error" class="card center">
      <p>{{ error }}</p>
      <button type="button" class="btn" @click="reload">Coba lagi</button>
    </div>

    <template v-else-if="commodity">
      <header class="hero">
        <span class="eyebrow">HARGA ACUAN KOTA</span>
        <h1>{{ commodity.name }}</h1>
        <div class="hero-price">
          <strong>{{ formatPrice(commodity.price) }}</strong>
          <span>/{{ commodity.unit }}</span>
        </div>
        <p class="hero-meta">
          {{ trendIcon(commodity.trend) }} {{ formatChange(commodity.changePercent) }} dibanding 7
          hari lalu
        </p>
        <small>{{ commodity.sourceLabel }} · {{ formatDate(commodity.date) }}</small>
      </header>

      <section class="card">
        <div class="row">
          <h2>Tren harga</h2>
          <div class="toggle">
            <button type="button" :class="{ active: days === 7 }" @click="days = 7">7 hari</button>
            <button type="button" :class="{ active: days === 30 }" @click="days = 30">
              30 hari
            </button>
          </div>
        </div>

        <p v-if="historyLoading" class="muted">Memuat grafik...</p>
        <p v-else-if="!chart" class="muted">Data riwayat belum cukup untuk membuat grafik.</p>

        <template v-else>
          <svg :viewBox="`0 0 ${W} ${H}`" class="chart" role="img" aria-label="Grafik tren harga">
            <path :d="chart.area" class="chart-area" />
            <path :d="chart.line" class="chart-line" />
          </svg>
          <div class="chart-axis">
            <span>{{ formatDate(chart.first) }}</span>
            <span>{{ formatDate(chart.last) }}</span>
          </div>
        </template>

        <div v-if="stats" class="stats">
          <div>
            <small>Terendah</small>
            <strong>{{ formatPrice(stats.min) }}</strong>
            <small>{{ formatDate(stats.minDate) }}</small>
          </div>
          <div>
            <small>Rata-rata</small>
            <strong>{{ formatPrice(stats.average) }}</strong>
          </div>
          <div>
            <small>Tertinggi</small>
            <strong>{{ formatPrice(stats.max) }}</strong>
            <small>{{ formatDate(stats.maxDate) }}</small>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="row">
          <h2>Termurah di sekitarmu</h2>
          <RouterLink :to="{ path: '/cheapest', query: { commodity: id } }" class="link">
            Lihat semua →
          </RouterLink>
        </div>

        <p v-if="marketsLoading || geoPending" class="muted">Mencari lokasi...</p>
        <p v-else-if="markets.length === 0" class="muted">Belum ada harga di sekitar lokasi ini.</p>

        <ul v-else class="market-list">
          <li v-for="item in markets" :key="item.market.id">
            <RouterLink :to="`/market/${item.market.id}`" class="market-row">
              <div>
                <strong>{{ item.market.name }}</strong>
                <small>{{ formatKm(item.market.distanceKm) }} · {{ item.sourceLabel }}</small>
              </div>
              <span class="price">{{ formatPrice(item.price) }}</span>
            </RouterLink>
          </li>
        </ul>
      </section>

      <RouterLink :to="{ path: '/report', query: { commodityId: id } }" class="btn wide">
        Laporkan harga {{ commodity.name }}
      </RouterLink>
    </template>
  </main>
</template>

<style scoped>
.detail-page {
  max-width: 760px;
  margin: 0 auto;
  padding: 20px 18px 110px;
  color: #203b2d;
}
.back {
  display: inline-block;
  margin-bottom: 14px;
  color: #16834a;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}
.muted {
  color: #87938a;
  font-size: 12px;
}

.hero {
  padding: 22px;
  border-radius: 20px;
  background: linear-gradient(135deg, #176b42, #26945b);
  color: white;
}
.eyebrow {
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.5px;
  color: #ffe38a;
}
.hero h1 {
  margin: 8px 0;
  font-size: 26px;
}
.hero-price strong {
  font-size: 32px;
}
.hero-price span {
  margin-left: 4px;
  color: #d8efe0;
}
.hero-meta {
  margin: 8px 0 4px;
  font-size: 13px;
}
.hero small {
  color: #d8efe0;
  font-size: 11px;
}

.card {
  margin-top: 16px;
  padding: 18px;
  border: 1px solid #e8eee8;
  border-radius: 16px;
  background: white;
}
.card.center {
  text-align: center;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.row h2 {
  margin: 0;
  font-size: 16px;
}
.link {
  color: #16834a;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.toggle {
  display: flex;
  gap: 6px;
}
.toggle button {
  padding: 6px 11px;
  border: 1px solid #dce8dc;
  border-radius: 20px;
  background: white;
  color: #657469;
  font-size: 11px;
  cursor: pointer;
}
.toggle button.active {
  border-color: #16834a;
  background: #16834a;
  color: white;
}

.chart {
  width: 100%;
  height: auto;
  margin-top: 12px;
}
.chart-line {
  fill: none;
  stroke: #16834a;
  stroke-width: 2.5;
  stroke-linejoin: round;
  stroke-linecap: round;
}
.chart-area {
  fill: #16834a;
  opacity: 0.1;
}
.chart-axis {
  display: flex;
  justify-content: space-between;
  color: #87938a;
  font-size: 10px;
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #edf1eb;
  text-align: center;
}
.stats div {
  display: grid;
  gap: 2px;
}
.stats strong {
  font-size: 13px;
}
.stats small {
  color: #87938a;
  font-size: 10px;
}

.market-list {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
}
.market-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 11px 0;
  border-top: 1px solid #edf1eb;
  color: inherit;
  text-decoration: none;
}
.market-row div {
  display: grid;
  gap: 3px;
  min-width: 0;
}
.market-row strong {
  font-size: 13px;
}
.market-row small {
  color: #87938a;
  font-size: 10px;
}
.price {
  color: #126b3b;
  font-weight: 800;
  white-space: nowrap;
}

.btn {
  display: inline-block;
  padding: 11px 18px;
  border: 0;
  border-radius: 10px;
  background: #16834a;
  color: white;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}
.btn.wide {
  display: block;
  margin-top: 16px;
}
</style>
