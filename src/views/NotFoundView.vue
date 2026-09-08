<script setup lang="ts">
import { useRouter } from 'vue-router';
import { Compass } from 'lucide-vue-next';

const router = useRouter();
</script>

<template>
  <div
    class="flex flex-col items-center rounded-xl border border-slate-200 bg-white px-6 py-16 text-center"
  >
    <div
      class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400"
    >
      <Compass class="h-6 w-6" />
    </div>

    <h1 class="text-lg font-semibold text-slate-800">
      Esta pantalla no existe
    </h1>

    <p class="mt-1 max-w-md text-sm text-slate-500">
      Puede que la sección todavía no esté construida o que la dirección esté
      mal escrita.
    </p>

    <button
      type="button"
      class="mt-5 rounded-xl bg-ccisj px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      @click="router.push('/')"
    >
      Ir al inicio
    </button>
  </div>
</template>
