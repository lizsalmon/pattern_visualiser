<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { validateGrid, type ValidationResult } from '~/utils/validateGrid'
import { generatePattern, PATTERN_OPTIONS, type PatternType } from '~/utils/generatePattern'

// Outer array = one entry per cell (length rows*cols).
// Inner array = that cell's value across frames (length num_frames), 0 or 1.
const DEFAULT_ROWS = 9
const DEFAULT_COLS = 26
const DEFAULT_PATTERN: PatternType = 'straight-left-right'
const DEFAULT_FPS = 10
const MIN_FRAME_INTERVAL_MS = 50 // caps playback at 20fps, regardless of the fps field

const rows = ref<number>(DEFAULT_ROWS)
const cols = ref<number>(DEFAULT_COLS)
const framesText = ref<string>(JSON.stringify(generatePattern(DEFAULT_PATTERN, DEFAULT_ROWS, DEFAULT_COLS)))
const patternType = ref<PatternType>(DEFAULT_PATTERN)
const fps = ref<number>(DEFAULT_FPS)
const isPlaying = ref(false)
const currentFrameIndex = ref(0)
const gateway_url = ref<string>("http://127.0.0.1:8080/")

let intervalId: ReturnType<typeof setInterval> | null = null

const expectedCellCount = computed(() => {
  const r = Number(rows.value)
  const c = Number(cols.value)
  return Number.isInteger(r) && r > 0 && Number.isInteger(c) && c > 0 ? r * c : null
})

const validation = computed<ValidationResult>(() => validateGrid(rows.value, cols.value, framesText.value))

const hasErrors = computed(() => validation.value.errors.length > 0)
const cells = computed(() => validation.value.cells)
const frameCount = computed(() => cells.value[0]?.length ?? 0)
const currentFrame = computed(() => cells.value.map((cellFrames) => cellFrames[currentFrameIndex.value] ?? 0))

function stopPlayback() {
  if (intervalId !== null) {
    clearInterval(intervalId)
    intervalId = null
  }
}

function startPlayback() {
  stopPlayback()
  if (frameCount.value <= 1) return
  const n = Number(fps.value)
  const effectiveFps = Number.isFinite(n) && n > 0 ? n : DEFAULT_FPS
  intervalId = setInterval(() => {
    currentFrameIndex.value = (currentFrameIndex.value + 1) % frameCount.value
  }, Math.max(MIN_FRAME_INTERVAL_MS, 1000 / effectiveFps))
}

function togglePlay() {
  if (hasErrors.value || frameCount.value === 0) return
  isPlaying.value = !isPlaying.value
}

function stepFrame(delta: number) {
  if (frameCount.value === 0) return
  isPlaying.value = false
  currentFrameIndex.value = (currentFrameIndex.value + delta + frameCount.value) % frameCount.value
}

async function sendToGateway(){
  const data = {pattern: framesText.value, rows: rows.value, cols: cols.value}
  const response = await fetch(gateway_url.value+"set_pattern", {
          method: "POST",
          body: JSON.stringify(data)
      });
}

// Overwrites the cells textarea with a freshly generated pattern for the
// current rows/cols and selected pattern type.
function generateAndFill() {
  if (expectedCellCount.value === null) return
  framesText.value = JSON.stringify(generatePattern(patternType.value, Number(rows.value), Number(cols.value)))
}

// Normalizes the fps field once the user leaves it, so the displayed value
// is always a valid positive number.
function clampFps() {
  const n = Number(fps.value)
  fps.value = Number.isFinite(n) && n > 0 ? n : DEFAULT_FPS
}

watch(isPlaying, (playing) => {
  if (playing) startPlayback()
  else stopPlayback()
})

// Editing the speed while playing pauses, rather than retuning, playback —
// the user can review the new value and press Play again when ready.
watch(fps, () => {
  isPlaying.value = false
})

