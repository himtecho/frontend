<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFetch } from '../composables/useFetch'
import { DEFAULT_CENTER, useGeolocation } from '../composables/useGeolocation'
import {
  getCommodities,
  getCommodityDetail,
  getNearbyMarkets,
  isApiError,
  submitReport,
} from '../services/api'
import type { CommodityDetail, Market } from '../types/api'

const route = useRoute()

// Location: shared with the other pages, falls back to the city center
const { coords, status, ensure } = useGeolocation()
onMounted(ensure)
const origin = computed(() => coords.value ?? DEFAULT_CENTER)
const geoPending = computed(() => status.value === 'idle' || status.value === 'loading')

// Dropdown data
const {
  data: commodities,
  loading: loadingCommodities,
  error: commoditiesError,
  reload: reloadCommodities,
} = useFetch(() => getCommodities())

const { data: markets, loading: loadingMarkets } = useFetch(
  async (): Promise<Market[]> => {
    if (geoPending.value) return []
    return getNearbyMarkets({ lat: origin.value.lat, lon: origin.value.lon, radius: 5, limit: 20 })
  },
  { watch: [coords, status] }
)

// Form state
const commodityId = ref<number | ''>('')
const marketId = ref<number | ''>('')
const priceText = ref('')
const submitting = ref(false)
const submitError = ref('')
const submitted = ref(false)

// Preselect the commodity when coming from the detail page (?commodityId=1)
watch(commodities, (list) => {
  if (!list || commodityId.value !== '') return
  const wanted = Number(route.query.commodityId)
  if (list.some((c) => c.id === wanted)) commodityId.value = wanted
})

// Reference price shown as a hint under the price field
const { data: reference } = useFetch(
  async (): Promise<CommodityDetail | null> =>
    commodityId.value === '' ? null : getCommodityDetail(commodityId.value),
  { watch: [commodityId] }
)

const MIN_PRICE = 100
const MAX_PRICE = 10_000_000

const price = computed(() => Number(priceText.value.replace(/\D/g, '')) || 0)
const priceValid = computed(() => price.value >= MIN_PRICE && price.value <= MAX_PRICE)
const canSubmit = computed(
  () => commodityId.value !== '' && marketId.value !== '' && priceValid.value && !submitting.value
)

const unit = computed(() => commodities.value?.find((c) => c.id === commodityId.value)?.unit ?? '')
const formatPrice = (n: number) => 'Rp ' + n.toLocaleString('id-ID')
const formatKm = (km: number | null | undefined) => (km == null ? '' : ` · ${km.toFixed(1)} km`)

function onPriceInput(e: Event) {
  // Keep digits only so the backend always receives an integer
  priceText.value = (e.target as HTMLInputElement).value.replace(/\D/g, '')
}

function messageFor(error: unknown): string {
  if (!isApiError(error)) return 'Terjadi kesalahan. Silakan coba lagi.'
  switch (error.code) {
    case 'PRICE_OUT_OF_RANGE':
      return 'Harga terlalu jauh dari harga acuan kota. Periksa kembali angka yang kamu masukkan.'
    case 'RATE_LIMITED':
      return 'Terlalu banyak laporan dalam waktu singkat. Coba lagi dalam satu jam.'
    case 'VALIDATION_ERROR':
      return 'Data belum valid. Periksa pasar, komoditas, dan harga.'
    case 'NETWORK_ERROR':
      return 'Tidak bisa terhubung ke server. Periksa koneksi internetmu.'
    default:
      return error.message
  }
}

async function onSubmit() {
  if (!canSubmit.value) return
  submitting.value = true
  submitError.value = ''
  try {
    await submitReport({
      marketId: Number(marketId.value),
      commodityId: Number(commodityId.value),
      price: price.value,
    })
    submitted.value = true
  } catch (error) {
    submitError.value = messageFor(error)
  } finally {
    submitting.value = false
  }
}

function reportAgain() {
  priceText.value = ''
  submitError.value = ''
  submitted.value = false
}
</script>

