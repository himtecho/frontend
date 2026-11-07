# API Contract: HargaPangan v1

Acuan bersama **backend** dan **frontend** untuk aplikasi tema "pasar murah & sembako". Contoh angka di dokumen ini hanya ilustrasi. Kalau ada perubahan kontrak, **ubah dokumen ini dulu**, lalu umumkan di grup tim.

## 1. Konvensi Umum

| Hal                 | Aturan                                                                        |
| ------------------- | ----------------------------------------------------------------------------- |
| Base URL            | `/api/v1` (lokal: `http://localhost:3000/api/v1`)                             |
| Format              | JSON, UTF-8, `Content-Type: application/json`                                 |
| Penamaan field      | `camelCase`                                                                   |
| Harga               | Integer Rupiah tanpa desimal (`14500`). Format `Rp 14.500` dilakukan frontend |
| Jarak               | Angka dalam km, 1 desimal (`1.2`)                                             |
| Tanggal harga       | `YYYY-MM-DD`                                                                  |
| Tanggal & jam event | ISO 8601 dengan zona waktu (`2026-11-12T08:00:00+07:00`)                      |
| Koordinat           | `latitude`, `longitude` (number)                                              |
| Paginasi            | `limit` (default 20, maks 50). Tanpa `offset` untuk MVP                       |
| CORS                | Backend mengizinkan origin frontend (lokal dan produksi)                      |

### Envelope response

Sukses:

```json
{ "success": true, "data": {}, "meta": {} }
```

Error:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "price must be an integer", "details": [] }
}
```

### Kode error

| HTTP | `error.code`         | Kapan                             |
| ---- | -------------------- | --------------------------------- |
| 400  | `VALIDATION_ERROR`   | Parameter atau body tidak valid   |
| 404  | `NOT_FOUND`          | Data tidak ada                    |
| 422  | `PRICE_OUT_OF_RANGE` | Harga laporan di luar batas wajar |
| 429  | `RATE_LIMITED`       | Terlalu banyak request            |
| 500  | `INTERNAL_ERROR`     | Kesalahan server                  |

### Enum bersama

| Enum          | Nilai                                                      | Catatan                                                             |
| ------------- | ---------------------------------------------------------- | ------------------------------------------------------------------- |
| `source`      | `PIHPS`, `SEED`, `CITIZEN`                                 | Backend selalu menyertakan `sourceLabel` siap tampil                |
| `sourceLabel` | "Harga acuan kota (PIHPS BI)", "Estimasi", "Laporan warga" | Sesuai badge di desain                                              |
| `marketType`  | `TRADITIONAL`, `CHEAP_MARKET`, `STORE`, `SUPERMARKET`      | Menentukan warna/ikon marker                                        |
| `trend`       | `UP`, `DOWN`, `STABLE`                                     | `UP` jika perubahan >= +1%, `DOWN` jika <= -1%, selain itu `STABLE` |
| `eventStatus` | `ONGOING`, `UPCOMING`, `ENDED`                             | Dihitung backend dari `startAt`/`endAt`                             |

**Aturan perubahan harga:** `changePercent` membandingkan harga acuan terbaru dengan harga **7 hari sebelumnya**, dibulatkan 1 desimal.

## 2. Perubahan Skema Prisma yang Dibutuhkan

Skema minimal (Commodity, Market, Price, MarketEvent) perlu tambahan kecil agar sesuai dengan desain:

```prisma
model Commodity {
  // ...existing fields
  iconUrl String?
}

model Market {
  // ...existing fields
  openHours String?   // e.g. "05:00-14:00"; null when unknown
}

