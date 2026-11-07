import type { MarketType } from '../types/api'

const NBSP = '\u00a0'
const numberFmt = new Intl.NumberFormat('id-ID')

/** 14500 -> "Rp 14.500" */
export const formatRupiah = (n: number) => `Rp${NBSP}${numberFmt.format(n)}`

/** 14500 -> "14.500" */
export const formatNumber = (n: number) => numberFmt.format(n)

/** 8 -> "+8,0%", -2.1 -> "−2,1%". signed=false drops the sign. */
export function formatPercent(n: number, signed = true): string {
  const rounded = Math.round(n * 10) / 10
  const abs = Math.abs(rounded).toFixed(1).replace('.', ',')
  if (!signed) return `${abs}%`
  const sign = rounded > 0 ? '+' : rounded < 0 ? '\u2212' : ''
  return `${sign}${abs}%`
}

/** 1.2 -> "1,2 km", 0.85 -> "850 m", null -> "-" */
export function formatDistance(km: number | null | undefined): string {
  if (km === null || km === undefined) return '-'
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1).replace('.', ',')} km`
}

/** ISO string -> "Diperbarui 7 Nov, 08.30 WIB" (always Jakarta time) */
export function formatUpdatedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `Diperbarui ${get('day')} ${get('month')}, ${get('hour')}.${get('minute')} WIB`
}

export const MARKET_TYPE_LABEL: Record<MarketType, string> = {
  TRADITIONAL: 'Pasar Tradisional',
  CHEAP_MARKET: 'Pasar Murah',
  STORE: 'Toko',
  SUPERMARKET: 'Supermarket',
}
