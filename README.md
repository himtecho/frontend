# Frontend — Pasar Murah & Sembako
 
Aplikasi web mobile-first untuk melihat harga bahan pokok, mencari pasar/toko terdekat, melihat jadwal pasar murah, dan melaporkan harga.
 
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
- Backend berjalan di `http://localhost:3000`
## Menjalankan
 
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # output ke dist/
npm run preview    # cek hasil build
```
 
Request ke `/api/*` otomatis diproxy ke backend lewat `vite.config.js`, jadi tidak perlu setting CORS saat development.
 
## Environment Variable
 
Buat `.env.production` untuk deploy:
 
```
VITE_API_BASE_URL=https://nama-backend.onrender.com/api
```
 
Lalu di `src/api/client.js`:
 
```js
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api'
})
```
 
## Struktur Folder
 
```
src/
├── api/
│   └── client.js            # axios instance
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
│   ├── useGeolocation.js    # posisi pengguna + fallback
│   └── useFetch.js          # loading / error / data
├── views/
│   ├── HomeView.vue
│   ├── MapView.vue
│   ├── CommodityDetailView.vue
│   ├── ScheduleView.vue
│   └── ReportView.vue
├── router/index.js
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
| `/schedule` | ScheduleView | Jadwal pasar murah |
| `/report` | ReportView | Form laporan harga warga |
 
Bottom navigation (4 tab): **Beranda, Peta, Pasar Murah, Lapor**. Detail komoditas diakses dari kartu harga di Home.
 
## Kontrak API yang Dipakai
 
| Method | Endpoint | Dipakai di |
|---|---|---|
| GET | `/api/prices/latest` | Home |
| GET | `/api/commodities/:id` | Detail komoditas |
| GET | `/api/prices/history?commodityId=&days=30` | Grafik tren |
| GET | `/api/markets/nearby?lat=&lng=&radius=` | Home, Peta, Detail |
| GET | `/api/events?range=week` | Jadwal, banner Home |
| POST | `/api/reports` | Form laporan |
 
Jika bentuk response berubah, perbarui bagian ini dan koordinasikan dengan Backend.
 
## Detail per Halaman
 
### Home
- Kartu harga 8–10 komoditas: nama, harga, satuan, persen perubahan vs 7 hari lalu
- Highlight "Naik terbesar" dan "Turun terbesar" minggu ini
- Banner event pasar murah terdekat
- 3 pasar terdekat (butuh lokasi pengguna)
- Footer sumber data: PIHPS Bank Indonesia dan OpenStreetMap
### Peta
- Marker berbeda warna per jenis: pasar tradisional, pasar murah, toko
- Filter: jenis lokasi dan radius (1/3/5 km)
- Popup marker: nama, jarak, tombol Detail dan Rute
- Tombol Rute membuka Google Maps: `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG`
### Detail Komoditas
- Header: nama, harga acuan, badge perubahan
- Grafik garis 7 / 30 hari (toggle)
- Ringkasan: terendah, tertinggi, rata-rata
- Daftar lokasi diurutkan termurah, dengan badge sumber
- Tombol "Laporkan harga"
### Jadwal Pasar Murah
- Kartu event: judul, tanggal & jam, lokasi, jarak
- Penanda status: Hari ini / Besok / Akan datang / Selesai
- Tombol Rute
### Form Laporan
- Field: pasar/toko, komoditas, harga (angka), foto opsional
- Tampilkan harga acuan sebagai petunjuk di bawah input harga
- Validasi: harga wajib angka positif
- Setelah sukses: pesan terima kasih dan reset form
## Komponen Kunci
 
**SourceBadge** — prop `source`: `PIHPS`, `SEED`, `CITIZEN`. Tiga gaya yang mudah dibedakan (label: "Harga acuan kota", "Estimasi", "Laporan warga").
 
**TrendIndicator** — prop `percent`. Naik = merah + panah atas, turun = hijau + panah bawah, stabil (|%| < 1) = abu.
 
**MarketMap** — prop `markets`, `center`. Pastikan `leaflet/dist/leaflet.css` diimpor di `main.js`.
 
> Perbaikan ikon marker Leaflet di Vite: import ikon secara manual lalu set `L.Icon.Default.mergeOptions({ iconUrl, shadowUrl, iconRetinaUrl })`, jika tidak ikon default tidak muncul.
 
## State Wajib di Setiap Halaman
 
- **Loading**: skeleton, bukan spinner kosong
- **Error**: pesan singkat + tombol "Coba lagi"
- **Kosong**: contoh "Tidak ada pasar dalam radius 3 km"
- **Izin lokasi ditolak**: pilih kecamatan/kota manual (fallback ke titik tengah kota default)
Gunakan composable `useFetch` supaya pola ini seragam:
 
```js
// src/composables/useFetch.js
import { ref } from 'vue'
export function useFetch(fn) {
  const data = ref(null), loading = ref(false), error = ref(null)
  async function run(...args) {
    loading.value = true; error.value = null
    try { data.value = await fn(...args) }
    catch (e) { error.value = e }
    finally { loading.value = false }
  }
  return { data, loading, error, run }
}
```
 
## Utilitas Format
 
```js
// src/utils/format.js
export const formatRupiah = n => 'Rp ' + n.toLocaleString('id-ID')
export const formatJarak = km => km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
```
 
## Panduan UI
 
- Mobile-first, lebar 360–390 px; container maks 420 px di desktop
- Harga adalah elemen paling menonjol di kartu (font besar, kontras tinggi)
- Satu aksi utama per layar
- Palet utama hijau/oranye hangat; **merah hanya untuk harga naik**
- Selalu tampilkan waktu pembaruan terakhir di dekat harga
## Pembagian Kerja
 
| Orang | Cakupan |
|---|---|
| Frontend A | Setup, Home, Peta, Detail + grafik, deploy |
| Frontend B | Komponen UI, Jadwal, Form laporan, polish, state loading/kosong |
 
Feature freeze di jam ke-9.
 
## Deploy (Vercel / Netlify)
 
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL`
- Tambahkan SPA fallback agar refresh di route selain `/` tidak 404:
  - **Vercel**: `vercel.json` → `{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }`
  - **Netlify**: file `public/_redirects` → `/* /index.html 200`
## Checklist Sebelum Demo
 
- [ ] Semua halaman terbuka tanpa error di HP asli
- [ ] Geolocation berfungsi (butuh HTTPS di produksi)
- [ ] Fallback jika lokasi ditolak
- [ ] Grafik tampil dengan data 30 hari
- [ ] Form laporan berhasil kirim dan data muncul
- [ ] Link demo + video rekaman cadangan siap