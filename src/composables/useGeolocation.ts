import { computed, ref } from 'vue'

export interface Coords {
  lat: number
  lon: number
}

export type GeoStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable' | 'manual'

// Fallback map center when location is not available (replace with your city center)
export const DEFAULT_CENTER: Coords = { lat: -6.9175, lon: 107.6191 }

// Module-level state: every component shares the same location
const coords = ref<Coords | null>(null)
const status = ref<GeoStatus>('idle')
const label = ref<string | null>(null)   // district name when chosen manually

export function useGeolocation() {
  function request(): Promise<void> {
    if (!('geolocation' in navigator)) {
      status.value = 'unavailable'
      return Promise.resolve()
    }
    status.value = 'loading'
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          coords.value = { lat: pos.coords.latitude, lon: pos.coords.longitude }
          label.value = null
          status.value = 'granted'
          resolve()
        },
        (err) => {
          status.value = err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'
          resolve()
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
      )
    })
  }

  // Ask for permission only once per session
  function ensure(): Promise<void> {
    return status.value === 'idle' ? request() : Promise.resolve()
  }

  // Used by the district picker when permission is denied
  function setManual(c: Coords, name: string) {
    coords.value = c
    label.value = name
    status.value = 'manual'
  }

  const hasLocation = computed(() => coords.value !== null)
  const needsManualPick = computed(
    () => status.value === 'denied' || status.value === 'unavailable',
  )

  return { coords, status, label, hasLocation, needsManualPick, request, ensure, setManual }
}