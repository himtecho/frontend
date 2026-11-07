
// ========================================
// MURAH API CONTRACT - TYPESCRIPT TYPES
// ========================================

// ========================================
// RESPONSE UMUM
// ========================================

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: Record<string, unknown>
}

// ========================================
// SUMBER DATA DAN TREN HARGA
// ========================================

export type PriceSource = 'PIHPS' | 'SEED' | 'CITIZEN'

export type PriceTrend = 'UP' | 'DOWN' | 'STABLE'

// ========================================
// DATA KOMODITAS
// ========================================

export interface PriceItem {
  commodityId: string
  name: string
  unit: string
  iconUrl?: string | null
  price: number
  previousPrice: number
  changePercent: number
  trend: PriceTrend
  source: PriceSource
  sourceLabel: string
  date: string
}

// ========================================
// RINGKASAN HARGA BERANDA
// ========================================

export interface PriceSummary {
  updatedAt: string
  items: PriceItem[]
  topRisers: PriceItem[]
  topFallers: PriceItem[]
}

// ========================================
// DATA PASAR
// ========================================

export type MarketType =
  | 'TRADITIONAL'
  | 'CHEAP_MARKET'
  | 'STORE'
  | 'SUPERMARKET'

export interface NearbyMarketPrice {
  commodityId: number
  name: string
  unit: string
  price: number
  source: PriceSource
}

export interface Market {
  id: number
  name: string
  type: MarketType
  address: string
  latitude: number
  longitude: number
  distanceKm: number
  openHours: string | null
  isOpenNow: boolean | null
  topPrices: NearbyMarketPrice[]
}

// ========================================
// DATA KEGIATAN PASAR MURAH
// ========================================

export type EventStatus = 'ONGOING' | 'UPCOMING' | 'ENDED'

export interface MarketEvent {
  id: string
  title: string
  organizer: string
  date: string
  time: string
  location: string
  distanceKm?: number
  status: EventStatus
}

// ========================================
// LAPORAN HARGA
// ========================================

export interface CreateReport {
  marketId: string
  commodityId: string
  price: number
}

// ========================================
// PARAMETER PASAR TERDEKAT
// ========================================

export interface NearbyMarketParams {
  lat: number
  lon: number
  radius?: number
  type?: MarketType[]
  limit?: number
}
