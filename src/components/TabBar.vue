<script setup lang="ts">
/**
 * Pestañas accesibles: una ficha larga se parte en temas y se ve uno a la
 * vez, en vez de bajar por todo. Con las flechas se pasa de una a otra (el
 * patrón de pestañas de WAI-ARIA); cada panel se marca con
 * `role="tabpanel"` y el id que da `panelId(valor)`.
 */
import { nextTick } from 'vue';

export type Tab = { value: string; label: string; count?: number };

const props = defineProps<{
  tabs: Tab[];
  idPrefix: string;
  label: string;
}>();

const model = defineModel<string>({ required: true });

function select(value: string) {
  model.value = value;
}

async function move(from: number, step: number) {
  const next = (from + step + props.tabs.length) % props.tabs.length;
  const tab = props.tabs[next];

  if (!tab) return;

  select(tab.value);
  await nextTick();
  document.getElementById(`${props.idPrefix}-tab-${tab.value}`)?.focus();
}
</script>

<template>
  <div
    role="tablist"
    :aria-label="label"
    class="flex gap-1 overflow-x-auto border-b border-ccisj-line"
  >
    <button
      v-for="(tab, index) in tabs"
      :id="`${idPrefix}-tab-${tab.value}`"
      :key="tab.value"
      type="button"
      role="tab"
      :aria-selected="model === tab.value"
      :aria-controls="`${idPrefix}-panel-${tab.value}`"
      :tabindex="model === tab.value ? 0 : -1"
      class="-mb-px flex min-h-12 shrink-0 items-center gap-2 border-b-[3px] px-4 font-semibold transition"
      :class="
        model === tab.value
          ? 'border-ccisj text-ccisj'
          : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
      "
      @click="select(tab.value)"
      @keydown.right.prevent="move(index, 1)"
      @keydown.left.prevent="move(index, -1)"
      @keydown.home.prevent="move(0, 0)"
      @keydown.end.prevent="move(tabs.length - 1, 0)"
    >
      {{ tab.label }}
      <span
        v-if="tab.count !== undefined"
        class="rounded-full bg-slate-100 px-2 text-sm font-medium text-slate-700"
      >
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>
