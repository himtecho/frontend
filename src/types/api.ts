
// ========================================
// MURAH API CONTRACT - TYPESCRIPT TYPES
// ========================================

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: Record<string, unknown>
}

// Sumber data harga
export type PriceSource =
  | 'PIHPS'
  | 'SEED'
  | 'CITIZEN'

// Tren harga
export type PriceTrend =
  | 'UP'
  | 'DOWN'
  | 'STABLE'

// Data satu komoditas
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

// Ringkasan harga untuk halaman Beranda
export interface PriceSummary {
  updatedAt: string
  items: PriceItem[]
  topRisers: PriceItem[]
  topFallers: PriceItem[]
}

// Jenis pasar
export type MarketType =
  | 'TRADITIONAL'
  | 'CHEAP_MARKET'
  | 'STORE'
  | 'SUPERMARKET'

// Data pasar
export interface Market {
  id: string
  name: string
  type: MarketType
  address: string
  lat: number
  lon: number
  distanceKm: number
  openHours?: string | null
  isOpenNow?: boolean
  topPrices?: PriceItem[]
}

// Status kegiatan pasar murah
export type EventStatus =
  | 'ONGOING'
  | 'UPCOMING'
  | 'ENDED'

// Data kegiatan
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

// Data laporan harga
export interface CreateReport {
  marketId: string
  commodityId: string
  price: number
}

// Parameter pencarian pasar
export interface NearbyMarketParams {
  lat: number
  lon: number
  radius?: number
  type?: MarketType[]
  limit?: number
}
