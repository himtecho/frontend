
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

// Location
const { coords, status, ensure } = useGeolocation()
onMounted(ensure)

const origin = computed(() => coords.value ?? DEFAULT_CENTER)
const geoPending = computed(() => status.value === 'idle' || status.value === 'loading')

// Commodity options
const {
  data: commodities,
  loading: loadingCommodities,
  error: commoditiesError,
  reload: reloadCommodities,
} = useFetch(() => getCommodities())

// Nearby market options
const {
  data: markets,
  loading: loadingMarkets,
} = useFetch(
  async (): Promise<Market[]> => {
    if (geoPending.value) return []

    return getNearbyMarkets({
      lat: origin.value.lat,
      lon: origin.value.lon,
      radius: 5,
      limit: 20,
    })
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
const priceTouched = ref(false)

// Preselect commodity from the detail page
watch(commodities, (list) => {
  if (!list || commodityId.value !== '') return

  const wanted = Number(route.query.commodityId)

  if (list.some((commodity) => commodity.id === wanted)) {
    commodityId.value = wanted
  }
})

// Selected commodity reference price
const {
  data: reference,
  loading: loadingReference,
} = useFetch(
  async (): Promise<CommodityDetail | null> => {
    if (commodityId.value === '') return null
    return getCommodityDetail(commodityId.value)
  },
  { watch: [commodityId] }
)

// Price validation
const MIN_PRICE = 100
const MAX_PRICE = 10_000_000

const price = computed(() => Number(priceText.value) || 0)

const priceValid = computed(
  () => price.value >= MIN_PRICE && price.value <= MAX_PRICE
)

const unit = computed(
  () => commodities.value?.find((item) => item.id === commodityId.value)?.unit ?? ''
)

const canSubmit = computed(
  () =>
    commodityId.value !== '' &&
    marketId.value !== '' &&
    priceValid.value &&
    !submitting.value
)

// Formatting
const formatPrice = (value: number) =>
  `Rp ${value.toLocaleString('id-ID')}`

const displayPrice = computed(() =>
  priceText.value
    ? Number(priceText.value).toLocaleString('id-ID')
    : ''
)

const formattedDistance = (distance: number | null | undefined) => {
  if (distance == null) return 'Jarak belum diketahui'

  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`
  }

  return `${distance.toLocaleString('id-ID', {
    maximumFractionDigits: 1,
  })} km`
}

const selectedCommodity = computed(() =>
  commodities.value?.find((item) => item.id === commodityId.value)
)

const selectedMarket = computed(() =>
  markets.value?.find((item) => item.id === marketId.value)
)

function onPriceInput(event: Event) {
  const input = event.target as HTMLInputElement
  priceText.value = input.value.replace(/\D/g, '')
  priceTouched.value = true
  submitError.value = ''
}

// Error messages follow the API error codes
function messageFor(error: unknown): string {
  if (!isApiError(error)) {
    return 'Terjadi kesalahan. Silakan coba kembali.'
  }

  switch (error.code) {
    case 'PRICE_OUT_OF_RANGE':
      return 'Harga berada di luar rentang yang dapat diterima dibandingkan harga acuan kota. Periksa kembali laporanmu.'

    case 'RATE_LIMITED':
      return 'Batas laporan tercapai. Maksimal 5 laporan dalam satu jam. Silakan coba lagi nanti.'

    case 'VALIDATION_ERROR':
      return 'Data laporan belum valid. Periksa kembali komoditas, pasar, dan harga.'

    case 'NETWORK_ERROR':
      return 'Tidak dapat terhubung ke server. Periksa koneksi internet dan coba lagi.'

    default:
      return error.message || 'Laporan gagal dikirim. Silakan coba kembali.'
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
  priceTouched.value = false
  submitError.value = ''
  submitted.value = false
}
</script>

<template>
  <main class="report-page">
    <div class="report-container">
      <!-- Page heading -->
      <header class="page-header">
        <div class="eyebrow">
          <span class="eyebrow-line"></span>
          PARTISIPASI WARGA
        </div>

        <h1>Laporkan Harga</h1>

        <p class="intro">
          Temukan harga sembako di pasar? Bagikan informasi harga agar
          warga lain dapat membandingkan harga dengan lebih mudah.
        </p>
      </header>

      <!-- Success state -->
      <section v-if="submitted" class="success-panel" aria-live="polite">
        <div class="success-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>

        <span class="success-eyebrow">LAPORAN TERKIRIM</span>

        <h2>Terima kasih sudah berbagi!</h2>

        <p>
          Informasi harga yang kamu kirim telah diterima.
          Kontribusimu membantu warga mendapatkan gambaran harga pangan.
        </p>

        <div v-if="selectedCommodity" class="success-summary">
          <span>Komoditas yang dilaporkan</span>
          <strong>{{ selectedCommodity.name }}</strong>
          <span v-if="selectedMarket">
            {{ selectedMarket.name }}
          </span>
          <strong class="success-price">
            {{ formatPrice(price) }}
            <small>/{{ selectedCommodity.unit }}</small>
          </strong>
        </div>

        <div class="success-actions">
          <button type="button" class="button button-primary" @click="reportAgain">
            Laporkan lagi
          </button>

          <RouterLink
            v-if="commodityId !== ''"
            :to="`/commodity/${commodityId}`"
            class="button button-secondary"
          >
            Lihat harga komoditas
          </RouterLink>
        </div>
      </section>

      <!-- Report form -->
      <form v-else class="form-panel" @submit.prevent="onSubmit">
        <div class="form-heading">
          <div>
            <span class="section-eyebrow">FORMULIR LAPORAN</span>
            <h2>Informasi harga</h2>
          </div>

          <span class="required-label">* Wajib diisi</span>
        </div>

        <!-- Commodity -->
        <div class="field">
          <label for="commodity">Komoditas</label>

          <div class="select-wrapper">
            <select
              id="commodity"
              v-model="commodityId"
              :disabled="loadingCommodities"
              required
            >
              <option value="" disabled>
                {{ loadingCommodities ? 'Memuat komoditas...' : 'Pilih komoditas' }}
              </option>

              <option
                v-for="item in commodities ?? []"
                :key="item.id"
                :value="item.id"
              >
                {{ item.name }} ({{ item.unit }})
              </option>
            </select>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m7 10 5 5 5-5" />
            </svg>
          </div>

          <p v-if="loadingCommodities" class="field-hint">
            Sedang mengambil daftar komoditas.
          </p>

          <div v-if="commoditiesError" class="inline-error" role="alert">
            <span>Daftar komoditas gagal dimuat.</span>
            <button type="button" @click="reloadCommodities">
              Coba lagi
            </button>
          </div>

          <p
            v-if="!loadingCommodities && !commoditiesError && !(commodities ?? []).length"
            class="field-hint"
          >
            Belum ada komoditas yang tersedia.
          </p>
        </div>

        <div class="field-divider"></div>

        <!-- Market -->
        <div class="field">
          <label for="market">Pasar atau toko</label>

          <div class="select-wrapper">
            <select
              id="market"
              v-model="marketId"
              :disabled="loadingMarkets || geoPending || !(markets ?? []).length"
              required
            >
              <option value="" disabled>
                {{
                  geoPending || loadingMarkets
                    ? 'Mencari pasar terdekat...'
                    : 'Pilih pasar atau toko'
                }}
              </option>

              <option
                v-for="market in markets ?? []"
                :key="market.id"
                :value="market.id"
              >
                {{ market.name }} · {{ formattedDistance(market.distanceKm) }}
              </option>
            </select>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="m7 10 5 5 5-5" />
            </svg>
          </div>

          <p v-if="geoPending || loadingMarkets" class="field-hint">
            Sedang mencari pasar di sekitar lokasi.
          </p>

          <p
            v-else-if="!coords"
            class="field-hint"
          >
            Lokasi perangkat tidak tersedia. Daftar pasar menggunakan titik acuan kota Bandung.
          </p>

          <p
            v-if="!geoPending && !loadingMarkets && !(markets ?? []).length"
            class="field-hint"
          >
            Belum ada pasar dalam radius 5 km dari titik pencarian.
          </p>

          <div v-if="selectedMarket" class="selected-market">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>

            <span>{{ selectedMarket.address || selectedMarket.name }}</span>
          </div>
        </div>

        <div class="field-divider"></div>

        <!-- Price -->
        <div class="field">
          <label for="price">
            Harga yang ditemukan
            <span v-if="unit" class="unit-label">/ {{ unit }}</span>
          </label>

          <div
            class="price-input"
            :class="{ 'price-input-invalid': priceTouched && priceText && !priceValid }"
          >
            <span class="currency-prefix">Rp</span>

            <input
              id="price"
              :value="displayPrice"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              placeholder="Masukkan harga"
              :aria-invalid="priceTouched && !!priceText && !priceValid"
              aria-describedby="price-hint price-validation"
              required
              @input="onPriceInput"
            />
          </div>

          <div v-if="loadingReference && commodityId !== ''" class="reference-box">
            <span class="reference-dot"></span>
            Memuat harga acuan kota...
          </div>

          <div v-else-if="reference" class="reference-box">
            <span class="reference-dot"></span>
            <div>
              <span class="reference-label">Harga acuan kota</span>
              <strong>
                {{ formatPrice(reference.price) }}/{{ reference.unit }}
              </strong>
              <span class="source-label">
                {{ reference.sourceLabel }}
              </span>
            </div>
          </div>

          <p v-else-if="commodityId !== ''" class="field-hint">
            Harga acuan kota belum tersedia.
          </p>

          <p id="price-hint" class="field-hint">
            Masukkan harga sesuai satuan komoditas yang dipilih.
          </p>

          <p
            v-if="priceTouched && priceText && !priceValid"
            id="price-validation"
            class="validation-error"
            role="alert"
          >
            Harga harus antara {{ formatPrice(MIN_PRICE) }} dan
            {{ formatPrice(MAX_PRICE) }}.
          </p>

          <p
            v-else-if="priceValid && priceText"
            id="price-validation"
            class="validation-success"
          >
            Harga yang dilaporkan: {{ formatPrice(price) }}
          </p>
        </div>

        <!-- API error -->
        <div v-if="submitError" class="submit-error" role="alert">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4m0 4h.01" />
          </svg>

          <p>{{ submitError }}</p>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="button button-primary submit-button"
          :disabled="!canSubmit"
        >
          <svg
            v-if="submitting"
            class="button-loader"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M12 3a9 9 0 1 0 9 9" />
          </svg>

          <span>
            {{ submitting ? 'Mengirim laporan...' : 'Kirim laporan harga' }}
          </span>

          <svg
            v-if="!submitting"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14m-6-6 6 6-6 6" />
          </svg>
        </button>

        <div class="privacy-note">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 1 1 8 0v3" />
          </svg>

          <p>
            Laporan dikirim anonim. Harga yang jauh dari harga acuan
            akan ditolak untuk menjaga kualitas informasi.
          </p>
        </div>
      </form>

      <p class="page-footer">
        Bersama warga, kita bangun informasi harga pangan yang lebih terbuka.
      </p>
    </div>
  </main>
</template>

<style scoped>
.report-page {
  min-height: 100vh;
  padding: 32px 16px 110px;
  color: var(--text);
  background: var(--background);
}

.report-container {
  width: 100%;
  max-width: 620px;
  margin: 0 auto;
}

/* Page heading */
.page-header {
  margin-bottom: 24px;
}

.eyebrow,
.section-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--green);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
}

.eyebrow-line {
  width: 22px;
  height: 2px;
  border-radius: 2px;
  background: var(--yellow);
}

.page-header h1 {
  margin: 12px 0 8px;
  color: var(--green-dark);
  font-size: 30px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.8px;
}

.intro {
  max-width: 490px;
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.7;
}

/* Form panel */
.form-panel,
.success-panel {
  padding: 25px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--white);
  box-shadow: var(--shadow);
}

.form-panel {
  display: grid;
  gap: 20px;
}

.form-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}

.form-heading h2 {
  margin: 7px 0 0;
  color: var(--green-dark);
  font-size: 19px;
  font-weight: 700;
}

.required-label {
  color: var(--muted);
  font-size: 11px;
  white-space: nowrap;
}

/* Fields */
.field {
  display: grid;
  gap: 9px;
  min-width: 0;
}

.field label {
  color: var(--green-dark);
  font-size: 14px;
  font-weight: 700;
}

.unit-label {
  color: var(--muted);
  font-size: 12px;
  font-weight: 400;
}

.select-wrapper {
  position: relative;
}

.select-wrapper select {
  width: 100%;
  min-height: 50px;
  padding: 0 44px 0 14px;
  appearance: none;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--background);
  color: var(--text);
  font: inherit;
  font-size: 14px;
  outline: none;
  cursor: pointer;
  transition: border-color 150ms ease-out;
}

.select-wrapper select:focus {
  border-color: var(--green);
}

.select-wrapper select:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.select-wrapper select option {
  color: var(--text);
}

.select-wrapper > svg {
  position: absolute;
  top: 50%;
  right: 14px;
  width: 19px;
  height: 19px;
  color: var(--muted);
  pointer-events: none;
  transform: translateY(-50%);
}

.field-divider {
  height: 1px;
  background: var(--border);
}

/* Market selection */
.selected-market {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.selected-market svg {
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  color: var(--green);
}

/* Price input */
.price-input {
  display: flex;
  align-items: center;
  min-height: 64px;
  padding: 0 15px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--background);
  transition:
    border-color 150ms ease-out,
    box-shadow 150ms ease-out;
}

.price-input:focus-within {
  border-color: var(--green);
  box-shadow: 0 0 0 3px var(--green-light);
}

.price-input-invalid {
  border-color: var(--red);
}

.currency-prefix {
  margin-right: 12px;
  color: var(--green);
  font-size: 19px;
  font-weight: 700;
}

.price-input input {
  width: 100%;
  min-width: 0;
  height: 58px;
  border: 0;
  outline: none;
  background: transparent;
  color: var(--green-dark);
  font-size: 23px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.price-input input::placeholder {
  color: var(--muted);
  font-size: 15px;
  font-weight: 400;
}

/* Reference price */
.reference-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--background);
}

.reference-dot {
  flex: 0 0 8px;
  width: 8px;
  height: 8px;
  margin-top: 5px;
  border-radius: 50%;
  background: var(--green);
}

.reference-box > div {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
}

.reference-label {
  width: 100%;
  color: var(--muted);
  font-size: 11px;
}

.reference-box strong {
  color: var(--green-dark);
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}

.source-label {
  color: var(--muted);
  font-size: 11px;
}

.field-hint {
  margin: 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.6;
}

.validation-error,
.validation-success {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}

.validation-error {
  color: var(--red);
}

.validation-success {
  color: var(--green-dark);
}

/* Alerts */
.inline-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  color: var(--red);
  font-size: 12px;
}

.inline-error button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--green);
  font: inherit;
  font-weight: 700;
  text-decoration: underline;
}

.submit-error {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 13px;
  border: 1px solid var(--red);
  border-radius: 10px;
  background: var(--white);
  color: var(--red);
}

.submit-error svg {
  flex: 0 0 19px;
  width: 19px;
  height: 19px;
}

.submit-error p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
}

/* Buttons */
.button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 12px 18px;
  border: 1px solid transparent;
  border-radius: 10px;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition:
    background 150ms ease-out,
    border-color 150ms ease-out,
    opacity 150ms ease-out;
}

.button svg {
  width: 19px;
  height: 19px;
}

.button-primary {
  background: var(--green-dark);
  color: var(--white);
}

.button-primary:hover:not(:disabled) {
  background: var(--green);
}

.button-secondary {
  border-color: var(--border);
  background: var(--white);
  color: var(--green-dark);
}

.button-secondary:hover {
  border-color: var(--green);
  background: var(--green-light);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.submit-button {
  width: 100%;
  min-height: 52px;
  margin-top: 2px;
}

.button-loader {
  animation: rotate 900ms linear infinite;
}

@keyframes rotate {
  to {
    transform: rotate(360deg);
  }
}

/* Privacy note */
.privacy-note {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding-top: 15px;
  border-top: 1px solid var(--border);
}

.privacy-note svg {
  flex: 0 0 17px;
  width: 17px;
  height: 17px;
  color: var(--green);
}

.privacy-note p {
  margin: 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.7;
}

/* Success */
.success-panel {
  display: grid;
  justify-items: center;
  padding: 34px 25px;
  text-align: center;
}

.success-icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  margin-bottom: 17px;
  border-radius: 50%;
  background: var(--green-light);
  color: var(--green-dark);
}

.success-icon svg {
  width: 30px;
  height: 30px;
}

.success-eyebrow {
  color: var(--green);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
}

.success-panel h2 {
  margin: 10px 0;
  color: var(--green-dark);
  font-size: 22px;
  line-height: 1.35;
}

.success-panel > p {
  max-width: 390px;
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.7;
}

.success-summary {
  display: grid;
  gap: 5px;
  width: 100%;
  margin-top: 23px;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--background);
}

.success-summary > span {
  color: var(--muted);
  font-size: 11px;
}

.success-summary > strong {
  color: var(--green-dark);
  font-size: 14px;
}

.success-summary .success-price {
  margin-top: 7px;
  font-size: 23px;
  font-variant-numeric: tabular-nums;
}

.success-price small {
  color: var(--muted);
  font-size: 12px;
  font-weight: 400;
}

.success-actions {
  display: grid;
  gap: 10px;
  width: 100%;
  margin-top: 22px;
}

/* Footer */
.page-footer {
  margin: 22px 0 0;
  color: var(--muted);
  font-size: 11px;
  line-height: 1.7;
  text-align: center;
}

/* Accessibility */
button:focus-visible,
a:focus-visible,
select:focus-visible,
input:focus-visible {
  outline: 2px solid var(--green);
  outline-offset: 3px;
}

/* Responsive */
@media (min-width: 640px) {
  .report-page {
    padding-top: 45px;
  }

  .form-panel {
    padding: 30px;
    gap: 22px;
  }

  .success-actions {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .report-page {
    padding: 24px 15px 100px;
  }

  .page-header h1 {
    font-size: 26px;
  }

  .form-panel,
  .success-panel {
    padding: 19px;
    border-radius: 13px;
  }

  .form-heading h2 {
    font-size: 17px;
  }

  .price-input input {
    font-size: 21px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
