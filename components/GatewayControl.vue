<script setup lang="ts">
import { sendControl, type ControlKey } from '~/utils/gatewayApi'
import { useGateway, useGatewayAction } from '~/composables/useGateway'

const { gatewayUrl } = useGateway()
const { error, run } = useGatewayAction()

const CONTROLS: { key: ControlKey, label: string }[] = [
  { key: 'R', label: 'Reboot' },
  { key: 'H', label: 'Heartbeat' },
]
</script>

<template>
  <div class="flex flex-col gap-3">
    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>
    <div class="flex gap-2">
      <button
        v-for="c in CONTROLS"
        :key="c.key"
        type="button"
        class="px-3 py-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm"
        @click="run(() => sendControl(gatewayUrl, c.key))"
      >
        {{ c.label }}
      </button>
    </div>
  </div>
</template>
