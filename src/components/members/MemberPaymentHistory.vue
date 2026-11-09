<script setup lang="ts">
import { Eye, Trash2 } from 'lucide-vue-next';

import type { FeePayment } from '@/types/fee.type.ts';

import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';

defineProps<{
  payments: FeePayment[];
}>();

const emit = defineEmits<{
  viewReceipt: [movementId: number];
  cancelPayment: [payment: FeePayment];
}>();
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div class="px-5 py-4">
      <h2 class="text-sm font-semibold text-slate-600">Historial de pagos</h2>

      <p class="mt-1 text-base text-slate-600">
        Pagos de cuotas registrados para este socio.
      </p>
    </div>

    <div
      v-if="payments.length === 0"
      class="border-t border-slate-100 p-8 text-center text-base text-slate-600"
    >
      No hay pagos registrados para este socio.
    </div>

    <div v-else class="relative overflow-x-auto">
      <table class="w-full min-w-180 text-left">
        <thead class="border-t border-slate-100 bg-slate-50">
          <tr class="text-sm font-semibold text-center text-slate-600">
            <th class="px-5 py-3">Fecha</th>
            <th class="px-5 py-3">Importe</th>
            <th class="px-5 py-3">Medio</th>
            <th class="px-5 py-3">Estado</th>
            <th class="px-5 py-3">Observaciones</th>
            <th class="px-5 py-3">Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="payment in payments"
            :key="payment.id"
            class="border-t border-slate-100 text-center"
            :class="{ 'bg-slate-50/70': payment.anulado }"
          >
            <td class="whitespace-nowrap px-5 py-3.5 text-base text-slate-600">
              {{ formatDate(payment.fechaPago) }}
            </td>

            <td
              class="whitespace-nowrap px-5 py-3.5 text-base font-semibold"
              :class="
                payment.anulado
                  ? 'text-slate-600 line-through'
                  : 'text-slate-800'
              "
            >
              {{ formatMoney(payment.importe) }}
            </td>

            <td class="whitespace-nowrap px-5 py-3.5 text-base text-slate-600">
              {{ payment.medioPago }}
            </td>

            <td class="px-5 py-3.5">
              <span
                v-if="payment.anulado"
                class="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-sm font-medium text-red-700"
              >
                Anulado
              </span>

              <span
                v-else
                class="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700"
              >
                Registrado
              </span>
            </td>

            <td class="max-w-64 px-5 py-3.5 text-base text-slate-600">
              <template v-if="payment.anulado">
                <p class="font-medium text-red-700">
                  {{ payment.motivoAnulacion }}
                </p>

                <p
                  v-if="payment.anuladoPor"
                  class="mt-1 text-sm text-slate-600"
                >
                  Anulado por {{ payment.anuladoPor.email }}
                </p>
              </template>

              <template v-else>
                {{ payment.observaciones || '—' }}
              </template>
            </td>

            <td class="px-5 py-3.5">
              <div
                v-if="
                  payment.movimientoCaja?.comprobanteUrl || !payment.anulado
                "
                class="flex items-center justify-center gap-1"
              >
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
                  class="rounded-lg p-2 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                  title="Anular pago"
                  @click="emit('cancelPayment', payment)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>

              <span v-else class="text-base text-slate-300">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
