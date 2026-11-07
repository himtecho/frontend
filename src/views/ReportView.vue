<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getNearbyMarkets, getPriceSummary, submitReport } from '../services/api'
import type { Market, PriceItem } from '../types/api'

const markets = ref<Market[]>([])
const commodities = ref<PriceItem[]>([])

const marketId = ref('')
const commodityId = ref('')
const price = ref<number | null>(null)

const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const selectedCommodity = computed(() =>
  commodities.value.find((item) => item.commodityId === commodityId.value)
)

const formattedPrice = computed(() => {
  if (!price.value || price.value <= 0) return ''

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(price.value)
})

async function loadFormData() {
  loading.value = true
  errorMessage.value = ''

  try {
    const [marketData, priceData] = await Promise.all([
      getNearbyMarkets({
        lat: -6.9175,
        lon: 107.6191,
        radius: 5,
        limit: 20,
      }),
      getPriceSummary(),
    ])

    markets.value = marketData
    commodities.value = priceData.items

    if (markets.value.length > 0) {
      marketId.value = String(markets.value[0].id)
    }

    if (commodities.value.length > 0) {
      commodityId.value = commodities.value[0].commodityId
    }
  } catch (error) {
    console.error('Gagal memuat data laporan:', error)
    errorMessage.value = 'Data pasar atau komoditas gagal dimuat. Coba muat ulang halaman.'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  successMessage.value = ''
  errorMessage.value = ''

  if (!marketId.value || !commodityId.value) {
    errorMessage.value = 'Pilih pasar dan komoditas terlebih dahulu.'
    return
  }

  if (price.value === null || !Number.isFinite(price.value) || price.value <= 0) {
    errorMessage.value = 'Masukkan harga yang valid dan lebih dari nol.'
    return
  }

  submitting.value = true

  try {
    const result = await submitReport({
      marketId: marketId.value,
      commodityId: commodityId.value,
      price: Math.round(price.value),
    })

    successMessage.value = result?.mock
      ? 'Laporan simulasi berhasil dibuat! Data belum dikirim ke server.'
      : 'Laporan harga berhasil dikirim. Terima kasih sudah berkontribusi!'

    price.value = null
  } catch (error) {
    console.error('Gagal mengirim laporan:', error)
    errorMessage.value = 'Laporan gagal dikirim. Periksa koneksi atau coba lagi nanti.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadFormData)
</script>

<template>
  <main class="report-page">
    <section class="report-hero">
      <div class="hero-icon">📝</div>
      <div>
        <p class="hero-label">KONTRIBUSI MASYARAKAT</p>
        <h1>Lapor Harga</h1>
        <p>Bantu masyarakat mendapatkan informasi harga sembako terkini.</p>
      </div>
    </section>

    <section class="report-content">
      <div class="report-heading">
        <h2>Buat Laporan Harga</h2>
        <p>Isi informasi harga yang kamu temukan di pasar.</p>
      </div>

      <div v-if="loading" class="report-state">
        <div class="spinner"></div>
        <p>Memuat data pasar dan komoditas...</p>
      </div>

      <div v-else-if="errorMessage && markets.length === 0" class="report-alert error">
        {{ errorMessage }}
        <button class="retry-button" @click="loadFormData">Coba Lagi</button>
      </div>

      <form v-else class="report-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="market">Pilih Pasar</label>
          <select id="market" v-model="marketId" required>
            <option value="" disabled>Pilih lokasi pasar</option>
            <option v-for="market in markets" :key="market.id" :value="String(market.id)">
              {{ market.name }}
            </option>
          </select>
          <small>Pilih lokasi tempat kamu mengecek harga.</small>
        </div>

        <div class="form-group">
          <label for="commodity">Komoditas Sembako</label>
          <select id="commodity" v-model="commodityId" required>
            <option value="" disabled>Pilih komoditas</option>
            <option v-for="item in commodities" :key="item.commodityId" :value="item.commodityId">
              {{ item.name }} ({{ item.unit }})
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="price">Harga yang Ditemukan</label>
          <div class="price-input">
            <span>Rp</span>
            <input
              id="price"
              v-model.number="price"
              type="number"
              min="1"
              step="1"
              placeholder="Contoh: 15000"
              required
            />
          </div>

          <small v-if="selectedCommodity"> Satuan komoditas: {{ selectedCommodity.unit }} </small>

          <p v-if="formattedPrice" class="price-preview">
            Harga laporan: <strong>{{ formattedPrice }}</strong>
          </p>
        </div>

        <div v-if="errorMessage" class="report-alert error">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="report-alert success">
          <strong>✓ Berhasil!</strong>
          <p>{{ successMessage }}</p>
        </div>

        <button
          type="submit"
          class="submit-button"
          :disabled="submitting || markets.length === 0 || commodities.length === 0"
        >
          {{ submitting ? 'Mengirim laporan...' : 'Kirim Laporan Harga' }}
        </button>
      </form>
    </section>

    <section class="report-info">
      <div class="info-icon">💡</div>
      <div>
        <h3>Tips Melaporkan Harga</h3>
        <p>
          Pastikan harga sesuai dengan kondisi sebenarnya di pasar. Laporan yang akurat membantu
          masyarakat membandingkan harga sembako.
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.report-page {
  max-width: 850px;
  margin: 0 auto;
  padding: 28px 22px 110px;
  color: #243b2d;
}

.report-hero {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 30px;
  border-radius: 22px;
  background: linear-gradient(135deg, #167b45, #269b5d);
  color: white;
  margin-bottom: 28px;
}

.hero-icon {
  width: 65px;
  height: 65px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 30px;
}

.hero-label {
  margin: 0 0 7px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.5px;
  opacity: 0.8;
}

.report-hero h1 {
  margin: 0 0 8px;
  font-size: 29px;
  font-weight: 800;
}

.report-hero p:last-child {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  opacity: 0.9;
}

.report-content {
  padding: 28px;
  border: 1px solid #e7eee8;
  border-radius: 20px;
  background: white;
  box-shadow: 0 8px 30px rgba(30, 80, 48, 0.05);
}

.report-heading {
  margin-bottom: 25px;
}

.report-heading h2 {
  margin: 0 0 7px;
  font-size: 21px;
}

.report-heading p {
  margin: 0;
  color: #7b8b80;
  font-size: 14px;
}

.report-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.form-group label {
  font-size: 14px;
  font-weight: 700;
}

.form-group select,
.form-group input {
  width: 100%;
  min-height: 49px;
  padding: 0 14px;
  border: 1px solid #dce7df;
  border-radius: 11px;
  outline: none;
  background: #fbfdfb;
  color: #263d2e;
  font: inherit;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group select:focus,
.form-group input:focus {
  border-color: #269b5d;
  box-shadow: 0 0 0 3px rgba(38, 155, 93, 0.1);
}

.form-group small {
  color: #849087;
  font-size: 12px;
}

.price-input {
  display: flex;
  align-items: center;
  border: 1px solid #dce7df;
  border-radius: 11px;
  background: #fbfdfb;
  overflow: hidden;
}

.price-input span {
  padding-left: 15px;
  font-weight: 700;
  color: #269b5d;
}

.price-input input {
  border: none;
  background: transparent;
  box-shadow: none !important;
}

.price-preview {
  margin: 0;
  color: #64756a;
  font-size: 13px;
}

.price-preview strong {
  color: #16834a;
}

.submit-button {
  min-height: 51px;
  border: none;
  border-radius: 12px;
  background: #19864b;
  color: white;
  font-size: 15px;
  font-weight: 750;
  cursor: pointer;
  transition:
    background 0.2s,
    transform 0.2s;
}

.submit-button:hover:not(:disabled) {
  background: #126b3b;
  transform: translateY(-1px);
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.report-alert {
  padding: 14px 16px;
  border-radius: 11px;
  font-size: 13px;
  line-height: 1.6;
}

.report-alert p {
  margin: 4px 0 0;
}

.report-alert.error {
  background: #fff0ef;
  color: #b7352e;
}

.report-alert.success {
  background: #eaf8ef;
  color: #197344;
}

.report-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 35px 10px;
  color: #738278;
  font-size: 14px;
}

.spinner {
  width: 21px;
  height: 21px;
  border: 3px solid #dcece1;
  border-top-color: #19864b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.retry-button {
  display: block;
  margin-top: 10px;
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  background: #19864b;
  color: white;
  cursor: pointer;
}

.report-info {
  display: flex;
  gap: 15px;
  margin-top: 22px;
  padding: 20px;
  border: 1px solid #f1e5bd;
  border-radius: 16px;
  background: #fffaf0;
}

.info-icon {
  font-size: 25px;
}

.report-info h3 {
  margin: 0 0 7px;
  font-size: 15px;
}

.report-info p {
  margin: 0;
  color: #7b7768;
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 600px) {
  .report-page {
    padding: 20px 15px 105px;
  }

  .report-hero {
    padding: 23px 19px;
    gap: 14px;
  }

  .hero-icon {
    width: 52px;
    height: 52px;
    font-size: 24px;
  }

  .report-hero h1 {
    font-size: 24px;
  }

  .report-content {
    padding: 21px 17px;
  }
}
</style>
