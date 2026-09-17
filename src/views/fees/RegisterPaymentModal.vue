<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { Check, X } from 'lucide-vue-next';

import type { PayableFee } from '@/types/fee.type';

import { formatDate } from '@/utils/format';

type Props = {
  open: boolean;
  socioName: string;
  fees: PayableFee[];
};

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  confirm: [cuotaIds: number[]];
}>();

const selectedIds = ref<number[]>([]);

const selectedFees = computed(() =>
  props.fees.filter((fee) => selectedIds.value.includes(fee.id)),
);

const total = computed(() =>
  selectedFees.value.reduce((sum, fee) => sum + fee.importeTotal, 0),
);

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0,
  }).format(value);
}

/*
 * Solo se pueden seleccionar cuotas consecutivas desde la más antigua.
 * No se puede seleccionar Marzo sin Febrero.
 */
function canSelect(index: number) {
  if (index === 0) return true;

  const previousFee = props.fees[index - 1];

  if (!previousFee) return false;

  return selectedIds.value.includes(previousFee.id);
}

function toggleFee(fee: PayableFee, index: number) {
  const selected = selectedIds.value.includes(fee.id);

  if (selected) {
    /*
     * Si desmarcamos una cuota, también quitamos todas las posteriores.
     */
    selectedIds.value = props.fees
      .slice(0, index)
      .map((item) => item.id)
      .filter((id) => selectedIds.value.includes(id));

    return;
  }

  if (!canSelect(index)) return;

  selectedIds.value.push(fee.id);
}

function close() {
  emit('close');
}

function confirm() {
  if (selectedIds.value.length === 0) return;

  emit('confirm', [...selectedIds.value]);
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      selectedIds.value = [];
    }
  },
);
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    @click.self="close"
  >
    <div
      class="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl bg-white shadow-xl"
    >
      <!-- Encabezado -->
      <div
        class="flex items-start justify-between border-b border-slate-100 px-5 py-4"
      >
        <div>
          <h2 class="text-lg font-bold text-slate-900">Registrar pago</h2>

          <p class="mt-0.5 text-sm text-slate-500">
            {{ socioName }}
          </p>
        </div>

        <button
          type="button"
          class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          @click="close"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Contenido -->
      <div class="p-5">
        <p class="mb-3 text-sm font-medium text-slate-700">
          Seleccioná las cuotas a pagar
        </p>

        <div
          v-if="fees.length === 0"
          class="rounded-lg bg-emerald-50 p-5 text-center"
        >
          <p class="text-sm font-medium text-emerald-700">
            El socio no tiene cuotas pendientes.
          </p>
        </div>

        <div v-else class="max-h-72 space-y-2 overflow-y-auto pr-1">
          <button
            v-for="(fee, index) in fees"
            :key="fee.id"
            type="button"
            :disabled="!canSelect(index)"
            class="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition"
            :class="[
              selectedIds.includes(fee.id)
                ? 'border-ccisj bg-ccisj-light'
                : 'border-slate-200 bg-white',
              !canSelect(index)
                ? 'cursor-not-allowed opacity-45'
                : 'hover:border-ccisj',
            ]"
            @click="toggleFee(fee, index)"
          >
            <!-- Checkbox -->
            <div
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded border"
              :class="
                selectedIds.includes(fee.id)
                  ? 'border-ccisj bg-ccisj text-white'
                  : 'border-slate-300 bg-white'
              "
            >
              <Check v-if="selectedIds.includes(fee.id)" class="h-3.5 w-3.5" />
            </div>

            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-slate-800">
                {{ formatDate(fee.periodoDesde) }}
                <span class="mx-1 text-slate-300">—</span>
                {{ formatDate(fee.periodoHasta) }}
              </p>

              <p class="mt-0.5 text-xs text-slate-400">
                Vence {{ formatDate(fee.fechaVencimiento) }}
              </p>
            </div>

            <span
              class="whitespace-nowrap text-sm font-semibold text-slate-800"
            >
              {{ formatMoney(fee.importeTotal) }}
            </span>
          </button>
        </div>

        <!-- Total -->
        <div
          v-if="fees.length > 0"
          class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"
        >
          <div>
            <p class="text-xs text-slate-400">Total a registrar</p>

            <p class="text-xs text-slate-500">
              {{ selectedIds.length }}
              {{ selectedIds.length === 1 ? 'cuota' : 'cuotas' }}
            </p>
          </div>

          <p class="text-xl font-bold text-slate-900">
            {{ formatMoney(total) }}
          </p>
        </div>
      </div>

      <!-- Acciones -->
      <div
        class="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4"
      >
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          @click="close"
        >
          Cancelar
        </button>

        <button
          v-if="fees.length > 0"
          type="button"
          :disabled="selectedIds.length === 0"
          class="rounded-lg bg-ccisj px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          @click="confirm"
        >
          Registrar pago
        </button>
      </div>
    </div>
  </div>
</template>
