import type { Market, MarketEvent, PriceItem, PriceSource, PriceSummary } from '../types/api'

// Mock data in the exact shape of the API contract (used when VITE_USE_MOCK=true).
// Prices are the real PIHPS values: 30 Oct vs 6 Nov 2026.

const SOURCE_LABEL: Record<PriceSource, string> = {
  PIHPS: 'Harga acuan kota (PIHPS BI)',
  SEED: 'Estimasi',
  CITIZEN: 'Laporan warga',
}

const item = (
  commodityId: number,
  name: string,
  unit: string,
  price: number,
  previousPrice: number,
  source: PriceSource = 'PIHPS'
): PriceItem => {
  const changePercent = Math.round(((price - previousPrice) / previousPrice) * 1000) / 10
  return {
    commodityId,
    name,
    unit,
    iconUrl: null,
    price,
    previousPrice,
    changePercent,
    trend: changePercent >= 1 ? 'UP' : changePercent <= -1 ? 'DOWN' : 'STABLE',
    source,
    sourceLabel: SOURCE_LABEL[source],
    date: '2026-11-06',
  }
}

export const mockPriceSummary: PriceSummary = {
  updatedAt: new Date().toISOString(),
  items: [
    item(1, 'Beras Kualitas Medium I', 'kg', 16700, 16650),
    item(2, 'Beras Kualitas Super I', 'kg', 18050, 18000),
    item(3, 'Daging Ayam Ras Segar', 'kg', 38600, 39000),
    item(4, 'Daging Sapi Kualitas 1', 'kg', 153300, 152700),
    item(5, 'Telur Ayam Ras Segar', 'kg', 29200, 29350),
    item(6, 'Bawang Merah Ukuran Sedang', 'kg', 37500, 37100),
    item(7, 'Bawang Putih Ukuran Sedang', 'kg', 38550, 38250),
    item(8, 'Cabai Merah Keriting', 'kg', 88900, 83500),
    item(9, 'Cabai Rawit Merah', 'kg', 96700, 96200),
    item(10, 'Minyak Goreng Curah', 'liter', 20350, 20350),
  ],
  topRisers: [], // computed in services/api.ts
  topFallers: [],
}

export const mockMarkets: Market[] = [
  {
    id: 1,
    name: 'Pasar Andir',
    type: 'TRADITIONAL',
    address: null,
    latitude: -6.9147,
    longitude: 107.5876,
    distanceKm: 1.2,
    openHours: '05:00-14:00',
    isOpenNow: true,
    topPrices: [
      { commodityId: 1, name: 'Beras Kualitas Medium I', unit: 'kg', price: 16200, source: 'SEED' },
      { commodityId: 5, name: 'Telur Ayam Ras Segar', unit: 'kg', price: 28300, source: 'SEED' },
    ],
  },
  {
    id: 2,
    name: '[Contoh] Lapangan Gasibu',
    type: 'CHEAP_MARKET',
    address: null,
    latitude: -6.9007,
    longitude: 107.6169,
    distanceKm: 2.4,
    openHours: '08:00-12:00',
    isOpenNow: null,
    topPrices: [
      { commodityId: 1, name: 'Beras Kualitas Medium I', unit: 'kg', price: 14700, source: 'SEED' },
    ],
  },
  {
    id: 3,
    name: 'Toko Sembako Makmur',
    type: 'STORE',
    address: 'Jl. Contoh No. 3',
    latitude: -6.91,
    longitude: 107.62,
    distanceKm: 3.1,
    openHours: '07:00-21:00',
    isOpenNow: true,
    topPrices: [],
  },
  {
    id: 4,
    name: 'Supermarket Hemat',
    type: 'SUPERMARKET',
    address: null,
    latitude: -6.93,
    longitude: 107.62,
    distanceKm: 4.2,
    openHours: null,
    isOpenNow: null,
    topPrices: [],
  },
]

const pad = (n: number) => String(n).padStart(2, '0')
const dayStr = (offset: number) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const at = (offset: number, hhmm: string) => `${dayStr(offset)}T${hhmm}:00+07:00`

const gasibu = {
  id: 2,
  name: '[Contoh] Lapangan Gasibu',
  address: null,
  latitude: -6.9007,
  longitude: 107.6169,
}
const alun = {
  id: 5,
  name: '[Contoh] Alun-alun Bandung',
  address: null,
  latitude: -6.9218,
  longitude: 107.6071,
}
const tegallega = {
  id: 6,
  name: '[Contoh] Lapangan Tegallega',
  address: null,
  latitude: -6.9341,
  longitude: 107.6031,
}
const base = {
  organizer: 'Dinas Perdagangan (contoh)',
  description: 'Sembako bersubsidi untuk warga. Data contoh.',
}

export const mockEvents: MarketEvent[] = [
  {
    ...base,
    id: 1,
    title: '[Contoh] Pasar Murah Gasibu',
    startAt: at(0, '00:01'),
    endAt: at(0, '23:59'),
    status: 'ONGOING',
    daysUntil: 0,
    distanceKm: 2.4,
    market: gasibu,
  },
  {
    ...base,
    id: 2,
    title: '[Contoh] Pasar Murah Alun-alun',
    startAt: at(2, '08:00'),
    endAt: at(2, '12:00'),
    status: 'UPCOMING',
    daysUntil: 2,
    distanceKm: 1.8,
    market: alun,
  },
  {
    ...base,
    id: 3,
    title: '[Contoh] Pasar Murah Akhir Pekan',
    startAt: at(5, '08:00'),
    endAt: at(5, '12:00'),
    status: 'UPCOMING',
    daysUntil: 5,
    distanceKm: 4.5,
    market: tegallega,
  },
  {
    ...base,
    id: 4,
    title: '[Contoh] Pasar Murah Tegallega',
    startAt: at(9, '07:00'),
    endAt: at(9, '11:00'),
    status: 'UPCOMING',
    daysUntil: 9,
    distanceKm: 4.5,
    market: tegallega,
  },
  {
    ...base,
    id: 5,
    title: '[Contoh] Pasar Murah (Sudah Selesai)',
    startAt: at(-3, '08:00'),
    endAt: at(-3, '12:00'),
    status: 'ENDED',
    daysUntil: null,
    distanceKm: 2.4,
    market: gasibu,
  },
]
