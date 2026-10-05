<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { Plus, Settings2, UserRoundCheck } from 'lucide-vue-next';

import CashCategoriesModal from '@/components/cash/CashCategoriesModal.vue';
import RegisterCashMovementModal from '@/components/cash/RegisterCashMovementModal.vue';
import RegisterMemberPaymentModal from '@/components/cash/RegisterMemberPaymentModal.vue';

import {
  cancelCashMovement,
  getCashCategories,
  getCashMovements,
  getSummary,
} from '@/services/cashService';

import { useToastStore } from '@/stores/toast';

import type {
  CashCategory,
  CashMovement,
  CashMovementFilters,
  CashSummary,
} from '@/types/cash.type';

const movements = ref<CashMovement[]>([]);
const summary = ref<CashSummary | null>(null);
const categories = ref<CashCategory[]>([]);
const filters = ref<CashMovementFilters>({
  desde: undefined,
  hasta: undefined,
  tipo: undefined,
  categoriaId: undefined,
  buscar: undefined,
});
const toast = useToastStore();

const loading = ref(true);
const showRegisterModal = ref(false);
const showCategoriesModal = ref(false);
const showRegisterMemberPaymentModal = ref(false);
const movementToCancel = ref<CashMovement | null>(null);
const cancellationReason = ref('');
const cancelling = ref(false);

async function loadCash() {
  loading.value = true;

  try {
    const [cashMovements, cashSummary, cashCategories] = await Promise.all([
      getCashMovements(filters.value),
      getSummary(),
      getCashCategories(),
    ]);

    movements.value = cashMovements;
    summary.value = cashSummary;
    categories.value = cashCategories;
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'Error al cargar la información de caja',
    );
  } finally {
    loading.value = false;
  }
}

async function handleCancelMovement() {
  if (!movementToCancel.value) {
    return;
  }

  const motivo = cancellationReason.value.trim();

  if (!motivo) {
    toast.error('Ingresá un motivo de anulación');
    return;
  }

  cancelling.value = true;

  try {
    await cancelCashMovement(movementToCancel.value.id, motivo);

    toast.success('Movimiento anulado correctamente');

    movementToCancel.value = null;
    cancellationReason.value = '';

    await loadCash();
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'Error al anular el movimiento',
    );
  } finally {
    cancelling.value = false;
  }
}

function clearFilters() {
  filters.value = {
    desde: undefined,
    hasta: undefined,
    tipo: undefined,
    categoriaId: undefined,
    buscar: undefined,
  };

  loadCash();
}

