<script setup lang="ts">
import { ref } from 'vue'
import { wave, straightWave, runPattern, stopPattern, type SweepDirection } from '~/utils/gatewayApi'
import { useGateway, useGatewayAction } from '~/composables/useGateway'

const { gatewayUrl } = useGateway()
const { error, run } = useGatewayAction()

const delay = ref(1000)

const waveRow = ref('A')
const waveStart = ref(1)
const waveStop = ref(5)

const swaveRStart = ref('A')
const swaveRStop = ref('J')
const swaveCStart = ref(1)
const swaveCStop = ref(26)

const patternRepeat = ref(1)

const SWEEP_DIRECTIONS: { id: SweepDirection, label: string }[] = [
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'top', label: 'Top' },
  { id: 'bottom', label: 'Bottom' },
]

const inputClass = 'bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 w-24'
const buttonClass = 'px-3 py-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm'
const primaryClass = 'px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium text-sm'

const runWave = () => run(() => wave(gatewayUrl.value, {
  row: waveRow.value, start: waveStart.value, stop: waveStop.value, delay: delay.value,
}))

const runStraightWave = (direction: SweepDirection) => run(() => straightWave(gatewayUrl.value, {
  rstart: swaveRStart.value,
  rstop: swaveRStop.value,
  cstart: swaveCStart.value,
  cstop: swaveCStop.value,
  delay: delay.value,
  direction,
}))

const runPatternOnGateway = () => run(() => runPattern(gatewayUrl.value, {
  repeat: patternRepeat.value, delay: delay.value,
}))

const stopPatternOnGateway = () => run(() => stopPattern(gatewayUrl.value))
</script>

<template>
  <div class="flex flex-col gap-6">
    <p v-if="error" class="text-sm text-red-400">{{ error }}</p>

    <section class="flex flex-col gap-2">
      <label for="wave_delay" class="text-sm font-medium text-slate-300">Delay between steps (ms)</label>
      <input id="wave_delay" v-model.number="delay" type="number" min="0" :class="inputClass">
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-medium">Simple wave</h2>
      <div class="flex flex-wrap gap-2">
        <input v-model="waveRow" type="text" aria-label="Rows" :class="inputClass">
        <input v-model.number="waveStart" type="number" aria-label="Start column" :class="inputClass">
        <input v-model.number="waveStop" type="number" aria-label="Stop column" :class="inputClass">
      </div>
      <div>
        <button type="button" :class="primaryClass" @click="runWave">Run</button>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-medium">Straight wave</h2>
      <div class="flex flex-wrap gap-2">
        <input v-model="swaveRStart" type="text" aria-label="Start row" :class="inputClass">
        <input v-model="swaveRStop" type="text" aria-label="Stop row" :class="inputClass">
        <input v-model.number="swaveCStart" type="number" aria-label="Start column" :class="inputClass">
        <input v-model.number="swaveCStop" type="number" aria-label="Stop column" :class="inputClass">
      </div>
      <div class="flex flex-wrap items-center gap-2 text-sm text-slate-300">
        <span>Start from</span>
        <button
          v-for="d in SWEEP_DIRECTIONS"
          :key="d.id"
          type="button"
          :class="buttonClass"
          @click="runStraightWave(d.id)"
        >
          {{ d.label }}
        </button>
      </div>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-medium">Pattern</h2>
      <div class="flex flex-wrap items-center gap-2 text-sm text-slate-300">
        <label for="pattern_repeat">Repeat</label>
        <input id="pattern_repeat" v-model.number="patternRepeat" type="number" min="1" :class="inputClass">
        <button type="button" :class="primaryClass" @click="runPatternOnGateway">Run</button>
        <button type="button" :class="buttonClass" @click="stopPatternOnGateway">Stop</button>
      </div>
    </section>
  </div>
</template>
