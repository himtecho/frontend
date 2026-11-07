import { ref, shallowRef, watch, type WatchSource } from 'vue'

interface UseFetchOptions {
  immediate?: boolean          // run once on creation (default: true)
  watch?: WatchSource[]        // refetch when any of these change
}

export function useFetch<T>(fetcher: () => Promise<T>, options: UseFetchOptions = {}) {
  const { immediate = true, watch: sources = [] } = options

  const data = shallowRef<T | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(immediate)   // true from the start to avoid an empty-state flash
  let requestId = 0

  async function execute() {
    const id = ++requestId
    loading.value = true
    error.value = null
    try {
      const result = await fetcher()
      if (id !== requestId) return   // a newer request started; ignore this result
      data.value = result
    } catch (e) {
      if (id !== requestId) return
      error.value = e instanceof Error ? e.message : 'Terjadi kesalahan'
    } finally {
      if (id === requestId) loading.value = false
    }
  }

  if (sources.length) watch(sources, execute)
  if (immediate) execute()

  return { data, error, loading, reload: execute }
}