import type { MarketEvent } from "../types/api"

const TZ = 'Asia/Jakarta'

const dateFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
// h23 avoids "24.00" at midnight
const timeFmt = new Intl.DateTimeFormat('id-ID', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// "Sabtu, 7 November 2026"
export const formatEventDate = (iso: string) => dateFmt.format(new Date(iso))

// "08.00–12.00 WIB"
export const formatTimeRange = (startIso: string, endIso: string) =>
  `${timeFmt.format(new Date(startIso))}–${timeFmt.format(new Date(endIso))} WIB`

// Ongoing / Hari ini / Besok / N hari lagi / Selesai
export function eventStatusLabel(e: Pick<MarketEvent, 'status' | 'daysUntil'>): string {
  if (e.status === 'ONGOING') return 'Sedang berlangsung'
  if (e.status === 'ENDED') return 'Selesai'
  if (e.daysUntil === 0) return 'Hari ini'
  if (e.daysUntil === 1) return 'Besok'
  return `${e.daysUntil ?? '?'} hari lagi`
}

export const formatDistance = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`)