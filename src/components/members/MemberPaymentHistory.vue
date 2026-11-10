<script setup lang="ts">
import { computed, ref } from 'vue';

import { Eye, Trash2 } from 'lucide-vue-next';

import type { FeePayment } from '@/types/fee.type.ts';

import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';

const props = defineProps<{
  payments: FeePayment[];
  // Cuántos mostrar antes de "Ver todos". Sin límite, todos.
  limit?: number;
}>();

const emit = defineEmits<{
  viewReceipt: [movementId: number];
  cancelPayment: [payment: FeePayment];
}>();

const MEDIOS: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  TRANSFERENCIA: 'Transferencia',
  TARJETA: 'Tarjeta',
  OTRO: 'Otro',
};

const expanded = ref(false);

const visible = computed(() =>
  props.limit && !expanded.value
    ? props.payments.slice(0, props.limit)
    : props.payments,
);

const hidden = computed(() => props.payments.length - visible.value.length);
</script>

<template>
  <section
    class="overflow-hidden rounded-xl border border-ccisj-line bg-white shadow-card"
  >
    <h2 class="px-5 py-4 text-lg font-semibold text-slate-900">Pagos</h2>

    <div
      v-if="payments.length === 0"
      class="border-t border-ccisj-line p-8 text-center text-base text-slate-600"
    >
      Todavía no hay pagos registrados.
    </div>

    <div v-else class="relative overflow-x-auto">
      <table class="w-full min-w-160 text-left">
        <thead class="border-t border-ccisj-line">
          <tr class="text-sm font-semibold text-slate-600">
            <th class="px-5 py-3">Fecha</th>
            <th class="px-5 py-3 text-right">Importe</th>
            <th class="px-5 py-3">Medio</th>
            <th class="px-5 py-3">Observaciones</th>
            <th class="px-5 py-3 text-right">
              <span class="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="payment in visible"
            :key="payment.id"
            class="border-t border-ccisj-line"
            :class="{ 'bg-slate-50/70': payment.anulado }"
          >
            <td class="whitespace-nowrap px-5 py-3 text-base text-slate-700">
              {{ formatDate(payment.fechaPago) }}
            </td>

            <td class="whitespace-nowrap px-5 py-3 text-right text-base">
              <span
                class="font-semibold"
                :class="
                  payment.anulado
                    ? 'text-slate-600 line-through'
                    : 'text-slate-900'
                "
              >
                {{ formatMoney(payment.importe) }}
              </span>
              <span
                v-if="payment.anulado"
                class="ml-2 text-sm font-semibold text-red-700"
              >
                Anulado
              </span>
            </td>

            <td class="whitespace-nowrap px-5 py-3 text-base text-slate-700">
              {{ MEDIOS[payment.medioPago] ?? payment.medioPago }}
            </td>

            <td class="max-w-72 px-5 py-3 text-base text-slate-600">
              <template v-if="payment.anulado">
                <p class="text-red-700">{{ payment.motivoAnulacion }}</p>

                <p
                  v-if="payment.anuladoPor"
                  class="mt-0.5 text-sm text-slate-600"
                >
                  Anulado por {{ payment.anuladoPor.email }}
                </p>
              </template>

              <template v-else>{{ payment.observaciones || '—' }}</template>
            </td>

            <td class="px-5 py-3">
              <div class="flex items-center justify-end gap-1">
                <!-- El comprobante sigue visible aunque el pago esté anulado. -->
                <button
                  v-if="payment.movimientoCaja?.comprobanteUrl"
                  type="button"
                  class="rounded-lg p-2 text-slate-600 transition hover:bg-ccisj-light hover:text-ccisj"
                  title="Ver comprobante"
                  aria-label="Ver comprobante"
                  @click="emit('viewReceipt', payment.movimientoCaja.id)"
                >
                  <Eye class="h-4 w-4" />
                </button>

                <button
                  v-if="!payment.anulado"
                  type="button"
                  class="rounded-lg p-2 text-slate-600 transition hover:bg-red-50 hover:text-red-700"
                  title="Anular pago"
                  aria-label="Anular pago"
                  @click="emit('cancelPayment', payment)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <button
      v-if="hidden > 0 || (limit && expanded)"
      type="button"
      class="w-full border-t border-ccisj-line px-5 py-3 text-base font-semibold text-ccisj transition hover:bg-slate-50"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Ver menos' : `Ver los ${payments.length} pagos` }}
    </button>
  </section>
</template>
