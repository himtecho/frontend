import { ref, type Ref } from 'vue'
import { isApiError } from '../services/api'
import type { ApiError } from '../types/api'

/** Tiny request state holder. Keeps the last good data while a retry is loading. */
export function useAsync<T>(fn: () => Promise<T>) {
  const data = ref<T | null>(null) as Ref<T | null>
  const error = ref<ApiError | null>(null)
  const loading = ref(false)

  let latest = 0

  async function run() {
    const id = ++latest

    loading.value = true
    error.value = null

    try {
      const result = await fn()

      if (id === latest) {
        data.value = result
      }
    } catch (e) {
      if (id === latest) {
        error.value = isApiError(e)
          ? e
          : {
              code: 'INTERNAL_ERROR',
              message: 'Terjadi kesalahan. Silakan coba lagi.',
              details: [],
            }
      }
    } finally {
      if (id === latest) {
        loading.value = false
      }
    }
  }

  return { data, error, loading, run }
}
