// ========================================
// API CONTRACT v1 - TYPESCRIPT TYPES
// ========================================

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: Record<string, unknown>
}

// Normalized error produced by the axios interceptor in services/api.ts
export interface ApiError {
  code: string // VALIDATION_ERROR | PRICE_OUT_OF_RANGE | RATE_LIMITED | NOT_FOUND | NETWORK_ERROR | ...
  message: string
  status?: number
  details: unknown[]
}

export type PriceSource = 'PIHPS' | 'SEED' | 'CITIZEN'
export type PriceTrend = 'UP' | 'DOWN' | 'STABLE'
export type MarketType = 'TRADITIONAL' | 'CHEAP_MARKET' | 'STORE' | 'SUPERMARKET'
export type EventStatus = 'ONGOING' | 'UPCOMING' | 'ENDED'

// ---------- Prices / commodities ----------

// GET /prices/summary
export interface PriceItem {
  commodityId: number
  name: string
  unit: string
  iconUrl?: string | null
  price: number
  previousPrice: number | null // null when there is no price 7 days earlier
  changePercent: number
  trend: PriceTrend
  source: PriceSource
  sourceLabel: string
  date: string // YYYY-MM-DD
}

export interface PriceSummary {
  updatedAt: string | null
  items: PriceItem[]
  topRisers: PriceItem[]
  topFallers: PriceItem[]
}

// GET /commodities
export interface Commodity {
  id: number
  name: string
  unit: string
  iconUrl: string | null
}

// GET /commodities/:id
export interface CommodityDetail extends Commodity {
  price: number
  changePercent: number
  trend: PriceTrend
  source: PriceSource
  sourceLabel: string
  date: string
}

// GET /commodities/:id/history
export interface HistoryPoint {
  date: string
  price: number
}

export interface CommodityHistory {
  commodityId: number
  unit: string
  points: HistoryPoint[]
  stats: { min: number; minDate: string; max: number; maxDate: string; average: number }
}

// GET /commodities/:id/markets
export interface CommodityMarketItem {
  // latitude/longitude are optional: used for the route link when the backend sends them
  market: {
    id: number
    name: string
    type: MarketType
    distanceKm: number | null
    latitude?: number
    longitude?: number
  }
  price: number
  source: PriceSource
  sourceLabel: string
  date: string
}

export interface CommodityMarkets {
  reference: { price: number; source: PriceSource; sourceLabel: string; date: string }
  items: CommodityMarketItem[]
}

export interface CommodityMarketsParams {
  lat?: number
  lon?: number
  radius?: number
  limit?: number
}

// ---------- Markets ----------

// Price shown in the map popup
export interface NearbyMarketPrice {
  commodityId: number
  name: string
  unit: string
  price: number
  source: PriceSource
}

// GET /markets/nearby
export interface Market {
  id: number
  name: string
  type: MarketType
  address: string | null
  latitude: number
  longitude: number
  distanceKm: number
  openHours: string | null
  isOpenNow: boolean | null // null = opening hours unknown, do not show "closed"
  topPrices: NearbyMarketPrice[]
}

export interface NearbyMarketParams {
  lat: number
  lon: number
  radius?: number
  type?: MarketType[]
  limit?: number
}

// GET /markets/:id
export interface MarketPrice {
  commodityId: number
  name: string
  unit: string
  iconUrl: string | null
  price: number
  source: PriceSource
  sourceLabel: string
  date: string
}

export interface MarketDetail {
  id: number
  name: string
  type: MarketType
  address: string | null
  latitude: number
  longitude: number
  openHours: string | null
  isOpenNow: boolean | null
  prices: MarketPrice[]
}

// ---------- Events ----------

export interface EventMarket {
  id: number
  name: string
  address: string | null
  latitude: number
  longitude: number
}

// GET /events, GET /events/:id
export interface MarketEvent {
  id: number
  title: string // sample events are prefixed "[Contoh]"
  organizer: string | null
  description: string | null
  startAt: string // ISO 8601 with +07:00
  endAt: string
  status: EventStatus
  daysUntil: number | null // 0 = today, null = already ended
  distanceKm: number | null // null when lat/lon not sent
  market: EventMarket
}

export interface EventParams {
  range?: 'week' | 'month'
  status?: 'ONGOING' | 'UPCOMING' | 'ALL'
  lat?: number
  lon?: number
  radius?: number
  limit?: number
}

// ---------- Reports ----------

// POST /reports
export interface CreateReport {
  marketId: number
  commodityId: number
  price: number // integer, 100..10,000,000, within 50%-200% of the reference price
}

export interface ReportResult {
  id: number
  marketId: number
  commodityId: number
  price: number
  source: PriceSource
  createdAt: string
}