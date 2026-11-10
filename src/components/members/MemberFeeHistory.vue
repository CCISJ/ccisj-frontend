<script setup lang="ts">
import { computed, ref } from 'vue';

import type { Fee } from '@/types/fee.type.ts';

import { formatDate, uruguayDay } from '@/utils/date';
import { formatMoney } from '@/utils/money';

const props = defineProps<{
  fees: Fee[];
  // Cuántas mostrar antes de "Ver todas". Sin límite, todas.
  limit?: number;
}>();

const expanded = ref(false);

const visible = computed(() =>
  props.limit && !expanded.value
    ? props.fees.slice(0, props.limit)
    : props.fees,
);

const hidden = computed(() => props.fees.length - visible.value.length);

/** "Noviembre de 2026": el período se lee como el mes que es. */
function monthOf(value: string) {
  const text = new Intl.DateTimeFormat('es-UY', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));

  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** La misma regla que el backend: vencida desde el día siguiente al vencimiento. */
function isOverdue(fee: Fee) {
  return (
    fee.estado === 'PENDIENTE' &&
    fee.fechaVencimiento.slice(0, 10) < uruguayDay()
  );
}

/** Pagada y anulada van en texto normal: solo lo que hay que cobrar resalta. */
function statusLabel(fee: Fee) {
  if (fee.estado === 'PAGADA') return 'Pagada';
  if (fee.estado === 'ANULADA') return 'Anulada';
  return isOverdue(fee) ? 'Vencida' : 'Por vencer';
}

function statusClass(fee: Fee) {
  if (fee.estado !== 'PENDIENTE') return 'text-slate-600';
  return isOverdue(fee)
    ? 'font-semibold text-red-700'
    : 'font-semibold text-amber-800';
}
</script>

<template>
  <section
    class="overflow-hidden rounded-xl border border-ccisj-line bg-white shadow-card"
  >
    <h2 class="px-5 py-4 text-lg font-semibold text-slate-900">Cuotas</h2>

    <div
      v-if="fees.length === 0"
      class="border-t border-ccisj-line p-8 text-center text-base text-slate-600"
    >
      Todavía no se generaron cuotas.
    </div>

    <div v-else class="relative overflow-x-auto">
      <table class="w-full min-w-160 text-left">
        <thead class="border-t border-ccisj-line">
          <tr class="text-sm font-semibold text-slate-600">
            <th class="px-5 py-3">Mes</th>
            <th class="px-5 py-3">Vence</th>
            <th class="px-5 py-3 text-right">Importe</th>
            <th class="px-5 py-3">Estado</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="fee in visible"
            :key="fee.id"
            class="border-t border-ccisj-line"
          >
            <td class="whitespace-nowrap px-5 py-3 text-base text-slate-900">
              {{ monthOf(fee.periodoDesde) }}
            </td>

            <td class="whitespace-nowrap px-5 py-3 text-base text-slate-700">
              {{ formatDate(fee.fechaVencimiento) }}
            </td>

            <td class="whitespace-nowrap px-5 py-3 text-right text-base">
              <span class="font-semibold text-slate-900">
                {{ formatMoney(fee.importeTotal) }}
              </span>

              <!-- El detalle solo cuando hay un ajuste que explicar. -->
              <span
                v-if="fee.importeAjustes !== 0"
                class="block text-sm text-slate-600"
              >
                {{ formatMoney(fee.importeBase) }}
                {{ fee.importeAjustes > 0 ? '+' : '−' }}
                {{ formatMoney(Math.abs(fee.importeAjustes)) }} de ajuste
              </span>
            </td>

            <td class="whitespace-nowrap px-5 py-3 text-base">
              <span :class="statusClass(fee)">{{ statusLabel(fee) }}</span>
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
      {{ expanded ? 'Ver menos' : `Ver las ${fees.length} cuotas` }}
    </button>
  </section>
</template>
