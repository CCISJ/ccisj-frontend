<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next';

import type { FeeAdjustment } from '@/types/fee.type.ts';

import { formatMonth } from '@/utils/date';

defineProps<{
  adjustments: FeeAdjustment[];
}>();

const emit = defineEmits<{
  delete: [adjustment: FeeAdjustment];
}>();
</script>

<template>
  <section class="rounded-xl border border-slate-200 bg-white p-5">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-base font-semibold text-slate-900">
          Ajustes programados
        </h2>

        <p class="mt-1 text-base text-slate-600">
          Adicionales y descuentos aplicados a las cuotas del socio.
        </p>
      </div>
    </div>

    <div
      v-if="adjustments.length === 0"
      class="rounded-lg bg-slate-50 px-4 py-6 text-center text-base text-slate-600"
    >
      No hay ajustes registrados.
    </div>

    <div v-else class="divide-y divide-slate-100">
      <div
        v-for="adjustment in adjustments"
        :key="adjustment.id"
        class="flex items-center justify-between gap-4 py-3"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span
              class="font-semibold"
              :class="
                adjustment.tipo === 'ADICIONAL'
                  ? 'text-red-700'
                  : 'text-emerald-700'
              "
            >
              {{ adjustment.tipo === 'ADICIONAL' ? '+' : '-' }}${{
                adjustment.importe.toLocaleString('es-UY')
              }}
            </span>

            <span
              class="rounded-full px-2 py-0.5 text-sm font-medium"
              :class="
                adjustment.tipo === 'ADICIONAL'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-emerald-50 text-emerald-700'
              "
            >
              {{ adjustment.tipo === 'ADICIONAL' ? 'Adicional' : 'Descuento' }}
            </span>
          </div>

          <p v-if="adjustment.motivo" class="mt-1 text-base text-slate-600">
            {{ adjustment.motivo }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-4">
          <p class="text-base text-slate-600">
            {{ formatMonth(adjustment.fechaDesde) }}
            →
            {{
              adjustment.fechaHasta
                ? formatMonth(adjustment.fechaHasta)
                : 'Indefinido'
            }}
          </p>

          <button
            type="button"
            class="rounded-lg p-2 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            title="Eliminar ajuste"
            aria-label="Eliminar ajuste"
            @click="emit('delete', adjustment)"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
