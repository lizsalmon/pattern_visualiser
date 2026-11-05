<script setup lang="ts">
import { ref } from 'vue'
import { collectProvision, sendProvision } from '~/utils/gatewayApi'
import { useGateway, useGatewayAction } from '~/composables/useGateway'

const { gatewayUrl } = useGateway()
const { error, busy, run } = useGatewayAction()

const row = ref('A')
const col = ref(1)
const provOnly = ref('A')
const log = ref('')

const inputClass = 'bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 w-24'
const buttonClass = 'px-3 py-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm disabled:opacity-50'

async function collect() {
  const currentCol = col.value
  const result = await run(() => collectProvision(gatewayUrl.value, row.value, currentCol))
  if (result === undefined) return // request failed, error is shown
  if (result === null) {
    error.value = 'No micro:bit responded'
    return
  }
  log.value += (log.value ? '\n' : '') + result
  col.value = Number(currentCol) + 1
}

async function send() {
  await run(() => sendProvision(gatewayUrl.value, provOnly.value))
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

    <section class="flex flex-wrap items-center gap-2 text-sm text-slate-300">
      <span class="w-16">Collect</span>
      <input v-model="row" type="text" aria-label="Row" :class="inputClass">
      <input v-model.number="col" type="number" min="1" max="50" aria-label="Column" :class="inputClass">
      <button type="button" :disabled="busy" :class="buttonClass" @click="collect">Collect</button>
      <span v-if="busy" class="text-slate-400">Waiting for a micro:bit...</span>
    </section>

    <section class="flex flex-wrap items-center gap-2 text-sm text-slate-300">
      <span class="w-16">Send</span>
      <input v-model="provOnly" type="text" aria-label="Only positions containing" :class="inputClass">
      <button type="button" :disabled="busy" :class="buttonClass" @click="send">Send</button>
    </section>

    <textarea
      v-model="log"
      rows="5"
      aria-label="Provisioning log"
      spellcheck="false"
      class="bg-slate-800 border border-slate-700 rounded px-3 py-2 font-mono text-sm text-slate-100"
    />
  </div>
</template>
