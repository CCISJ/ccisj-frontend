<script setup lang="ts">
import { Plus, Trash2 } from 'lucide-vue-next';

import type { FeeAdjustment } from '@/types/fee.type.ts';

import { formatMonth } from '@/utils/date';

defineProps<{
  adjustments: FeeAdjustment[];
}>();

const emit = defineEmits<{
  add: [];
  delete: [adjustment: FeeAdjustment];
}>();
</script>

<template>
  <section class="rounded-xl border border-ccisj-line bg-white shadow-card p-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold text-slate-900">Ajustes</h2>

        <p class="text-base text-slate-600">
          Adicionales o descuentos que se suman a sus próximas cuotas.
        </p>
      </div>

      <button
        type="button"
        class="flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 font-semibold text-slate-800 transition hover:border-ccisj hover:text-ccisj"
        @click="emit('add')"
      >
        <Plus class="h-4 w-4" />
        Agregar ajuste
      </button>
    </div>

    <p v-if="adjustments.length === 0" class="mt-3 text-base text-slate-600">
      No tiene ajustes.
    </p>

    <div v-else class="mt-3 divide-y divide-ccisj-line">
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
