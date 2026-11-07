<template>
  <main class="home-view">
    <!-- SAMBUTAN -->
    <section class="welcome">
      <p class="greeting">Selamat datang 👋</p>
      <h2>Belanja pintar dimulai dari sini.</h2>
      <p>Pantau harga sembako dan temukan pasar murah di sekitarmu.</p>
    </section>

    <!-- PENCARIAN -->
    <section class="search-section">
      <input type="text" v-model="searchQuery" placeholder="Cari beras, minyak, telur..." />
    </section>

    <!-- HARGA SEMBAKO -->
    <section class="prices">
      <div class="section-heading">
        <div>
          <h2>Harga Sembako</h2>
          <p>Pantau harga kebutuhan pokok hari ini.</p>
        </div>
        <span class="mock-label">DATA CONTOH</span>
      </div>

      <p class="updated-time">
        {{ updatedAt }}
      </p>

      <div class="price-grid">
        <p v-if="filteredProducts.length === 0">Komoditas tidak ditemukan.</p>

        <div v-for="product in filteredProducts" :key="product.name" class="price-card">
          <h3>{{ product.name }}</h3>
          <h2>{{ formatPrice(product.price) }}</h2>
          <p>per {{ product.unit }}</p>
        </div>
      </div>
    </section>

    <!-- PERGERAKAN HARGA -->
    <section class="movement-section">
      <h2>Pergerakan Harga Minggu Ini</h2>
      <p class="section-description">Komoditas dengan perubahan harga terbesar.</p>

      <div class="movement-grid">
        <div class="movement-card">
          <h3>🔺 Harga Paling Naik</h3>
          <div>
            <p v-for="item in topRisers" :key="item.name">{{ item.name }} — {{ item.change }}%</p>
          </div>
        </div>

        <div class="movement-card">
          <h3>🔻 Harga Paling Turun</h3>
          <div>
            <p v-for="item in topFallers" :key="item.name">{{ item.name }} — {{ item.change }}%</p>
          </div>
        </div>
      </div>
    </section>

    <!-- PASAR TERDEKAT -->
    <section class="nearby-section">
      <div class="section-heading">
        <div>
          <h2>Pasar Terdekat</h2>
          <p>Temukan tempat belanja di sekitarmu.</p>
        </div>
        <a href="/peta" class="see-more">Lihat peta →</a>
      </div>

      <div class="market-list">
        <div v-for="market in nearbyMarkets" :key="market.id" class="market-item">
          <div>
            <h3>{{ market.name }}</h3>
            <p>{{ market.address }}</p>
            <p>{{ market.distanceKm }} km</p>
          </div>
        </div>
      </div>
    </section>

    <!-- BANNER PASAR MURAH -->
    <section class="promo">
      <p class="promo-tag">PASAR TERMURAH</p>
      <h2>Belanja hemat, kebutuhan tetap terpenuhi!</h2>
      <p>Temukan jadwal pasar murah dan kesempatan mendapatkan sembako dengan harga terjangkau.</p>
      <button type="button" @click="goToSchedule">Lihat Jadwal Pasar Murah</button>
    </section>

    <!-- JADWAL PASAR MURAH -->
    <section class="events-section">
      <h2>Jadwal Pasar Murah</h2>
      <p class="section-description">Informasi kegiatan pasar murah mendatang.</p>

      <div class="event-card" v-if="upcomingEvent">
        <h3>{{ upcomingEvent.title }}</h3>
        <p>{{ upcomingEvent.date }}</p>
        <p>{{ upcomingEvent.location }}</p>
      </div>

      <p v-else>Belum ada jadwal pasar murah.</p>
    </section>

    <!-- CATATAN SUMBER DATA -->
    <footer class="footer">
      <p>Harga dapat berasal dari PIHPS, estimasi, atau laporan warga.</p>
      <p>© 2026 MURAH. Belanja lebih bijak.</p>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Product {
  name: string
  price: number
  unit: string
  change: number
}

interface Market {
  id: number
  name: string
  address: string
  distanceKm: number
}

const searchQuery = ref('')

const updatedAt = 'Diperbarui hari ini, 08.30 WIB'

// Data sementara untuk tampilan.
// Nantinya akan diganti dengan respons API tim.
const products = ref<Product[]>([
  { name: 'Beras', price: 15000, unit: 'kg', change: 2.5 },
  { name: 'Minyak Goreng', price: 18000, unit: 'liter', change: -1.2 },
  { name: 'Telur Ayam', price: 28000, unit: 'kg', change: 1.8 },
  { name: 'Gula Pasir', price: 17500, unit: 'kg', change: -0.8 },
  { name: 'Cabai Merah', price: 45000, unit: 'kg', change: 5.2 },
  { name: 'Bawang Merah', price: 38000, unit: 'kg', change: -2.1 },
  { name: 'Bawang Putih', price: 42000, unit: 'kg', change: 0.5 },
  { name: 'Daging Ayam', price: 36000, unit: 'kg', change: 1.1 },
])

const nearbyMarkets = ref<Market[]>([
  {
    id: 1,
    name: 'Pasar Contoh 1',
    address: 'Jl. Merdeka',
    distanceKm: 1.2,
  },
  {
    id: 2,
    name: 'Pasar Contoh 2',
    address: 'Jl. Sudirman',
    distanceKm: 2.4,
  },
  {
    id: 3,
    name: 'Pasar Murah Contoh',
    address: 'Jl. Mawar',
    distanceKm: 3.1,
  },
])

const upcomingEvent = ref({
  title: 'Pasar Murah Minggu Ini',
  date: 'Sabtu, 14 November 2026',
  location: 'Lokasi contoh',
})

const filteredProducts = computed(() => {
  return products.value.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
})

const topRisers = computed(() =>
  [...products.value]
    .filter((item) => item.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 3)
)

const topFallers = computed(() =>
  [...products.value]
    .filter((item) => item.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, 3)
)

function formatPrice(price: number) {
  return 'Rp ' + price.toLocaleString('id-ID')
}

function goToSchedule() {
  window.location.href = '/jadwal'
}
</script>
