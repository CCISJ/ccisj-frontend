<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { Plus, Settings2, UserRoundCheck } from 'lucide-vue-next';

import CashCategoriesModal from '@/components/cash/CashCategoriesModal.vue';
import RegisterCashMovementModal from '@/components/cash/RegisterCashMovementModal.vue';
import RegisterMemberPaymentModal from '@/components/cash/RegisterMemberPaymentModal.vue';

import { getCashMovements } from '@/services/cashService';

import { useToastStore } from '@/stores/toast';

import type { CashMovement } from '@/types/cash.type';

const movements = ref<CashMovement[]>([]);
const loading = ref(true);
const toast = useToastStore();
const showRegisterModal = ref(false);
const showCategoriesModal = ref(false);
const showRegisterMemberPaymentModal = ref(false);

async function loadMovements() {
  loading.value = true;

  try {
    movements.value = await getCashMovements();
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'Error al cargar los movimientos de caja',
    );
  } finally {
    loading.value = false;
  }
}

onMounted(loadMovements);
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

    <section
      class="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div class="border-b border-slate-100 px-5 py-4">
        <h2 class="font-semibold text-slate-900">Movimientos</h2>

        <p class="mt-0.5 text-xs text-slate-400">
          Historial de ingresos y egresos registrados
        </p>
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

      <div v-else class="overflow-x-auto">
        <table class="w-full text-center">
          <thead class="bg-slate-50">
            <tr
              class="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              <th class="px-5 py-3">Fecha</th>

              <th class="px-5 py-3">Concepto</th>

              <th class="px-5 py-3">Categoría</th>

              <th class="px-5 py-3">Tipo</th>

              <th class="px-5 py-3 text-right">Importe</th>
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
                class="whitespace-nowrap px-5 py-3.5 text-right text-sm font-semibold"
                :class="
                  movement.tipo === 'INGRESO'
                    ? 'text-emerald-700'
                    : 'text-red-600'
                "
              >
                {{ movement.tipo === 'INGRESO' ? '+' : '-' }}
                ${{ Number(movement.importe).toLocaleString('es-UY') }}
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
        loadMovements();
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
        loadMovements();
      "
    />
  </div>
</template>
