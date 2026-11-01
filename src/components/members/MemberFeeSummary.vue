<script setup lang="ts">
import { computed } from 'vue';

import { CircleCheck, Clock3, TriangleAlert } from 'lucide-vue-next';

import type { MemberFeeSummary } from '@/types/fee.type';

import { formatMoney } from '@/utils/money';

const props = defineProps<{
  summary: MemberFeeSummary | null;
}>();

const statusLabel = computed(() => {
  if (!props.summary) return 'Sin información';
  if (props.summary.estado === 'AL_DIA') return 'Al día';
  if (props.summary.estado === 'PENDIENTE') return 'Pendiente';
  return 'Deudor';
});

const statusClass = computed(() => {
  if (!props.summary) return 'bg-slate-100 text-slate-600';
  if (props.summary.estado === 'AL_DIA')
    return 'bg-emerald-50 text-emerald-700';
  if (props.summary.estado === 'PENDIENTE') return 'bg-amber-50 text-amber-700';
  return 'bg-red-50 text-red-600';
});
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2
          class="text-xs font-semibold uppercase tracking-wide text-slate-400"
        >
          Estado de cuenta
        </h2>
        <p class="mt-1 text-sm text-slate-500">
          Situación actual de las cuotas del socio.
        </p>
      </div>

      <span
        class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
        :class="statusClass"
      >
        {{ statusLabel }}
      </span>
    </div>

    <div v-if="summary" class="mt-5 grid gap-4 sm:grid-cols-2">
      <div class="rounded-xl bg-slate-50 p-4">
        <div class="flex items-center justify-between">
          <p class="text-xs font-medium text-slate-500">Cuotas pendientes</p>
          <Clock3 class="h-4 w-4 text-slate-400" />
        </div>
        <p class="mt-2 text-xl font-bold text-slate-900">
          {{ summary.cuotasPendientes }}
        </p>
      </div>

      <div class="rounded-xl bg-slate-50 p-4">
        <div class="flex items-center justify-between">
          <p class="text-xs font-medium text-slate-500">Deuda total</p>
          <TriangleAlert
            v-if="summary.deudaTotal > 0"
            class="h-4 w-4 text-red-500"
          />
          <CircleCheck v-else class="h-4 w-4 text-emerald-600" />
        </div>
        <p class="mt-2 text-xl font-bold text-slate-900">
          {{ formatMoney(summary.deudaTotal) }}
        </p>
      </div>
    </div>

    <div
      v-else
      class="mt-5 rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-400"
    >
      No hay información de cuotas disponible para este socio.
    </div>
  </section>
</template>
