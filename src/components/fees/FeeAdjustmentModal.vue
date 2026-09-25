<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { Minus, Plus } from 'lucide-vue-next';

import BaseModal from '@/components/BaseModal.vue';

import type { AdjustmentDuration, AdjustmentType } from '@/types/fee.type';

import { getCurrentMonth, getMonthRange } from '@/utils/date';
import { formatMoney } from '@/utils/money';

type Props = {
  open: boolean;
  socioName: string;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  confirm: [
    data: {
      tipo: AdjustmentType;
      importe: number;
      fechaDesde: string;
      fechaHasta?: string;
      motivo: string;
    },
  ];
}>();

const type = ref<AdjustmentType>('ADICIONAL');
const amount = ref<number | null>(null);
const duration = ref<AdjustmentDuration>('1');
const reason = ref('');

const durationMonths = computed<number | null>(() => {
  if (duration.value === 'INDEFINIDO') return null;

  return Number(duration.value);
});

const valid = computed(() => {
  return amount.value !== null && amount.value > 0;
});

function close() {
  emit('close');
}

const startMonth = ref(getCurrentMonth());
const minStartMonth = getCurrentMonth();

function confirm() {
  if (!valid.value || amount.value === null) return;

  const { fechaDesde, fechaHasta } = getMonthRange(
    startMonth.value,
    durationMonths.value,
  );

  emit('confirm', {
    tipo: type.value,
    importe: amount.value,
    fechaDesde,
    fechaHasta,
    motivo: reason.value.trim(),
  });
}

watch(
  () => props.open,
  (open) => {
    if (!open) return;

    type.value = 'ADICIONAL';
    amount.value = null;
    duration.value = '1';
    reason.value = '';
    startMonth.value = getCurrentMonth();
  },
);
</script>

<template>
  <BaseModal :open="open" max-width="lg" @close="close">
    <template #header>
      <div>
        <h2 class="text-lg font-bold text-slate-900">
          Agregar ajuste de cuota
        </h2>

        <p class="mt-0.5 text-sm text-slate-500">
          {{ socioName }}
        </p>
      </div>
    </template>

    <div class="p-5">
      <!-- Tipo -->
      <div>
        <label class="mb-2 block text-sm font-semibold text-slate-700">
          Tipo de ajuste
        </label>

        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition"
            :class="
              type === 'ADICIONAL'
                ? 'border-ccisj bg-ccisj-light text-ccisj'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            "
            @click="type = 'ADICIONAL'"
          >
            <Plus class="h-4 w-4" />
            Adicional
          </button>

          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition"
            :class="
              type === 'DESCUENTO'
                ? 'border-ccisj bg-ccisj-light text-ccisj'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            "
            @click="type = 'DESCUENTO'"
          >
            <Minus class="h-4 w-4" />
            Descuento
          </button>
        </div>
      </div>

      <!-- Importe -->
      <div class="mt-5">
        <label
          for="adjustment-amount"
          class="mb-2 block text-sm font-semibold text-slate-700"
        >
          Importe
        </label>

        <div class="relative">
          <span
            class="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400"
          >
            $
          </span>

          <input
            id="adjustment-amount"
            v-model.number="amount"
            type="number"
            min="1"
            step="1"
            placeholder="0"
            class="w-full rounded-lg border border-slate-200 py-2.5 pl-8 pr-3 text-sm outline-none transition focus:border-ccisj"
          />
        </div>
      </div>

      <!-- Mes de inicio -->
      <div class="mt-5">
        <label
          for="adjustment-start-month"
          class="mb-2 block text-sm font-semibold text-slate-700"
        >
          Mes de inicio
        </label>

        <input
          id="adjustment-start-month"
          v-model="startMonth"
          type="month"
          :min="minStartMonth"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-ccisj"
        />

        <p class="mt-1.5 text-xs text-slate-400">
          El ajuste comenzará a aplicarse desde este mes.
        </p>
      </div>

      <!-- Duración -->
      <div class="mt-5">
        <label
          for="adjustment-duration"
          class="mb-2 block text-sm font-semibold text-slate-700"
        >
          Duración
        </label>

        <select
          id="adjustment-duration"
          v-model="duration"
          class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-ccisj"
        >
          <option value="1">1 mes</option>
          <option value="2">2 meses</option>
          <option value="3">3 meses</option>
          <option value="6">6 meses</option>
          <option value="12">12 meses</option>
          <option value="INDEFINIDO">Indefinido</option>
        </select>

        <p class="mt-1.5 text-xs text-slate-400">
          El ajuste se aplicará a las próximas cuotas durante este período.
        </p>
      </div>

      <!-- Motivo -->
      <div class="mt-5">
        <label
          for="adjustment-reason"
          class="mb-2 block text-sm font-semibold text-slate-700"
        >
          Motivo
          <span class="font-normal text-slate-400">(opcional)</span>
        </label>

        <textarea
          id="adjustment-reason"
          v-model="reason"
          rows="3"
          maxlength="255"
          placeholder="Ej: beneficio especial, servicio adicional..."
          class="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj"
        />

        <p class="mt-1 text-right text-xs text-slate-400">
          {{ reason.length }}/255
        </p>
      </div>

      <!-- Resumen -->
      <div v-if="amount && amount > 0" class="mt-5 rounded-xl bg-slate-50 p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-400">
          Ajuste
        </p>

        <div class="mt-1 flex items-center justify-between">
          <span class="text-sm text-slate-600">
            {{
              type === 'ADICIONAL'
                ? 'Se agregará a la cuota'
                : 'Se descontará de la cuota'
            }}
          </span>

          <span
            class="text-lg font-bold"
            :class="
              type === 'ADICIONAL' ? 'text-slate-900' : 'text-emerald-600'
            "
          >
            {{ type === 'ADICIONAL' ? '+' : '-' }}
            {{ formatMoney(amount) }}
          </span>
        </div>

        <p class="mt-1 text-xs text-slate-400">
          {{
            duration === 'INDEFINIDO'
              ? 'Sin fecha de finalización'
              : `Durante ${duration} ${duration === '1' ? 'mes' : 'meses'}`
          }}
        </p>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          @click="close"
        >
          Cancelar
        </button>

        <button
          type="button"
          :disabled="!valid"
          class="rounded-lg bg-ccisj px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          @click="confirm"
        >
          Agregar ajuste
        </button>
      </div>
    </template>
  </BaseModal>
</template>
