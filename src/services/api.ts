import axios from 'axios'

import type {
  ApiResponse,
  PriceSummary,
  Market,
  MarketEvent,
  NearbyMarketParams,
  CreateReport,
} from '../types/api'

import { mockPriceSummary, mockMarkets, mockEvents } from '../data/mock'

// Mode simulasi atau backend asli
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

// Alamat backend MURAH
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// ========================================
// BERANDA
// ========================================

// GET /prices/summary
export async function getPriceSummary(): Promise<PriceSummary> {
  if (USE_MOCK) {
    const sortedItems = [...mockPriceSummary.items]

    return {
      ...mockPriceSummary,
      topRisers: sortedItems
        .filter((item) => item.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent),

      topFallers: sortedItems
        .filter((item) => item.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent),
    }
  }

  const response = await api.get<ApiResponse<PriceSummary>>('/prices/summary')

  return response.data.data
}

// GET /markets/nearby?lat&lon&limit
export async function getNearbyMarkets(params: NearbyMarketParams): Promise<Market[]> {
  if (USE_MOCK) {
    let markets = [...mockMarkets]

    if (params.type?.length) {
      markets = markets.filter((market) => params.type!.includes(market.type))
    }

    if (params.radius !== undefined) {
      markets = markets.filter((market) => market.distanceKm <= params.radius!)
    }

    if (params.limit !== undefined) {
      markets = markets.slice(0, params.limit)
    }

    return markets
  }

  const response = await api.get<ApiResponse<Market[]>>('/markets/nearby', { params })

  return response.data.data
}

// GET /events?range&status&lat&lon&radius&limit
export async function getEvents(
  params: {
    range?: 'week' | 'month'
    status?: 'ONGOING' | 'UPCOMING' | 'ALL'
    lat?: number
    lon?: number
    radius?: number
    limit?: number
  } = {}
): Promise<MarketEvent[]> {
  if (USE_MOCK) {
    let events = [...mockEvents]

    if (params.status && params.status !== 'ALL') {
      events = events.filter((event) => event.status === params.status)
    }

    if (params.limit !== undefined) {
      events = events.slice(0, params.limit)
    }

    return events
  }

  const response = await api.get<ApiResponse<MarketEvent[]>>('/events', { params })

  return response.data.data
}

// ========================================
// KOMODITAS
// ========================================

// GET /commodities
export async function getCommodities() {
  const response = await api.get('/commodities')
  return response.data.data
}

// GET /commodities/:id
export async function getCommodityDetail(id: string) {
  const response = await api.get(`/commodities/${id}`)
  return response.data.data
}

// GET /commodities/:id/history?days=7|30
export async function getCommodityHistory(id: string, days: 7 | 30 = 7) {
  const response = await api.get(`/commodities/${id}/history`, { params: { days } })

  return response.data.data
}

// GET /commodities/:id/markets
export async function getCommodityMarkets(
  id: string,
  params: {
    lat: number
    lon: number
    radius?: number
    limit?: number
  }
) {
  const response = await api.get(`/commodities/${id}/markets`, { params })

  return response.data.data
}

// ========================================
// PASAR
// ========================================

// GET /markets/:id
export async function getMarketDetail(id: string) {
  const response = await api.get(`/markets/${id}`)
  return response.data.data
}

// ========================================
// LAPORAN HARGA
// ========================================

// POST /reports
export async function submitReport(data: CreateReport) {
  const response = await api.post('/reports', data)
  return response.data
}

// ========================================
// CEK STATUS BACKEND
// ========================================

// GET /health
export async function checkBackend() {
  const response = await api.get('/health')
  return response.data
}

export default api
