<script setup lang="ts">
import { computed } from 'vue';

import { CheckCircle2, CircleAlert, Info, X } from 'lucide-vue-next';

import { useToastStore } from '@/stores/toast';

const toast = useToastStore();

const icon = computed(() => {
  if (toast.type === 'success') return CheckCircle2;
  if (toast.type === 'error') return CircleAlert;

  return Info;
});

const toastClasses = computed(() => {
  if (toast.type === 'success') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  }

  if (toast.type === 'error') {
    return 'border-red-200 bg-red-50 text-red-800';
  }

  return 'border-slate-200 bg-white text-slate-700';
});
</script>

<template>
  <!--
    La región `aria-live` está siempre en la página, aunque no haya aviso: un
    lector de pantalla anuncia lo que cambia adentro de una región que ya
    existía, no una que aparece junto con el mensaje. Un error va como
    `alert` (se anuncia enseguida); el resto, como `status`.
  -->
  <div
    aria-live="polite"
    aria-atomic="true"
    class="pointer-events-none fixed inset-x-4 top-4 z-200 flex justify-end sm:inset-x-auto sm:top-6 sm:right-6"
  >
    <!--
      Entra y sale por el mismo lado (de arriba), con la curva fuerte de
      salida; la salida es más corta que la entrada. Con "reducir movimiento"
      solo cambia la opacidad.
    -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0 motion-reduce:translate-y-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-out"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-2 opacity-0 motion-reduce:translate-y-0"
    >
      <div
        v-if="toast.visible"
        :role="toast.type === 'error' ? 'alert' : 'status'"
        class="pointer-events-auto flex w-full items-center gap-3 rounded-xl border px-4 py-3 shadow-lg sm:w-auto sm:min-w-80 sm:max-w-md"
        :class="toastClasses"
        @mouseenter="toast.pause"
        @mouseleave="toast.resume"
      >
        <component :is="icon" class="h-5 w-5 shrink-0" aria-hidden="true" />

        <p class="flex-1 text-base font-medium">
          {{ toast.message }}
        </p>

        <button
          type="button"
          class="rounded-md p-1 opacity-60 transition hover:opacity-100"
          aria-label="Cerrar aviso"
          @click="toast.close"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </Transition>
  </div>
</template>
