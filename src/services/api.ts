import axios from 'axios'
import type { AxiosError, AxiosResponse } from 'axios'

import type {
  ApiError,
  ApiResponse,
  Commodity,
  CommodityDetail,
  CommodityHistory,
  CommodityMarkets,
  CommodityMarketsParams,
  CreateReport,
  EventParams,
  Market,
  MarketDetail,
  MarketEvent,
  NearbyMarketParams,
  PriceSummary,
  ReportResult,
} from '../types/api'

import { mockEvents, mockMarkets, mockPriceSummary } from '../data/mock'

// Mock mode (summary, nearby markets and events only) or the real backend
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Turn any failure into a stable ApiError: { code, message, status, details }
// so views can branch on error.code (VALIDATION_ERROR, PRICE_OUT_OF_RANGE, RATE_LIMITED, ...)
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ error?: { code?: string; message?: string; details?: unknown[] } }>) => {
    const e = err.response?.data?.error
    const apiError: ApiError = {
      code: e?.code ?? 'NETWORK_ERROR',
      message: e?.message ?? 'Gagal terhubung ke server',
      status: err.response?.status,
      details: e?.details ?? [],
    }
    return Promise.reject(apiError)
  }
)

export const isMockMode = USE_MOCK

export function isApiError(e: unknown): e is ApiError {
  return typeof e === 'object' && e !== null && 'code' in e && 'message' in e
}

const unwrap = <T>(res: AxiosResponse<ApiResponse<T>>): T => res.data.data

// ========================================
// BERANDA
// ========================================

// GET /prices/summary
export async function getPriceSummary(): Promise<PriceSummary> {
  if (USE_MOCK) {
    const items = [...mockPriceSummary.items]
    return {
      ...mockPriceSummary,
      topRisers: items
        .filter((i) => i.changePercent > 0)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 2),
      topFallers: items
        .filter((i) => i.changePercent < 0)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 2),
    }
  }
  return unwrap(await api.get<ApiResponse<PriceSummary>>('/prices/summary'))
}

// GET /markets/nearby?lat&lon&radius&type&limit
export async function getNearbyMarkets(params: NearbyMarketParams): Promise<Market[]> {
  if (USE_MOCK) {
    let markets = [...mockMarkets]
    if (params.type?.length) markets = markets.filter((m) => params.type!.includes(m.type))
    if (params.radius !== undefined) markets = markets.filter((m) => m.distanceKm <= params.radius!)
    if (params.limit !== undefined) markets = markets.slice(0, params.limit)
    return markets
  }
  // Backend expects type=TRADITIONAL,STORE (comma separated), not type[]=...
  const query = { ...params, type: params.type?.length ? params.type.join(',') : undefined }
  return unwrap(await api.get<ApiResponse<Market[]>>('/markets/nearby', { params: query }))
}

// GET /events?range&status&lat&lon&radius&limit
export async function getEvents(params: EventParams = {}): Promise<MarketEvent[]> {
  if (USE_MOCK) {
    let events = [...mockEvents]
    if (params.status && params.status !== 'ALL')
      events = events.filter((e) => e.status === params.status)
    else if (!params.status) events = events.filter((e) => e.status !== 'ENDED') // contract default
    if (params.limit !== undefined) events = events.slice(0, params.limit)
    return events
  }
  return unwrap(await api.get<ApiResponse<MarketEvent[]>>('/events', { params }))
}

// GET /events/:id
export async function getEventDetail(id: number | string): Promise<MarketEvent> {
  return unwrap(await api.get<ApiResponse<MarketEvent>>(`/events/${id}`))
}

// ========================================
// KOMODITAS
// ========================================

// GET /commodities
export async function getCommodities(): Promise<Commodity[]> {
  return unwrap(await api.get<ApiResponse<Commodity[]>>('/commodities'))
}

// GET /commodities/:id
export async function getCommodityDetail(id: number | string): Promise<CommodityDetail> {
  return unwrap(await api.get<ApiResponse<CommodityDetail>>(`/commodities/${id}`))
}

// GET /commodities/:id/history?days=7|30
export async function getCommodityHistory(
  id: number | string,
  days: 7 | 30 = 7
): Promise<CommodityHistory> {
  return unwrap(
    await api.get<ApiResponse<CommodityHistory>>(`/commodities/${id}/history`, { params: { days } })
  )
}

// GET /commodities/:id/markets?lat&lon&radius&limit
export async function getCommodityMarkets(
  id: number | string,
  params: CommodityMarketsParams = {}
): Promise<CommodityMarkets> {
  return unwrap(
    await api.get<ApiResponse<CommodityMarkets>>(`/commodities/${id}/markets`, { params })
  )
}

// ========================================
// PASAR
// ========================================

// GET /markets/:id
export async function getMarketDetail(id: number | string): Promise<MarketDetail> {
  return unwrap(await api.get<ApiResponse<MarketDetail>>(`/markets/${id}`))
}

// ========================================
// LAPORAN HARGA
// ========================================

// POST /reports  (errors: 400 VALIDATION_ERROR, 422 PRICE_OUT_OF_RANGE, 429 RATE_LIMITED)
export async function submitReport(data: CreateReport): Promise<ReportResult> {
  return unwrap(await api.post<ApiResponse<ReportResult>>('/reports', data))
}

// ========================================
// CEK STATUS BACKEND
// ========================================

// GET /health
export async function checkBackend() {
  return unwrap(await api.get<ApiResponse<{ status: string }>>('/health'))
}
export function describeError(error: unknown): string {
  if (!isApiError(error)) {
    return 'Terjadi kesalahan. Silakan coba lagi.'
  }

  switch (error.code) {
    case 'NETWORK_ERROR':
      return 'Tidak bisa terhubung ke server. Periksa koneksi internetmu.'

    case 'RATE_LIMITED':
      return 'Terlalu banyak permintaan. Coba lagi beberapa saat lagi.'

    case 'NOT_FOUND':
      return 'Data yang kamu cari tidak ditemukan.'

    default:
      return error.message || 'Terjadi masalah di server.'
  }
}
export default api