model MarketEvent {
  // ...existing fields
  organizer   String?
  description String?
}
```

Nilai `Market.type` ditambah `SUPERMARKET`.

## 3. Ringkasan Endpoint

| #   | Method | Path                       | Dipakai oleh                          |
| --- | ------ | -------------------------- | ------------------------------------- |
| 1   | GET    | `/prices/summary`          | Home                                  |
| 2   | GET    | `/commodities`             | Chip/dropdown komoditas, form laporan |
| 3   | GET    | `/commodities/:id`         | Detail komoditas (header)             |
| 4   | GET    | `/commodities/:id/history` | Grafik tren                           |
| 5   | GET    | `/commodities/:id/markets` | Daftar lokasi + harga per komoditas   |
| 6   | GET    | `/markets/nearby`          | Home, Peta, form laporan              |
| 7   | GET    | `/markets/:id`             | Detail pasar                          |
| 8   | GET    | `/events`                  | Home (banner), Jadwal Pasar Murah     |
| 9   | GET    | `/events/:id`              | Detail event                          |
| 10  | POST   | `/reports`                 | Form laporan harga                    |
| 11  | GET    | `/health`                  | Cek server                            |

Daftar kecamatan untuk pilihan lokasi manual (saat izin lokasi ditolak) **disimpan statis di frontend** (`districts.json` berisi nama, latitude, longitude), bukan lewat API.

## 4. Detail Endpoint

### 4.1 GET `/prices/summary`

Data kartu "Harga Hari Ini" di Home. Tanpa parameter (kota tetap).

```json
{
  "success": true,
  "data": {
    "updatedAt": "2026-11-07T08:30:00+07:00",
    "items": [
      {
        "commodityId": 1,
        "name": "Cabai Rawit Merah",
        "unit": "kg",
        "iconUrl": "/icons/cabai-rawit.png",
        "price": 74550,
        "previousPrice": 69000,
        "changePercent": 8.0,
        "trend": "UP",
        "source": "PIHPS",
        "sourceLabel": "Harga acuan kota (PIHPS BI)",
        "date": "2026-11-07"
      }
    ],
    "topRisers": [],
    "topFallers": []
  }
}
```

`topRisers` dan `topFallers` berisi maksimal 2 item dengan bentuk yang sama seperti `items` (diurutkan dari perubahan terbesar).

### 4.2 GET `/commodities`

Daftar ringan untuk chip dan dropdown.

```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Cabai Rawit Merah", "unit": "kg", "iconUrl": "/icons/cabai-rawit.png" }
  ]
}
```

### 4.3 GET `/commodities/:id`

Header halaman Detail Komoditas. Harga di sini juga dipakai sebagai petunjuk di form laporan.

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Cabai Rawit Merah",
    "unit": "kg",
    "iconUrl": "/icons/cabai-rawit.png",
    "price": 74550,
    "changePercent": 8.0,
    "trend": "UP",
    "source": "PIHPS",
    "sourceLabel": "Harga acuan kota (PIHPS BI)",
    "date": "2026-11-07"
  }
}
```

### 4.4 GET `/commodities/:id/history`

Query: `days` = `7` atau `30` (default `30`).

```json
{
  "success": true,
  "data": {
    "commodityId": 1,
    "unit": "kg",
    "points": [
      { "date": "2026-10-09", "price": 68000 },
      { "date": "2026-10-10", "price": 68500 }
    ],
    "stats": {
      "min": 66000,
      "minDate": "2026-10-15",
      "max": 74550,
      "maxDate": "2026-11-07",
      "average": 69800
    }
  }
}
```

`points` diurutkan tanggal naik, **satu titik per hari** (harga acuan kota).

### 4.5 GET `/commodities/:id/markets`

Daftar lokasi beserta harga untuk satu komoditas, diurutkan **termurah dulu**, lalu jarak.

| Query        | Wajib | Keterangan                                |
| ------------ | ----- | ----------------------------------------- |
| `lat`, `lon` | Tidak | Jika kosong, `distanceKm` bernilai `null` |
| `radius`     | Tidak | Km, default `5`                           |
| `limit`      | Tidak | Default `20`                              |

```json
{
  "success": true,
  "data": {
    "reference": {
      "price": 74550,
      "source": "PIHPS",
      "sourceLabel": "Harga acuan kota (PIHPS BI)",
      "date": "2026-11-07"
    },
    "items": [
      {
        "market": { "id": 3, "name": "Pasar Contoh", "type": "TRADITIONAL", "distanceKm": 1.2 },
        "price": 72000,
        "source": "SEED",
        "sourceLabel": "Estimasi",
        "date": "2026-11-07"
      }
    ]
  }
}
```

Aturan harga per lokasi: jika ada laporan warga dalam **72 jam terakhir**, harga = **median** laporan dengan `source = CITIZEN`. Jika tidak ada, pakai harga estimasi `SEED`. Lokasi tanpa data harga tidak ditampilkan.

### 4.6 GET `/markets/nearby`

| Query        | Wajib  | Keterangan                                    |
| ------------ | ------ | --------------------------------------------- |
| `lat`, `lon` | **Ya** | Koordinat pengguna                            |
| `radius`     | Tidak  | Km, default `5` (pilihan UI: 1, 3, 5)         |
| `type`       | Tidak  | Satu atau beberapa `marketType`, dipisah koma |
| `limit`      | Tidak  | Default `20`                                  |

```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "name": "Pasar Contoh",
      "type": "TRADITIONAL",
      "address": "Jl. Contoh No. 1",
      "latitude": -6.9,
      "longitude": 107.6,
      "distanceKm": 1.2,
      "openHours": "05:00-14:00",
      "isOpenNow": true,
      "topPrices": [
        { "commodityId": 1, "name": "Beras Medium", "unit": "kg", "price": 13800, "source": "SEED" }
      ]
    }
  ],
  "meta": { "count": 1, "radiusKm": 5 }
}
```

- Diurutkan jarak naik.
- `topPrices` maksimal 3 komoditas (untuk pop-up marker).
- `isOpenNow` bernilai `null` jika `openHours` tidak ada.

