# Frontend — Pasar Murah & Sembako
 
Aplikasi web mobile-first untuk melihat harga bahan pokok, mencari pasar/toko terdekat, melihat jadwal pasar murah, dan melaporkan harga.
 
> **Sumber kebenaran API:** `API_Contract_HargaPangan_v1.md`. Jika README ini berbeda dengan kontrak, ikuti kontrak.
 
## Tech Stack
 
| Kebutuhan | Library |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Build tool | Vite |
| Routing | Vue Router 4 |
| HTTP client | Axios |
| Peta | Leaflet + OpenStreetMap tiles |
| Grafik | Chart.js + vue-chartjs |
| Styling | CSS biasa (mobile-first, lebar target 360–390 px) |
 
## Prasyarat
 
- Node.js 18+
- Backend berjalan di `http://localhost:3000` (atau pakai mode mock, lihat di bawah)
## Menjalankan
 
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # output ke dist/
npm run preview    # cek hasil build
```
 
Request ke `/api/*` otomatis diproxy ke backend lewat `vite.config.js` (mencakup `/api/v1`), jadi tidak perlu setting CORS saat development.
 
## Environment Variable
 
| File | Isi | Keterangan |
|---|---|---|
| `.env.development` | `VITE_USE_MOCK=true` | Pakai mock JSON selama backend belum siap |
| `.env.production` | `VITE_API_BASE_URL=https://nama-backend.onrender.com/api/v1` | URL backend saat deploy |
 
`src/api/client.js`:
 
```js
import axios from 'axios'
 
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
 
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 10000,
})
 
// Unwrap envelope { success, data, meta } -> { data, meta }
// Normalize errors to { code, message, status, details }
api.interceptors.response.use(
  (res) => ({ data: res.data.data, meta: res.data.meta }),
  (err) => {
    const apiError = err.response?.data?.error
    return Promise.reject({
      code: apiError?.code || 'NETWORK_ERROR',
      message: apiError?.message || 'Gagal terhubung ke server',
      status: err.response?.status,
      details: apiError?.details || [],
    })
  }
)
```
 
Pemakaian: `const { data, meta } = await api.get('/prices/summary')`.
 
## Mode Mock
 
Selama endpoint backend belum jadi, frontend memakai file JSON statis di `src/mock/` dengan bentuk **persis sama** seperti contoh di kontrak (satu file per endpoint). Saat `VITE_USE_MOCK=true`, wrapper endpoint membaca mock; endpoint asli menggantikan mock satu per satu. Urutan: `prices/summary`, `markets/nearby`, `commodities/:id/*`, `events`, `reports`.
 
## Struktur Folder
 
```
src/
├── api/
│   └── client.js            # axios instance + unwrap envelope
├── mock/                    # JSON mock sesuai kontrak (VITE_USE_MOCK)
├── data/
│   └── districts.json       # kecamatan: nama, latitude, longitude (statis)
├── components/
│   ├── BottomNav.vue        # navigasi 4 tab
│   ├── PriceCard.vue        # kartu harga komoditas
│   ├── SourceBadge.vue      # badge PIHPS / Estimasi / Laporan warga
│   ├── TrendIndicator.vue   # panah naik/turun/stabil + persen
│   ├── PriceChart.vue       # grafik tren harga
│   ├── MarketMap.vue        # wrapper Leaflet
│   ├── EventCard.vue        # kartu pasar murah
│   ├── LoadingSkeleton.vue
│   └── EmptyState.vue
├── composables/
│   ├── useGeolocation.js    # posisi pengguna + fallback kecamatan
│   └── useFetch.js          # loading / error / data / meta
├── views/
│   ├── HomeView.vue
│   ├── MapView.vue
│   ├── CommodityDetailView.vue
│   ├── MarketDetailView.vue
│   ├── ScheduleView.vue
│   └── ReportView.vue
├── router/index.ts
├── utils/
│   └── format.js            # formatRupiah, formatJarak, formatTanggal
├── App.vue
├── main.js
└── style.css
```
 
## Routing
 
| Path | View | Keterangan |
|---|---|---|
| `/` | HomeView | Harga hari ini, highlight naik/turun, banner pasar murah, pasar terdekat |
| `/map` | MapView | Peta + filter jenis/radius + daftar lokasi |
| `/commodity/:id` | CommodityDetailView | Grafik tren, ringkasan, daftar lokasi + harga |
| `/market/:id` | MarketDetailView | Detail pasar + daftar harga (`/markets/:id`) |
| `/schedule` | ScheduleView | Jadwal pasar murah |
| `/report` | ReportView | Form laporan harga warga |
 
Bottom navigation (4 tab): **Beranda, Peta, Pasar Murah, Lapor**. Detail komoditas diakses dari kartu harga di Home, detail pasar dari popup marker atau daftar.
 
## Endpoint yang Dipakai
 
Base URL `/api/v1`. Parameter koordinat bernama **`lat`** dan **`lon`**.
 
| Method | Endpoint | Dipakai di |
|---|---|---|
| GET | `/prices/summary` | Home (kartu harga, naik/turun terbesar) |
| GET | `/commodities` | Chip/dropdown komoditas, form laporan |
| GET | `/commodities/:id` | Header detail komoditas, petunjuk harga di form |
| GET | `/commodities/:id/history?days=7\|30` | Grafik tren |
| GET | `/commodities/:id/markets?lat=&lon=&radius=` | Daftar lokasi + harga di detail komoditas |
| GET | `/markets/nearby?lat=&lon=&radius=&type=&limit=` | Home, Peta, form laporan |
| GET | `/markets/:id` | Detail pasar |
| GET | `/events?range=week\|month&lat=&lon=&limit=` | Jadwal, banner Home |
| GET | `/events/:id` | Detail event |
| POST | `/reports` | Form laporan |
| GET | `/health` | Cek server |
 
## Detail per Halaman
 
### Home
- Kartu harga dari `/prices/summary`: nama, harga, satuan, `changePercent` vs 7 hari lalu
- Highlight `topRisers` dan `topFallers` (maks 2 item)
- Banner event terdekat: `/events?limit=1`
- 3 pasar terdekat: `/markets/nearby?limit=3` (butuh lokasi pengguna)
- Footer sumber data: PIHPS Bank Indonesia dan OpenStreetMap
### Peta
- Marker berbeda warna per `marketType`: `TRADITIONAL`, `CHEAP_MARKET`, `STORE`, `SUPERMARKET`
- Filter: jenis lokasi (`type`, dipisah koma) dan radius (1/3/5 km)
- Popup marker: nama, jarak, `topPrices` (maks 3), tombol Detail dan Rute
- Status `isOpenNow` bisa `null` (jam buka tidak diketahui): jangan tampilkan "tutup"
- Tombol Rute membuka Google Maps: `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG`
### Detail Komoditas
- Header: nama, harga acuan, badge perubahan
- Grafik garis 7 / 30 hari (toggle), satu titik per hari
- Ringkasan dari `stats`: min, max, average
- Daftar lokasi diurutkan termurah, dengan `sourceLabel`
- Tombol "Laporkan harga"
### Detail Pasar
- Info pasar: nama, jenis, alamat, jam buka
- Daftar harga komoditas dengan badge sumber
### Jadwal Pasar Murah
- Kartu event: judul, penyelenggara, tanggal & jam, lokasi, `distanceKm`
- Penanda dari `status` dan `daysUntil`: Sedang berlangsung / Hari ini / Besok / N hari lagi / Selesai
- Judul event contoh berawalan "[Contoh]", tampilkan apa adanya
- Tombol Rute
### Form Laporan
- Field: pasar/toko, komoditas, harga (angka). **Foto belum didukung di MVP**, jangan tampilkan tombol foto
- Tampilkan harga acuan (dari `/commodities/:id`) sebagai petunjuk di bawah input harga
- Validasi lokal: harga integer, 100 sampai 10.000.000
- Error dari server:
  - `422 PRICE_OUT_OF_RANGE`: harga harus di antara 50%–200% harga acuan, tampilkan pesan di bawah input
  - `429 RATE_LIMITED`: maksimal 5 laporan per jam, tampilkan pesan "coba lagi nanti"
- Setelah sukses (`201`): pesan terima kasih dan reset form
## Komponen Kunci
 
**SourceBadge** — prop `source`: `PIHPS`, `SEED`, `CITIZEN`. Teks label ambil dari field `sourceLabel` yang dikirim backend ("Harga acuan kota (PIHPS BI)", "Estimasi", "Laporan warga"). Tiga gaya yang mudah dibedakan.
 
**TrendIndicator** — prop `trend` (`UP`, `DOWN`, `STABLE`) dan `percent` (`changePercent`). Naik = merah + panah atas, turun = hijau + panah bawah, stabil = abu. Jangan hitung ulang di frontend, `trend` sudah ditentukan backend (ambang ±1%).
 
**MarketMap** — prop `markets`, `center`. Pastikan `leaflet/dist/leaflet.css` diimpor di `main.js`.
 
> Perbaikan ikon marker Leaflet di Vite: import ikon secara manual lalu set `L.Icon.Default.mergeOptions({ iconUrl, shadowUrl, iconRetinaUrl })`, jika tidak ikon default tidak muncul.
 
## Lokasi Pengguna
 
- Pakai `navigator.geolocation` (butuh HTTPS di produksi).
- Jika izin ditolak: tampilkan pilihan kecamatan dari `src/data/districts.json` (statis, bukan dari API).
- Titik tengah default (fallback) sesuai kota data: **Bandung** (`-6.9175, 107.6191`), bukan Jakarta.
## State Wajib di Setiap Halaman
 
- **Loading**: skeleton, bukan spinner kosong
- **Error**: pesan singkat + tombol "Coba lagi"
- **Kosong**: contoh "Tidak ada pasar dalam radius 3 km"
- **Izin lokasi ditolak**: pilih kecamatan manual
Gunakan composable `useFetch` supaya pola ini seragam:
 
```js
// src/composables/useFetch.js
import { ref } from 'vue'
 
export function useFetch(fn) {
  const data = ref(null), meta = ref(null), loading = ref(false), error = ref(null)
  async function run(...args) {
    loading.value = true; error.value = null
    try {
      const res = await fn(...args)   // { data, meta } from the api client
      data.value = res.data; meta.value = res.meta
    } catch (e) { error.value = e }   // { code, message, status, details }
    finally { loading.value = false }
  }
  return { data, meta, loading, error, run }
}
```
 
## Utilitas Format
 
```js
// src/utils/format.js
export const formatRupiah = n => 'Rp ' + n.toLocaleString('id-ID')
export const formatJarak = km => km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
```
 
Aturan tampilan sesuai kontrak: harga integer Rupiah (`14500` jadi `Rp 14.500`), jarak 1 desimal, tanggal event ISO 8601 dengan zona waktu (+07:00).
 
## Panduan UI
 
- Mobile-first, lebar 360–390 px; container maks 420 px di desktop
- Harga adalah elemen paling menonjol di kartu (font besar, kontras tinggi)
- Satu aksi utama per layar
- Palet utama hijau/oranye hangat; **merah hanya untuk harga naik**
- Selalu tampilkan tanggal/waktu pembaruan (`date`, `updatedAt`) di dekat harga
## Pembagian Kerja
 
| Orang | Cakupan |
|---|---|
| Frontend A | Setup, Home, Peta, Detail + grafik, deploy |
| Frontend B | Komponen UI, Jadwal, Form laporan, polish, state loading/kosong |
 
Feature freeze di jam ke-9.
 
## Deploy (Vercel / Netlify)
 
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL` (diakhiri `/api/v1`)
- Tambahkan SPA fallback agar refresh di route selain `/` tidak 404:
  - **Vercel**: `vercel.json` → `{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }`
  - **Netlify**: file `public/_redirects` → `/* /index.html 200`
## Checklist Sebelum Demo
 
- [ ] `VITE_USE_MOCK` tidak aktif di build produksi
- [ ] Semua halaman terbuka tanpa error di HP asli
- [ ] Geolocation berfungsi (butuh HTTPS di produksi)
- [ ] Fallback pilih kecamatan jika lokasi ditolak
- [ ] Grafik tampil (data PIHPS saat ini hanya beberapa hari, pastikan tidak terlihat kosong)
- [ ] Form laporan berhasil kirim, error 422 dan 429 tampil jelas
- [ ] Link demo + video rekaman cadangan siap
 