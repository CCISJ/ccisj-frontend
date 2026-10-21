<script setup lang="ts">
import { computed } from 'vue';

import { Check } from 'lucide-vue-next';

import type { ActiveCategory } from '@/services/categoriesService';

/**
 * Elige de qué categorías recibir ofertas. El valor es la lista de IDs
 * elegidos; vacía significa "todas" (y así se guarda en el backend).
 */
const props = defineProps<{
  categories: ActiveCategory[];
  disabled?: boolean;
}>();

const model = defineModel<number[]>({ required: true });

const all = computed(() => model.value.length === 0);

function isSelected(id: number) {
  return all.value || model.value.includes(id);
}

function toggle(id: number) {
  const current = all.value
    ? props.categories.map((category) => category.id)
    : [...model.value];

  const next = current.includes(id)
    ? current.filter((item) => item !== id)
    : [...current, id];

  // Ninguna o todas marcadas es lo mismo: recibir todas.
  model.value =
    next.length === 0 || next.length === props.categories.length ? [] : next;
}

const chip =
  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60';
const on = 'border-ccisj bg-ccisj-light text-ccisj';
const off = 'border-slate-200 bg-white text-slate-500 hover:border-slate-300';
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      type="button"
      :disabled="disabled"
      :aria-pressed="all"
      :class="[chip, all ? 'border-ccisj bg-ccisj text-white' : off]"
      @click="model = []"
    >
      <Check v-if="all" class="h-3.5 w-3.5" />
      Todas
    </button>

    <button
      v-for="category in categories"
      :key="category.id"
      type="button"
      :disabled="disabled"
      :aria-pressed="isSelected(category.id)"
      :class="[chip, isSelected(category.id) ? on : off]"
      @click="toggle(category.id)"
    >
      <Check v-if="isSelected(category.id)" class="h-3.5 w-3.5" />
      {{ category.nombre }}
    </button>
  </div>
</template>
