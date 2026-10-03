<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import BaseModal from '@/components/BaseModal.vue';

import { createCashMovement, getCashCategories } from '@/services/cashService';

import { useToastStore } from '@/stores/toast';

import type { CashCategory, CashMovementType } from '@/types/cash.type';

import { todayLocal } from '@/utils/date';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
  created: [];
}>();

const categories = ref<CashCategory[]>([]);
const toast = useToastStore();

const tipo = ref<CashMovementType>('INGRESO');
const categoriaId = ref<number | null>(null);
const concepto = ref('');
const importe = ref<number | null>(null);
const fecha = ref(todayLocal());
const observaciones = ref('');

const loading = ref(false);

const availableCategories = computed(() =>
  categories.value.filter(
    (category) =>
      category.activa &&
      category.tipo === tipo.value &&
      !(category.tipo === 'INGRESO' && category.nombre === 'Cuotas de socios'),
  ),
);

watch(tipo, () => {
  categoriaId.value = null;
});

async function loadCategories() {
  try {
    categories.value = await getCashCategories();
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudieron cargar las categorías de caja',
    );
  }
}

function resetForm() {
  tipo.value = 'INGRESO';
  categoriaId.value = null;
  concepto.value = '';
  importe.value = null;
  fecha.value = todayLocal();
  observaciones.value = '';
}

function close() {
  resetForm();
  emit('close');
}

async function submit() {
  if (!categoriaId.value) {
    toast.error('Seleccioná una categoría');
    return;
  }

  if (!concepto.value.trim()) {
    toast.error('Ingresá un concepto');
    return;
  }

  if (!importe.value || importe.value <= 0) {
    toast.error('Ingresá un importe válido');
    return;
  }

  loading.value = true;

  try {
    await createCashMovement({
      tipo: tipo.value,
      categoriaId: categoriaId.value,
      concepto: concepto.value.trim(),
      importe: importe.value,
      fecha: fecha.value,
      observaciones: observaciones.value.trim() || undefined,
    });

    resetForm();
    emit('created');

    toast.success('Movimiento de caja registrado correctamente');
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudo registrar el movimiento de caja',
    );
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      loadCategories();
    }
  },
);
</script>

<template>
  <BaseModal
    :open="open"
    title="Registrar movimiento"
    max-width="lg"
    @close="close"
  >
    <form class="space-y-5 p-6" @submit.prevent="submit">
      <!-- Tipo y categoría -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">
            Tipo
          </label>

          <select
            v-model="tipo"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-ccisj"
          >
            <option value="INGRESO">Ingreso</option>

            <option value="EGRESO">Egreso</option>
          </select>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">
            Categoría
          </label>

          <select
            v-model="categoriaId"
            class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-ccisj"
            required
          >
            <option :value="null" disabled>Seleccionar categoría</option>

            <option
              v-for="category in availableCategories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.nombre }}
            </option>
          </select>

          <p
            v-if="availableCategories.length === 0"
            class="mt-1.5 text-xs text-amber-600"
          >
            No hay categorías disponibles para este tipo.
          </p>
        </div>
      </div>

      <!-- Concepto -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700">
          Concepto
        </label>

        <input
          v-model="concepto"
          type="text"
          maxlength="255"
          class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-ccisj"
          placeholder="Ej. Alquiler de salón"
        />
      </div>

      <!-- Importe y fecha -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">
            Importe
          </label>

          <div class="relative">
            <span
              class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400"
            >
              $
            </span>

            <input
              v-model.number="importe"
              type="number"
              min="0.01"
              step="0.01"
              class="w-full rounded-lg border border-slate-200 py-2.5 pl-7 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-ccisj"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-slate-700">
            Fecha
          </label>

          <input
            v-model="fecha"
            type="date"
            class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-ccisj"
          />
        </div>
      </div>

      <!-- Observaciones -->
      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700">
          Observaciones
          <span class="font-normal text-slate-400"> (opcional) </span>
        </label>

        <textarea
          v-model="observaciones"
          rows="3"
          maxlength="500"
          class="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-ccisj"
          placeholder="Información adicional sobre el movimiento"
        />
      </div>

      <!-- Acciones -->
      <div class="flex justify-end gap-3 border-t border-slate-100 pt-5">
        <button
          type="button"
          class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          :disabled="loading"
          @click="close"
        >
          Cancelar
        </button>

        <button
          type="submit"
          class="rounded-lg bg-ccisj px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? 'Registrando...' : 'Registrar movimiento' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
