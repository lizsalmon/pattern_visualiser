<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getStatus, type GatewayStatus } from '~/utils/gatewayApi'
import { useGateway } from '~/composables/useGateway'

const POLL_INTERVAL_MS = 5_000

const { gatewayUrl } = useGateway()
const status = ref<GatewayStatus | null>(null)
const error = ref<string | null>(null)

let timerId: ReturnType<typeof setInterval> | null = null

async function refresh() {
  try {
    status.value = await getStatus(gatewayUrl.value)
    error.value = null
  }
  catch (e) {
    status.value = null
    error.value = e instanceof Error ? e.message : String(e)
  }
}

onMounted(() => {
  refresh()
  timerId = setInterval(refresh, POLL_INTERVAL_MS)
})

onUnmounted(() => {
  if (timerId !== null) clearInterval(timerId)
})
</script>

<template>
  <section class="flex flex-col gap-2 bg-slate-900 rounded-lg p-4 border border-slate-800 text-sm">
    <h2 class="text-lg font-medium">Status</h2>
    <p v-if="error" class="text-red-400">{{ error }}</p>
    <template v-else-if="status">
      <p><span class="text-slate-400">Gateway:</span> {{ status.gateway }}</p>
      <p><span class="text-slate-400">Pattern:</span> {{ status.pattern_info }}</p>
      <div>
        <p class="text-slate-400">Microbits:</p>
        <pre class="font-mono text-slate-100 overflow-x-auto">{{ status.microbits }}</pre>
      </div>
    </template>
    <p v-else class="text-slate-400">...</p>
  </section>
</template>
