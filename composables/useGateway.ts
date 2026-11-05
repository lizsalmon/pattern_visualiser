import { ref, watch, onMounted, effectScope } from 'vue'

const STORAGE_KEY = 'gateway_url'
const DEFAULT_GATEWAY_URL = 'http://127.0.0.1:8080/'

// Shared across all components. Module-level so every caller sees the same ref.
const gatewayUrl = ref<string>(DEFAULT_GATEWAY_URL)
let persistenceStarted = false

// Returns the shared gateway base URL. The first caller (on the client) loads
// the saved value from localStorage and starts saving later changes.
export function useGateway() {
  onMounted(() => {
    if (persistenceStarted) return
    persistenceStarted = true

    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) gatewayUrl.value = saved

    // Detached scope so the watcher outlives whichever component mounted first.
    effectScope(true).run(() => {
      watch(gatewayUrl, (value) => localStorage.setItem(STORAGE_KEY, value))
    })
  })

  return { gatewayUrl }
}

// Runs an async gateway action and records its outcome for display.
export function useGatewayAction() {
  const error = ref<string | null>(null)
  const busy = ref(false)

  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    busy.value = true
    error.value = null
    try {
      return await action()
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      return undefined
    }
    finally {
      busy.value = false
    }
  }

  return { error, busy, run }
}