watch(cells, (newCells, oldCells) => {
  // `cells` is a freshly-parsed array on every validation pass, so it would
  // otherwise report a "change" (and reset playback) on every keystroke even
  // when the actual cell data is unchanged. Only reset when the content
  // genuinely differs.
  if (JSON.stringify(newCells) === JSON.stringify(oldCells)) return

  currentFrameIndex.value = 0
  if (hasErrors.value || frameCount.value === 0) {
    isPlaying.value = false
  }
})

onUnmounted(() => stopPlayback())
</script>

<template>
  <div class="w-full max-w-6xl flex flex-col gap-6">
    <section class="flex flex-col gap-4 bg-slate-900 rounded-lg p-4 border border-slate-800">
      <div class="flex gap-4">
        <div class="flex flex-col gap-1">
          <label for="rows" class="text-sm font-medium text-slate-300">Rows</label>
          <input
            id="rows"
            v-model.number="rows"
            type="number"
            min="1"
            class="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 w-24"
          >
        </div>

        <div class="flex flex-col gap-1">
          <label for="cols" class="text-sm font-medium text-slate-300">Columns</label>
          <input
            id="cols"
            v-model.number="cols"
            type="number"
            min="1"
            class="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100 w-24"
          >
        </div>

        <div class="flex flex-col gap-1">
          <label for="pattern" class="text-sm font-medium text-slate-300">Pattern</label>
          <select
            id="pattern"
            v-model="patternType"
            class="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-slate-100"
          >
            <option v-for="opt in PATTERN_OPTIONS" :key="opt.id" :value="opt.id">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="flex flex-col gap-1 justify-end">
          <button
            type="button"
            :disabled="expectedCellCount === null"
            class="px-3 py-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-800"
            @click="generateAndFill"
          >
            Generate
          </button>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label for="framesInput" class="text-sm font-medium text-slate-300">
          Cells (JSON array of {{ expectedCellCount ?? 'rows*cols' }} cell(s); each cell is an array of its
          0/1 value across frames)
        </label>
        <textarea
          id="framesInput"
          v-model="framesText"
          rows="5"
          spellcheck="false"
          class="bg-slate-800 border border-slate-700 rounded px-3 py-2 font-mono text-sm text-slate-100"
        />
      </div>

      <ul v-if="hasErrors" class="text-sm text-red-400 list-disc list-inside space-y-1">
        <li v-for="(error, i) in validation.errors" :key="i">{{ error }}</li>
      </ul>
    </section>

    <section v-if="!hasErrors" class="flex flex-col items-center gap-4 w-full">
      <div
        class="grid gap-1 bg-slate-900 p-2 rounded-lg border border-slate-800 w-full"
        :style="{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }"
      >
        <div
          v-for="(cell, i) in currentFrame"
          :key="i"
          class="w-full aspect-square rounded-sm transition-colors duration-100"
          :class="cell === 1 ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)]' : 'bg-slate-800'"
        />
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          class="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm"
          @click="stepFrame(-1)"
        >
          ◀ Prev
        </button>

        <button
          type="button"
          class="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium text-sm"
          @click="togglePlay"
        >
          {{ isPlaying ? 'Pause' : 'Play' }}
        </button>

        <button
          type="button"
          class="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-sm"
          @click="stepFrame(1)"
        >
          Next ▶
        </button>
      </div>

      <div class="flex items-center gap-2 text-sm text-slate-300">
        <label for="fps">Speed (frames per second)</label>
        <input
          id="fps"
          v-model.number="fps"
          type="number"
          min="1"
          step="1"
          class="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-24 text-slate-100"
          @blur="clampFps"
        >
      </div>

      <p class="text-xs text-slate-500">
        Frame {{ currentFrameIndex + 1 }} / {{ frameCount }}
      </p>

      <div class="flex items-center gap-2 text-sm text-slate-300">
        <p>Gateway</p>
      </div>
      <div class="flex items-center gap-2 text-sm text-slate-300">
        <input
          id="gateway_url"
          v-model.test="gateway_url"
          type="text"
          size="50"
          class="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-60 text-slate-100"
        >

          <button
          type="button"
          class="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium text-sm"
          @click="sendToGateway"
        >
          Send Pattern
        </button>
      </div>

    </section>
  </div>
</template>
