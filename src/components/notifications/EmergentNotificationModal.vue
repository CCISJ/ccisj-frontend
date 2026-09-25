<script setup lang="ts">
import { TriangleAlert } from 'lucide-vue-next';

import BaseModal from '../BaseModal.vue';

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
  <BaseModal
    :open="open"
    max-width="lg"
    :close-on-backdrop="false"
    @close="emit('close')"
  >
    <template #header>
      <div class="flex items-start gap-4">
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
      </div>
    </template>

    <div class="p-6">
      <p class="whitespace-pre-line text-sm leading-6 text-slate-600">
        {{ message }}
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <button
          type="button"
          class="rounded-lg bg-ccisj px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
          @click="emit('close')"
        >
          Entendido
        </button>
      </div>
    </template>
  </BaseModal>
</template>
