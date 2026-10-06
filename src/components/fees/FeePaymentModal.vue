<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { CreateFeePaymentData } from '@/types/fee.type';

const props = defineProps<{
  open: boolean;
  socioName: string;
}>();

const emit = defineEmits<{
  close: [];
  confirm: [data: CreateFeePaymentData];
}>();

const importe = ref<number | null>(null);
const fechaPago = ref('');
const medioPago = ref('EFECTIVO');
const comprobanteUrl = ref('');
const observaciones = ref('');

const valid = computed(() => {
  return (
    importe.value !== null &&
    importe.value > 0 &&
    fechaPago.value !== '' &&
    medioPago.value !== ''
  );
});

function today() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function reset() {
  importe.value = null;
  fechaPago.value = today();
  medioPago.value = 'EFECTIVO';
  comprobanteUrl.value = '';
  observaciones.value = '';
}

function close() {
  emit('close');
}

function confirm() {
  if (!valid.value || importe.value === null) return;

  emit('confirm', {
    importe: importe.value,
    fechaPago: fechaPago.value,
    medioPago: medioPago.value,
    comprobanteUrl: comprobanteUrl.value.trim() || undefined,
    observaciones: observaciones.value.trim() || undefined,
  });
}

watch(
  () => props.open,
  (open) => {
    if (open) reset();
  },
);
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
  >
    <div class="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">Registrar pago</h2>

        <p class="mt-1 text-sm text-slate-500">
          Registrar un pago de cuotas para {{ socioName }}.
        </p>
      </div>

      <div class="mt-5 space-y-4">
        <div>
          <label
            for="payment-amount"
            class="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Importe
          </label>

          <input
            id="payment-amount"
            v-model.number="importe"
            type="number"
            min="0.01"
            step="0.01"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-ccisj focus:ring-1 focus:ring-ccisj"
            placeholder="0"
          />
        </div>

        <div>
          <label
            for="payment-date"
            class="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Fecha de pago
          </label>

          <input
            id="payment-date"
            v-model="fechaPago"
            type="date"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-ccisj focus:ring-1 focus:ring-ccisj"
          />
        </div>

        <div>
          <label
            for="payment-method"
            class="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Medio de pago
          </label>

          <select
            id="payment-method"
            v-model="medioPago"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-ccisj focus:ring-1 focus:ring-ccisj"
          >
            <option value="EFECTIVO">Efectivo</option>
            <option value="TRANSFERENCIA">Transferencia</option>
            <option value="TARJETA">Tarjeta</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>

        <div>
          <label
            for="payment-proof"
            class="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Comprobante
            <span class="font-normal text-slate-400">(opcional)</span>
          </label>

          <input
            id="payment-proof"
            v-model="comprobanteUrl"
            type="text"
            maxlength="500"
            class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-ccisj focus:ring-1 focus:ring-ccisj"
            placeholder="URL del comprobante"
          />
        </div>

        <div>
          <label
            for="payment-observations"
            class="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Observaciones
            <span class="font-normal text-slate-400">(opcional)</span>
          </label>

          <textarea
            id="payment-observations"
            v-model="observaciones"
            maxlength="500"
            rows="3"
            class="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-ccisj focus:ring-1 focus:ring-ccisj"
            placeholder="Observaciones sobre el pago"
          />
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          @click="close"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="rounded-lg bg-ccisj px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!valid"
          @click="confirm"
        >
          Registrar pago
        </button>
      </div>
    </div>
  </div>
</template>
