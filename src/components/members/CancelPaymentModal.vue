<script setup lang="ts">
defineProps<{
  open: boolean;
  reason: string;
  loading: boolean;
}>();

const emit = defineEmits<{
  'update:reason': [value: string];
  confirm: [];
  close: [];
}>();
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
  >
    <div class="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
      <h2 class="text-lg font-semibold text-slate-900">Anular pago</h2>

      <p class="mt-1 text-base text-slate-600">
        El pago seguirá en el historial, pero dejará de contabilizarse en las
        cuotas y en caja.
      </p>

      <div class="mt-4">
        <label
          for="payment-cancellation-reason"
          class="mb-1.5 block text-base font-medium text-slate-700"
        >
          Motivo de anulación
        </label>

        <textarea
          id="payment-cancellation-reason"
          :value="reason"
          maxlength="500"
          rows="4"
          class="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-base outline-none transition focus:border-ccisj focus:ring-1 focus:ring-ccisj"
          placeholder="Ej: Pago registrado por error"
          @input="
            emit('update:reason', ($event.target as HTMLTextAreaElement).value)
          "
        />
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-300 px-4 py-2 text-base font-medium text-slate-600 transition hover:bg-slate-50"
          :disabled="loading"
          @click="emit('close')"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="rounded-lg bg-red-600 px-4 py-2 text-base font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loading || !reason.trim()"
          @click="emit('confirm')"
        >
          {{ loading ? 'Anulando...' : 'Anular pago' }}
        </button>
      </div>
    </div>
  </div>
</template>
