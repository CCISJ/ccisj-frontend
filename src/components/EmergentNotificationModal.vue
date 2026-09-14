<script setup lang="ts">
import { TriangleAlert, X } from 'lucide-vue-next';

defineProps<{
  open: boolean;
  title: string;
  message: string;
}>();

const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[1px]"
      >
        <Transition
          enter-active-class="transition duration-200"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-active-class="transition duration-150"
          leave-from-class="scale-100 opacity-100"
          leave-to-class="scale-95 opacity-0"
        >
          <div
            v-if="open"
            class="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div class="flex items-start gap-4 border-b border-slate-200 p-6">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700"
              >
                <TriangleAlert :size="22" />
              </div>

              <div class="min-w-0 flex-1">
                <p
                  class="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700"
                >
                  Notificación importante
                </p>

                <h2 class="text-lg font-semibold text-slate-900">
                  {{ title }}
                </h2>
              </div>

              <button
                type="button"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                aria-label="Cerrar"
                @click="emit('close')"
              >
                <X :size="18" />
              </button>
            </div>

            <div class="p-6">
              <p class="whitespace-pre-line text-sm leading-6 text-slate-600">
                {{ message }}
              </p>
            </div>

            <div
              class="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4"
            >
              <button
                type="button"
                class="rounded-lg bg-ccisj px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                @click="emit('close')"
              >
                Entendido
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