onMounted(loadCash);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Caja</h1>

        <p class="mt-1 text-sm text-slate-500">
          Gestión de ingresos y egresos de la institución.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-ccisj hover:bg-ccisj-light hover:text-ccisj"
          @click="showCategoriesModal = true"
        >
          <Settings2 class="h-4 w-4" />
          Gestionar categorías
        </button>

        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-ccisj px-3.5 py-2 text-sm font-semibold text-ccisj transition hover:bg-ccisj-light"
          @click="showRegisterMemberPaymentModal = true"
        >
          <UserRoundCheck class="h-4 w-4" />
          Registrar pago de socio
        </button>

        <button
          type="button"
          class="flex items-center gap-2 rounded-lg bg-ccisj px-3.5 py-2 text-sm font-semibold text-white transition"
          @click="showRegisterModal = true"
        >
          <Plus class="h-4 w-4" />
          Registrar movimiento
        </button>
      </div>
    </div>

    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div class="rounded-xl border border-slate-200 bg-white p-5">
        <p class="text-sm font-medium text-slate-500">Ingresos del mes</p>

        <p class="mt-2 text-2xl font-bold text-emerald-700">
          ${{ Number(summary?.ingresos ?? 0).toLocaleString('es-UY') }}
        </p>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5">
        <p class="text-sm font-medium text-slate-500">Egresos del mes</p>

        <p class="mt-2 text-2xl font-bold text-red-600">
          ${{ Number(summary?.egresos ?? 0).toLocaleString('es-UY') }}
        </p>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5">
        <p class="text-sm font-medium text-slate-500">Balance del mes</p>

        <p
          class="mt-2 text-2xl font-bold"
          :class="
            (summary?.balance ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-600'
          "
        >
          ${{ Number(summary?.balance ?? 0).toLocaleString('es-UY') }}
        </p>
      </div>

      <div class="rounded-xl border border-slate-200 bg-white p-5">
        <p class="text-sm font-medium text-slate-500">Movimientos del mes</p>

        <p class="mt-2 text-2xl font-bold text-slate-900">
          {{ summary?.cantidadMovimientos ?? 0 }}
        </p>
      </div>
    </section>

    <section
      class="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div class="border-b border-slate-100 px-5 py-4">
        <h2 class="font-semibold text-slate-900">Movimientos</h2>

        <p class="mt-0.5 text-xs text-slate-400">
          Historial de ingresos y egresos registrados
        </p>
      </div>

      <div class="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label class="mb-1 block text-xs font-medium text-slate-500">
              Desde
            </label>

            <input
              v-model="filters.desde"
              type="date"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-ccisj"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium text-slate-500">
              Hasta
            </label>

            <input
              v-model="filters.hasta"
              type="date"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-ccisj"
            />
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium text-slate-500">
              Tipo
            </label>

            <select
              v-model="filters.tipo"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-ccisj"
            >
              <option :value="undefined">Todos</option>
              <option value="INGRESO">Ingresos</option>
              <option value="EGRESO">Egresos</option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium text-slate-500">
              Categoría
            </label>

            <select
              v-model="filters.categoriaId"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-ccisj"
            >
              <option :value="undefined">Todas</option>

              <option
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.nombre }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-1 block text-xs font-medium text-slate-500">
              Concepto
            </label>

            <input
              v-model="filters.buscar"
              type="text"
              placeholder="Buscar..."
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-ccisj"
              @keyup.enter="loadCash"
            />
          </div>
        </div>

        <div class="mt-3 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            @click="clearFilters"
          >
            Limpiar
          </button>

          <button
            type="button"
            class="rounded-lg bg-ccisj px-3.5 py-2 text-sm font-semibold text-white transition"
            @click="loadCash"
          >
            Aplicar filtros
          </button>
        </div>
      </div>

      <div v-if="loading" class="p-10 text-center text-sm text-slate-400">
        Cargando movimientos...
      </div>

      <div
        v-else-if="movements.length === 0"
        class="p-10 text-center text-sm text-slate-400"
      >
        No hay movimientos registrados.
      </div>

      <div v-else class="max-h-80 overflow-auto">
        <table class="w-full text-center">
          <thead class="sticky top-0 z-10 bg-slate-50">
            <tr
              class="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              <th class="px-5 py-3">Fecha</th>

              <th class="px-5 py-3">Concepto</th>

              <th class="px-5 py-3">Categoría</th>

              <th class="px-5 py-3">Tipo</th>

              <th class="px-5 py-3">Importe</th>

              <th class="px-5 py-3">Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="movement in movements"
              :key="movement.id"
              class="border-t border-slate-100"
            >
              <td class="whitespace-nowrap px-5 py-3.5 text-sm text-slate-500">
                {{ new Date(movement.fecha).toLocaleDateString('es-UY') }}
              </td>

              <td class="px-5 py-3.5">
                <p class="text-sm font-medium text-slate-800">
                  {{ movement.concepto }}
                </p>

                <p
                  v-if="movement.observaciones"
                  class="mt-0.5 max-w-xs truncate text-xs text-slate-400"
                >
                  {{ movement.observaciones }}
                </p>
              </td>

              <td class="px-5 py-3.5">
                <span class="text-sm text-slate-600">
                  {{ movement.categoria.nombre }}
                </span>
              </td>

              <td class="px-5 py-3.5">
                <span
                  v-if="movement.tipo === 'INGRESO'"
                  class="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                >
                  Ingreso
                </span>

                <span
                  v-else
                  class="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600"
                >
                  Egreso
                </span>
              </td>

              <td
                class="whitespace-nowrap px-5 py-3.5 t text-sm font-semibold"
                :class="
                  movement.tipo === 'INGRESO'
                    ? 'text-emerald-700'
                    : 'text-red-600'
                "
              >
                {{ movement.tipo === 'INGRESO' ? '+' : '-' }}
                ${{ Number(movement.importe).toLocaleString('es-UY') }}
              </td>

              <td class="whitespace-nowrap px-5 py-3.5">
                <span
                  v-if="movement.anulado"
                  class="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
                >
                  Anulado
                </span>

                <button
                  v-else-if="!movement.pagoCuota"
                  type="button"
                  class="text-sm font-semibold text-red-600 transition hover:text-red-700"
                  @click="movementToCancel = movement"
                >
                  Anular
                </button>

                <span v-else class="text-xs text-slate-400"> — </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <RegisterCashMovementModal
      :open="showRegisterModal"
      @close="showRegisterModal = false"
      @created="
        showRegisterModal = false;
        loadCash();
      "
    />

    <CashCategoriesModal
      :open="showCategoriesModal"
      @close="showCategoriesModal = false"
    />

    <RegisterMemberPaymentModal
      :open="showRegisterMemberPaymentModal"
      @close="showRegisterMemberPaymentModal = false"
      @created="
        showRegisterMemberPaymentModal = false;
        loadCash();
      "
    />

    <div
      v-if="movementToCancel"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 class="text-lg font-semibold text-slate-900">Anular movimiento</h2>

        <p class="mt-2 text-sm text-slate-500">
          El movimiento permanecerá en el historial, pero dejará de
          contabilizarse en Caja.
        </p>

        <div class="mt-4 rounded-lg bg-slate-50 p-3">
          <p class="text-sm font-medium text-slate-800">
            {{ movementToCancel.concepto }}
          </p>

          <p class="mt-1 text-sm text-slate-500">
            ${{ Number(movementToCancel.importe).toLocaleString('es-UY') }}
          </p>
        </div>

        <div class="mt-4">
          <label class="mb-1 block text-sm font-medium text-slate-700">
            Motivo de anulación
          </label>

          <textarea
            v-model="cancellationReason"
            rows="3"
            maxlength="500"
            placeholder="Ej: Importe registrado incorrectamente"
            class="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-ccisj"
          />
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            :disabled="cancelling"
            @click="
              movementToCancel = null;
              cancellationReason = '';
            "
          >
            Cancelar
          </button>

          <button
            type="button"
            class="rounded-lg bg-red-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            :disabled="cancelling"
            @click="handleCancelMovement"
          >
            {{ cancelling ? 'Anulando...' : 'Anular movimiento' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
