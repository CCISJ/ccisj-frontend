<script setup lang="ts">
import type { Fee } from '@/types/fee.type.ts';

import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';

defineProps<{
  fees: Fee[];
}>();

function feeStatusLabel(status: Fee['estado']) {
  if (status === 'PAGADA') return 'Pagada';
  if (status === 'ANULADA') return 'Anulada';
  return 'Pendiente';
}

function feeStatusClass(status: Fee['estado']) {
  if (status === 'PAGADA') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (status === 'ANULADA') {
    return 'bg-slate-100 text-slate-600';
  }

  return 'bg-amber-50 text-amber-700';
}
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div class="px-5 py-4">
      <h2 class="text-sm font-semibold text-slate-600">Historial de cuotas</h2>

      <p class="mt-1 text-base text-slate-600">
        Cuotas generadas para este socio.
      </p>
    </div>

    <div
      v-if="fees.length === 0"
      class="border-t border-slate-100 p-8 text-center text-base text-slate-600"
    >
      No hay cuotas registradas para este socio.
    </div>

    <div v-else class="relative overflow-x-auto">
      <table class="w-full min-w-180 text-left">
        <thead class="border-t border-slate-100 bg-slate-50">
          <tr class="text-sm font-semibold text-slate-600">
            <th class="px-5 py-3">Período</th>
            <th class="px-5 py-3">Vencimiento</th>
            <th class="px-5 py-3">Base</th>
            <th class="px-5 py-3">Ajustes</th>
            <th class="px-5 py-3">Total</th>
            <th class="px-5 py-3">Estado</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="fee in fees"
            :key="fee.id"
            class="border-t border-slate-100"
          >
            <td class="whitespace-nowrap px-5 py-3.5 text-base text-slate-700">
              {{ formatDate(fee.periodoDesde) }}
              <span class="mx-1 text-slate-300">—</span>
              {{ formatDate(fee.periodoHasta) }}
            </td>

            <td class="whitespace-nowrap px-5 py-3.5 text-base text-slate-600">
              {{ formatDate(fee.fechaVencimiento) }}
            </td>

            <td class="whitespace-nowrap px-5 py-3.5 text-base text-slate-600">
              {{ formatMoney(fee.importeBase) }}
            </td>

            <td class="whitespace-nowrap px-5 py-3.5 text-base">
              <span
                :class="
                  fee.importeAjustes > 0
                    ? 'text-red-700'
                    : fee.importeAjustes < 0
                      ? 'text-emerald-700'
                      : 'text-slate-600'
                "
              >
                {{
                  fee.importeAjustes > 0
                    ? `+${formatMoney(fee.importeAjustes)}`
                    : formatMoney(fee.importeAjustes)
                }}
              </span>
            </td>

            <td
              class="whitespace-nowrap px-5 py-3.5 text-base font-semibold text-slate-800"
            >
              {{ formatMoney(fee.importeTotal) }}
            </td>

            <td class="px-5 py-3.5">
              <span
                class="inline-flex rounded-full px-2.5 py-1 text-sm font-medium"
                :class="feeStatusClass(fee.estado)"
              >
                {{ feeStatusLabel(fee.estado) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
