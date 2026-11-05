<script setup lang="ts">
import { ref } from 'vue'
import { useGateway } from '~/composables/useGateway'

const TABS = [
  { id: 'pattern', label: 'Pattern' },
  { id: 'run', label: 'Run' },
  { id: 'config', label: 'Config' },
  { id: 'provision', label: 'Provision' },
  { id: 'control', label: 'Control' },
] as const

type TabId = typeof TABS[number]['id']

const { gatewayUrl } = useGateway()
const activeTab = ref<TabId>('pattern')
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center py-10 px-4">
    <h1 class="text-2xl font-semibold mb-6">micro:bit we:create visualiser</h1>

    <div class="w-full max-w-6xl flex flex-col gap-6">
      <section class="flex flex-col gap-4 bg-slate-900 rounded-lg p-4 border border-slate-800">
        <div class="flex items-center gap-2 text-sm text-slate-300">
          <label for="gateway_url" class="font-medium">Gateway</label>
          <input
            id="gateway_url"
            v-model="gatewayUrl"
            type="text"
            spellcheck="false"
            class="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-72 text-slate-100"
          >
        </div>
      </section>

      <GatewayStatus />

      <nav class="flex gap-1 border-b border-slate-800" role="tablist">
        <button
          v-for="tab in TABS"
          :key="tab.id"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.id"
          class="px-4 py-2 text-sm font-medium -mb-px border-b-2"
          :class="activeTab === tab.id
            ? 'border-amber-400 text-amber-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </nav>

      <!-- v-show (not v-if) so each tab keeps its form state while hidden. -->
      <div v-show="activeTab === 'pattern'"><LedGridAnimator /></div>
      <div v-show="activeTab === 'run'"><GatewayRun /></div>
      <div v-show="activeTab === 'config'"><GatewayConfig /></div>
      <div v-show="activeTab === 'provision'"><GatewayProvision /></div>
      <div v-show="activeTab === 'control'"><GatewayControl /></div>
    </div>
  </div>
</template>
