<script setup lang="ts">
import BaseModal from './BaseModal.vue';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
};

withDefaults(defineProps<Props>(), {
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  danger: false,
  loading: false,
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <BaseModal :open="open" :title="title" max-width="md" @close="emit('cancel')">
    <div class="px-6 py-5">
      <p class="text-sm leading-6 text-slate-500">
        {{ message }}
      </p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          :disabled="loading"
          @click="emit('cancel')"
        >
          {{ cancelText }}
        </button>

        <button
          type="button"
          class="rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          :class="
            danger ? 'bg-red-600 hover:bg-red-700' : 'bg-ccisj hover:opacity-90'
          "
          :disabled="loading"
          @click="emit('confirm')"
        >
          {{ loading ? 'Procesando...' : confirmText }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>