<template>
  <main class="report-page">
    <header class="hero">
      <span class="eyebrow">BANTU SESAMA WARGA</span>
      <h1>Laporkan Harga</h1>
      <p>Lihat harga yang berbeda di pasar? Bagikan agar warga lain ikut tahu.</p>
    </header>

    <!-- Success -->
    <section v-if="submitted" class="card center">
      <div class="big">✅</div>
      <h2>Terima kasih!</h2>
      <p>Laporanmu membantu warga lain menemukan harga yang wajar.</p>
      <div class="actions">
        <button type="button" class="btn" @click="reportAgain">Laporkan lagi</button>
        <RouterLink v-if="commodityId !== ''" :to="`/commodity/${commodityId}`" class="btn ghost">
          Lihat harga komoditas
        </RouterLink>
      </div>
    </section>

    <!-- Form -->
    <form v-else class="card" @submit.prevent="onSubmit">
      <div v-if="commoditiesError" class="alert">
        {{ commoditiesError }}
        <button type="button" class="link" @click="reloadCommodities">Coba lagi</button>
      </div>

      <label class="field">
        <span>Komoditas</span>
        <select v-model="commodityId" :disabled="loadingCommodities" required>
          <option value="" disabled>
            {{ loadingCommodities ? 'Memuat...' : 'Pilih komoditas' }}
          </option>
          <option v-for="c in commodities ?? []" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </label>

      <label class="field">
        <span>Pasar / toko</span>
        <select v-model="marketId" :disabled="loadingMarkets || geoPending" required>
          <option value="" disabled>
            {{ loadingMarkets || geoPending ? 'Mencari lokasi...' : 'Pilih pasar atau toko' }}
          </option>
          <option v-for="m in markets ?? []" :key="m.id" :value="m.id">
            {{ m.name }}{{ formatKm(m.distanceKm) }}
          </option>
        </select>
        <small v-if="!loadingMarkets && !geoPending && (markets ?? []).length === 0" class="hint">
          Belum ada pasar dalam radius 5 km dari lokasimu.
        </small>
      </label>

      <label class="field">
        <span>Harga{{ unit ? ` per ${unit}` : '' }}</span>
        <div class="price-input">
          <span class="prefix">Rp</span>
          <input
            :value="priceText"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            placeholder="0"
            required
            @input="onPriceInput"
          />
        </div>
        <small v-if="reference" class="hint">
          Harga acuan kota: {{ formatPrice(reference.price) }}/{{ reference.unit }}
        </small>
        <small v-if="priceText && !priceValid" class="hint warn">
          Masukkan harga antara {{ formatPrice(MIN_PRICE) }} dan {{ formatPrice(MAX_PRICE) }}.
        </small>
      </label>

      <p v-if="submitError" class="alert" role="alert">{{ submitError }}</p>

      <button type="submit" class="btn wide" :disabled="!canSubmit">
        {{ submitting ? 'Mengirim...' : 'Kirim laporan' }}
      </button>

      <p class="note">Laporan dikirim anonim. Harga yang jauh dari harga acuan akan ditolak.</p>
    </form>
  </main>
</template>

<style scoped>
.report-page {
  max-width: 560px;
  margin: 0 auto;
  padding: 20px 18px 110px;
  color: #203b2d;
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
.hero p {
  margin: 0;
  color: #e3f4e8;
  font-size: 13px;
  line-height: 1.6;
}

.card {
  display: grid;
  gap: 16px;
  margin-top: 16px;
  padding: 20px;
  border: 1px solid #e8eee8;
  border-radius: 16px;
  background: white;
}
.card.center {
  justify-items: center;
  text-align: center;
}
.card.center h2 {
  margin: 0;
}
.card.center p {
  margin: 0;
  color: #78877c;
  font-size: 13px;
}
.big {
  font-size: 44px;
}

.field {
  display: grid;
  gap: 6px;
}
.field > span {
  font-size: 12px;
  font-weight: 700;
}
.field select,
.price-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2eae3;
  border-radius: 11px;
  background: #f9fbf8;
  color: #203b2d;
  font: inherit;
  font-size: 14px;
}
.price-input {
  display: flex;
  align-items: center;
  gap: 8px;
}
.price-input .prefix {
  color: #78877c;
  font-weight: 700;
}
.price-input input {
  flex: 1;
  min-width: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 18px;
  font-weight: 700;
  outline: none;
}
.hint {
  color: #78877c;
  font-size: 11px;
}
.hint.warn {
  color: #a77b00;
}

.alert {
  margin: 0;
  padding: 11px 13px;
  border-radius: 11px;
  background: #fdecec;
  color: #a12626;
  font-size: 12px;
  line-height: 1.5;
}
.link {
  margin-left: 6px;
  border: 0;
  background: none;
  color: inherit;
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
}

.btn {
  display: inline-block;
  padding: 12px 18px;
  border: 0;
  border-radius: 11px;
  background: #16834a;
  color: white;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
}
.btn.wide {
  width: 100%;
}
.btn.ghost {
  background: #e8f5ec;
  color: #16834a;
}
.btn:disabled {
  background: #b8cfc0;
  cursor: not-allowed;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
}
.note {
  margin: 0;
  color: #89958b;
  font-size: 11px;
  text-align: center;
}
</style>
