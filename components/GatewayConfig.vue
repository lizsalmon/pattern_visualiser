<script setup lang="ts">
import { ref } from 'vue'
import { setConfig, type ConfigName } from '~/utils/gatewayApi'
import { useGateway, useGatewayAction } from '~/composables/useGateway'

const { gatewayUrl } = useGateway()
const { error, run } = useGatewayAction()

const settings = ref<{ name: ConfigName, label: string, value: number, min: number, max: number }[]>([
  { name: 'volume', label: 'Volume', value: 127, min: 0, max: 255 },
  { name: 'pitch', label: 'Pitch', value: 1000, min: 100, max: 5000 },
  { name: 'length', label: 'Length', value: 200, min: 0, max: 2000 },
  { name: 'count', label: 'Count', value: 2, min: 1, max: 20 },
])

const sent = ref<ConfigName | null>(null)

async function apply(setting: { name: ConfigName, value: number }) {
  sent.value = null
  const ok = await run(() => setConfig(gatewayUrl.value, setting.name, setting.value))
  if (ok !== undefined) sent.value = setting.name
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h2 class="text-lg font-medium">Tone settings</h2>
    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

    <div v-for="s in settings" :key="s.name" class="flex items-center gap-2">
      <input
        v-model.number="s.value"
        type="number"
        :min="s.min"
        :max="s.max"
        :aria-label="s.label"
        class="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 w-28"
      >
      <button
        type="button"
        class="px-3 py-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm"
        @click="apply(s)"
      >
        Set {{ s.label }}
      </button>
      <span v-if="sent === s.name" class="text-sm text-emerald-400">Sent</span>
    </div>
  </div>
</template>
