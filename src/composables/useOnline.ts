import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useOnline() {
  const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
  const goOnline = () => (online.value = true)
  const goOffline = () => (online.value = false)
  onMounted(() => {
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('online', goOnline)
    window.removeEventListener('offline', goOffline)
  })
  return online
}
