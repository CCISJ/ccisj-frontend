<script setup lang="ts">
import { ref, watch } from 'vue';

import { FileText, X } from 'lucide-vue-next';

defineProps<{
  id: string;
  required?: boolean;
}>();

const file = defineModel<File | null>({ default: null });

// Los mismos límites que el backend (upload-receipt.middleware.ts). Se revisan
// acá para avisar antes de mandar el pago, pero el control real es el del
// servidor, que además mira el contenido del archivo y no solo su tipo.
const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

const input = ref<HTMLInputElement | null>(null);
const error = ref('');

function onChange(event: Event) {
  const selected = (event.target as HTMLInputElement).files?.[0] ?? null;

  error.value = '';

  if (selected && !ACCEPTED_TYPES.includes(selected.type)) {
    error.value = 'Solo se permiten archivos PDF, JPG y PNG';
    clear();
    return;
  }

  if (selected && selected.size > MAX_SIZE) {
    error.value = 'El comprobante no puede superar los 5 MB';
    clear();
    return;
  }

  file.value = selected;
}

// El input tiene que olvidar el archivo cada vez que se descarta (rechazado,
// quitado o porque el formulario se reinició desde afuera): si no, elegir de
// nuevo el mismo no dispara `change`.
function resetInput() {
  if (input.value) input.value.value = '';
}

function clear() {
  file.value = null;
  resetInput();
}

watch(file, (value) => {
  if (!value) resetInput();
});

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
</script>

<template>
  <div>
    <label :for="id" class="mb-1.5 block text-sm font-medium text-slate-700">
      Comprobante
      <span class="font-normal text-slate-400">
        {{ required ? '(obligatorio)' : '(opcional)' }}
      </span>
    </label>

    <div
      v-if="file"
      class="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5"
    >
      <span class="flex min-w-0 items-center gap-2 text-sm text-slate-700">
        <FileText class="h-4 w-4 shrink-0 text-slate-400" />
        <span class="truncate">{{ file.name }}</span>
        <span class="shrink-0 text-xs text-slate-400">
          {{ formatSize(file.size) }}
        </span>
      </span>

      <button
        type="button"
        class="rounded p-1 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
        aria-label="Quitar comprobante"
        @click="clear"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <input
      v-show="!file"
      :id="id"
      ref="input"
      type="file"
      accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
      :required="required"
      class="block w-full text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-ccisj-light file:px-3 file:py-2 file:text-sm file:font-medium file:text-ccisj hover:file:opacity-90"
      @change="onChange"
    />

    <p v-if="error" class="mt-1.5 text-xs text-red-600">{{ error }}</p>

    <p v-else class="mt-1.5 text-xs text-slate-400">
      PDF, JPG o PNG, hasta 5 MB.
    </p>
  </div>
</template>
