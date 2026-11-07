import type { PriceSummary, Market, MarketEvent } from '../types/api'

// ========================================
// DATA SIMULASI HARGA SEMBAKO
// ========================================

export const mockPriceSummary: PriceSummary = {
  updatedAt: new Date().toISOString(),

  items: [
    {
      commodityId: 'beras',
      name: 'Beras',
      unit: 'kg',
      price: 14000,
      previousPrice: 14500,
      changePercent: -3.45,
      trend: 'DOWN',
      source: 'PIHPS',
      sourceLabel: 'Harga acuan kota',
      date: new Date().toISOString(),
    },
    {
      commodityId: 'minyak-goreng',
      name: 'Minyak Goreng',
      unit: 'liter',
      price: 17000,
      previousPrice: 16500,
      changePercent: 3.03,
      trend: 'UP',
      source: 'PIHPS',
      sourceLabel: 'Harga acuan kota',
      date: new Date().toISOString(),
    },
    {
      commodityId: 'telur-ayam',
      name: 'Telur Ayam',
      unit: 'kg',
      price: 28000,
      previousPrice: 28500,
      changePercent: -1.75,
      trend: 'DOWN',
      source: 'SEED',
      sourceLabel: 'Estimasi',
      date: new Date().toISOString(),
    },
    {
      commodityId: 'gula-pasir',
      name: 'Gula Pasir',
      unit: 'kg',
      price: 17500,
      previousPrice: 17500,
      changePercent: 0,
      trend: 'STABLE',
      source: 'PIHPS',
      sourceLabel: 'Harga acuan kota',
      date: new Date().toISOString(),
    },
    {
      commodityId: 'cabai-merah',
      name: 'Cabai Merah',
      unit: 'kg',
      price: 45000,
      previousPrice: 40000,
      changePercent: 12.5,
      trend: 'UP',
      source: 'CITIZEN',
      sourceLabel: 'Laporan warga',
      date: new Date().toISOString(),
    },
    {
      commodityId: 'bawang-merah',
      name: 'Bawang Merah',
      unit: 'kg',
      price: 32000,
      previousPrice: 34000,
      changePercent: -5.88,
      trend: 'DOWN',
      source: 'PIHPS',
      sourceLabel: 'Harga acuan kota',
      date: new Date().toISOString(),
    },
    {
      commodityId: 'bawang-putih',
      name: 'Bawang Putih',
      unit: 'kg',
      price: 38000,
      previousPrice: 38000,
      changePercent: 0,
      trend: 'STABLE',
      source: 'PIHPS',
      sourceLabel: 'Harga acuan kota',
      date: new Date().toISOString(),
    },
    {
      commodityId: 'daging-ayam',
      name: 'Daging Ayam',
      unit: 'kg',
      price: 36000,
      previousPrice: 35000,
      changePercent: 2.86,
      trend: 'UP',
      source: 'SEED',
      sourceLabel: 'Estimasi',
      date: new Date().toISOString(),
    },
  ],

  topRisers: [],
  topFallers: [],
}

// ========================================
// DATA SIMULASI PASAR
// ========================================

export const mockMarkets: Market[] = [
  {
    id: 1,
    name: 'Pasar Tradisional Bandung',
    type: 'TRADITIONAL',
    address: 'Jl. Contoh No. 1, Bandung',
    latitude: -6.9147,
    longitude: 107.6098,
    distanceKm: 1.2,
    openHours: '05:00-14:00',
    isOpenNow: true,
    topPrices: [
      {
        commodityId: 1,
        name: 'Beras Medium',
        unit: 'kg',
        price: 13800,
        source: 'SEED',
      },
    ],
  },
  {
    id: 2,
    name: 'Pasar Murah Sejahtera',
    type: 'CHEAP_MARKET',
    address: 'Jl. Contoh No. 2, Bandung',
    latitude: -6.92,
    longitude: 107.61,
    distanceKm: 2.4,
    openHours: '08:00-14:00',
    isOpenNow: true,
    topPrices: [
      {
        commodityId: 1,
        name: 'Beras Medium',
        unit: 'kg',
        price: 13500,
        source: 'SEED',
      },
    ],
  },
  {
    id: 3,
    name: 'Toko Sembako Makmur',
    type: 'STORE',
    address: 'Jl. Contoh No. 3, Bandung',
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
    address: 'Jl. Contoh No. 4, Bandung',
    latitude: -6.93,
    longitude: 107.62,
    distanceKm: 4.2,
    openHours: '09:00-22:00',
    isOpenNow: true,
    topPrices: [],
  },
]

// ========================================
// DATA SIMULASI KEGIATAN PASAR MURAH
// ========================================

export const mockEvents: MarketEvent[] = [
  {
    id: 'event-001',
    title: 'Operasi Pasar Murah Bandung',
    organizer: 'Dinas Perdagangan',
    date: '2026-11-10',
    time: '08:00-12:00',
    location: 'Lapangan Gasibu, Bandung',
    distanceKm: 2.5,
    status: 'UPCOMING',
  },
]
