import { ref } from 'vue'

export type LocationStatus = 'idle' | 'loading' | 'granted' | 'manual' | 'denied' | 'unavailable'

// Module-level state so every screen shares one location.
const coords = ref<{ lat: number; lon: number } | null>(null)
const status = ref<LocationStatus>('idle')
let initialised = false

function request() {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    status.value = 'unavailable'
    return
  }
  status.value = 'loading'
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      coords.value = { lat: pos.coords.latitude, lon: pos.coords.longitude }
      status.value = 'granted'
    },
    (err) => {
      status.value = err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'
    },
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }
  )
}

/** Only auto-request when the permission was already granted; otherwise wait for a tap. */
async function init() {
  if (initialised) return
  initialised = true
  try {
    const perm = await navigator.permissions?.query({ name: 'geolocation' as PermissionName })
    if (perm?.state === 'granted') request()
    else if (perm?.state === 'denied') status.value = 'denied'
  } catch {
    /* Permissions API unavailable: wait for the user */
  }
}

/** Used by the district picker (Peta screen) when permission is denied. */
function setManual(lat: number, lon: number) {
  coords.value = { lat, lon }
  status.value = 'manual'
}

export function useLocation() {
  return { coords, status, request, init, setManual }
}
