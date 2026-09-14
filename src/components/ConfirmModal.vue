<script setup lang="ts">
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
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      @click.self="emit('cancel')"
    >
      <div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 class="text-lg font-bold text-slate-900">
          {{ title }}
        </h2>

        <p class="mt-2 text-sm leading-6 text-slate-500">
          {{ message }}
        </p>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            :disabled="loading"
            @click="emit('cancel')"
          >
            {{ cancelText }}
          </button>

          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            :class="
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-ccisj hover:opacity-90'
            "
            :disabled="loading"
            @click="emit('confirm')"
          >
            {{ loading ? 'Procesando...' : confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
