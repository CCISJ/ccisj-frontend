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
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-2 opacity-0"
  >
    <div
      v-if="toast.visible"
      class="fixed bottom-6 right-6 z-50 flex min-w-80 max-w-md items-center gap-3 rounded-xl border px-4 py-3 shadow-lg"
      :class="toastClasses"
    >
      <component :is="icon" class="h-5 w-5 shrink-0" />

      <p class="flex-1 text-sm font-medium">
        {{ toast.message }}
      </p>

      <button
        type="button"
        class="rounded-md p-1 opacity-60 transition hover:opacity-100"
        @click="toast.close"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
  </Transition>
</template>