### 4.7 GET `/markets/:id`

```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "Pasar Contoh",
    "type": "TRADITIONAL",
    "address": "Jl. Contoh No. 1",
    "latitude": -6.9,
    "longitude": 107.6,
    "openHours": "05:00-14:00",
    "isOpenNow": true,
    "prices": [
      {
        "commodityId": 1,
        "name": "Beras Medium",
        "unit": "kg",
        "iconUrl": "/icons/beras.png",
        "price": 13800,
        "source": "SEED",
        "sourceLabel": "Estimasi",
        "date": "2026-11-07"
      }
    ]
  }
}
```

### 4.8 GET `/events`

| Query        | Wajib | Keterangan                                                    |
| ------------ | ----- | ------------------------------------------------------------- |
| `range`      | Tidak | `week` atau `month` (default `month`), dihitung dari hari ini |
| `status`     | Tidak | `ONGOING`, `UPCOMING`, `ALL`. Default: `ONGOING` + `UPCOMING` |
| `lat`, `lon` | Tidak | Jika ada, `distanceKm` terisi dan filter `radius` aktif       |
| `radius`     | Tidak | Km, default `10`                                              |
| `limit`      | Tidak | Default `20`                                                  |

```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "title": "Pasar Murah Kelurahan X",
      "organizer": "Dinas Perdagangan",
      "description": "Sembako bersubsidi untuk warga.",
      "startAt": "2026-11-12T08:00:00+07:00",
      "endAt": "2026-11-12T12:00:00+07:00",
      "status": "UPCOMING",
      "daysUntil": 5,
      "distanceKm": 2.4,
      "market": {
        "id": 9,
        "name": "Lapangan Kelurahan X",
        "address": "Jl. Contoh No. 5",
        "latitude": -6.91,
        "longitude": 107.61
      }
    }
  ]
}
```

Diurutkan `startAt` naik. `daysUntil` bernilai `0` untuk hari ini dan `null` jika event sudah berakhir. Event contoh diberi awalan **"\[Contoh\]"** di `title`.

### 4.9 GET `/events/:id`

Bentuk response sama dengan satu item pada `/events`.

### 4.10 POST `/reports`

Laporan harga dari warga, **tanpa login**.

Body:

```json
{ "marketId": 3, "commodityId": 1, "price": 72500 }
```

| Field         | Aturan                                    |
| ------------- | ----------------------------------------- |
| `marketId`    | Wajib, harus ada di database              |
| `commodityId` | Wajib, harus ada di database              |
| `price`       | Wajib, integer, antara 100 dan 10.000.000 |

Aturan tambahan:

- Harga harus berada di rentang **50%-200%** dari harga acuan kota komoditas tersebut, jika tidak: `422 PRICE_OUT_OF_RANGE`.
- Rate limit: **5 laporan per jam per IP**, jika terlampaui: `429 RATE_LIMITED`.
- Foto belum didukung di MVP. Tim desain dan frontend sepakati apakah tombol foto dihapus dari form untuk menghemat waktu.

Response `201`:

```json
{
  "success": true,
  "data": {
    "id": 101,
    "marketId": 3,
    "commodityId": 1,
    "price": 72500,
    "source": "CITIZEN",
    "createdAt": "2026-11-07T09:15:00+07:00"
  }
}
```

### 4.11 GET `/health`

```json
{ "success": true, "data": { "status": "ok" } }
```

## 5. Pemetaan Halaman ke Endpoint

| Halaman            | Endpoint                                                                             |
| ------------------ | ------------------------------------------------------------------------------------ |
| Home               | `/prices/summary`, `/markets/nearby?limit=3`, `/events?limit=1`                      |
| Peta               | `/markets/nearby` (filter `type`, `radius`)                                          |
| Detail Komoditas   | `/commodities/:id`, `/commodities/:id/history`, `/commodities/:id/markets`           |
| Detail Pasar       | `/markets/:id`                                                                       |
| Jadwal Pasar Murah | `/events`, `/events/:id`                                                             |
| Form Laporan       | `/commodities`, `/markets/nearby`, `/commodities/:id` (harga acuan), `POST /reports` |

## 6. Cara Kerja Tim

1. **Jam pertama:** backend menyiapkan file mock JSON statis (bentuk persis seperti dokumen ini) supaya frontend tidak menunggu. Frontend memakai flag `VITE_USE_MOCK=true`.
2. Endpoint asli menggantikan mock satu per satu. Urutan prioritas: `prices/summary`, `markets/nearby`, `commodities/:id/*`, `events`, `reports`.
3. Setiap perubahan bentuk response harus diumumkan dan dokumen diperbarui sebelum kode diubah.
4. Validasi input di backend memakai zod. Pesan error boleh bahasa Indonesia, `code` tetap bahasa Inggris dan stabil.
5. Jangan menghapus field yang sudah dipakai frontend. Menambah field baru boleh.
