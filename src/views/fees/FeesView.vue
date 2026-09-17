<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import {
  Banknote,
  CircleCheck,
  Clock3,
  Pencil,
  ReceiptText,
  TriangleAlert,
  Users,
} from 'lucide-vue-next';

import { feesService } from '@/services/feesService';

import type {
  FeeConfiguration,
  FeeConfigurationHistory,
  FeesDashboardSummary,
  RecentFeePayment,
} from '@/types/fee.type';

const configuration = ref<FeeConfiguration | null>(null);
const summary = ref<FeesDashboardSummary | null>(null);
const recentPayments = ref<RecentFeePayment[]>([]);
const configurationHistory = ref<FeeConfigurationHistory[]>([]);

const loading = ref(true);
const error = ref('');

const totalSocios = computed(() => {
  if (!summary.value) return 0;

  return (
    summary.value.sociosAlDia +
    summary.value.sociosPendientes +
    summary.value.sociosDeudores
  );
});

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'UYU',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

async function loadData() {
  try {
    loading.value = true;
    error.value = '';

    const [configurationData, summaryData, paymentsData, historyData] =
      await Promise.all([
        feesService.getConfiguration(),
        feesService.getDashboardSummary(),
        feesService.getRecentPayments(),
        feesService.getConfigurationHistory(),
      ]);

    configuration.value = configurationData;
    summary.value = summaryData;
    recentPayments.value = paymentsData;
    configurationHistory.value = historyData;
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : 'No se pudo cargar la información de cuotas';
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="space-y-5">
    <!-- Encabezado -->
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Cuotas y pagos</h1>

      <p class="mt-1 text-sm text-slate-500">
        Gestión general de cuotas y seguimiento de pagos de socios.
      </p>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"
    >
      Cargando información de cuotas...
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
    >
      <p class="text-sm text-red-600">
        {{ error }}
      </p>

      <button
        type="button"
        class="mt-3 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        @click="loadData"
      >
        Reintentar
      </button>
    </div>

    <template v-else-if="configuration && summary">
      <!-- Configuración de cuota -->
      <section
        class="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div class="flex items-center gap-4">
          <div
            class="flex h-11 w-11 items-center justify-center rounded-xl bg-ccisj-light text-ccisj"
          >
            <ReceiptText class="h-5 w-5" />
          </div>

          <div>
            <p class="text-sm font-medium text-slate-500">
              Valor general de la cuota
            </p>

            <div class="mt-0.5 flex flex-wrap items-baseline gap-2">
              <p class="text-2xl font-bold text-slate-900">
                {{ formatMoney(configuration.importeBase) }}
              </p>

              <span class="text-xs text-slate-400">
                vigente desde {{ formatDate(configuration.vigenciaDesde) }}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-slate-600 transition hover:border-ccisj hover:bg-ccisj-light hover:text-ccisj"
        >
          <Pencil class="h-4 w-4" />
          Modificar valor
        </button>
      </section>

      <!-- Resumen financiero -->
      <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-slate-500">Cobrado este mes</p>

              <p class="mt-2 text-2xl font-bold text-slate-900">
                {{ formatMoney(summary.cobradoMes) }}
              </p>
            </div>

            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"
            >
              <Banknote class="h-5 w-5" />
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-slate-500">Pendiente</p>

              <p class="mt-2 text-2xl font-bold text-slate-900">
                {{ formatMoney(summary.pendiente) }}
              </p>
            </div>

            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-700"
            >
              <Clock3 class="h-5 w-5" />
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-5">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm text-slate-500">Deuda total</p>

              <p class="mt-2 text-2xl font-bold text-slate-900">
                {{ formatMoney(summary.deudaTotal) }}
              </p>
            </div>

            <div
              class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600"
            >
              <TriangleAlert class="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <!-- Estado de socios -->
      <section class="rounded-xl border border-slate-200 bg-white p-5">
        <div class="mb-5 flex items-center gap-2">
          <Users class="h-5 w-5 text-slate-400" />

          <h2 class="font-semibold text-slate-900">Estado de socios</h2>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-lg bg-slate-50 p-4">
            <p
              class="text-xs font-medium uppercase tracking-wide text-slate-400"
            >
              Total
            </p>

            <p class="mt-1 text-xl font-bold text-slate-800">
              {{ totalSocios }}
            </p>
          </div>

          <div class="rounded-lg bg-emerald-50 p-4">
            <div class="flex items-center justify-between">
              <div>
                <p
                  class="text-xs font-medium uppercase tracking-wide text-emerald-600"
                >
                  Al día
                </p>

                <p class="mt-1 text-xl font-bold text-emerald-700">
                  {{ summary.sociosAlDia }}
                </p>
              </div>

              <CircleCheck class="h-5 w-5 text-emerald-600" />
            </div>
          </div>

          <div class="rounded-lg bg-amber-50 p-4">
            <div class="flex items-center justify-between">
              <div>
                <p
                  class="text-xs font-medium uppercase tracking-wide text-amber-600"
                >
                  Pendientes
                </p>

                <p class="mt-1 text-xl font-bold text-amber-700">
                  {{ summary.sociosPendientes }}
                </p>
              </div>

              <Clock3 class="h-5 w-5 text-amber-600" />
            </div>
          </div>

          <div class="rounded-lg bg-red-50 p-4">
            <div class="flex items-center justify-between">
              <div>
                <p
                  class="text-xs font-medium uppercase tracking-wide text-red-500"
                >
                  Deudores
                </p>

                <p class="mt-1 text-xl font-bold text-red-600">
                  {{ summary.sociosDeudores }}
                </p>
              </div>

              <TriangleAlert class="h-5 w-5 text-red-500" />
            </div>
          </div>
        </div>
      </section>

      <div class="grid gap-5 xl:grid-cols-2">
        <!-- Últimos pagos -->
        <section
          class="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div class="border-b border-slate-100 px-5 py-4">
            <h2 class="font-semibold text-slate-900">Últimos pagos</h2>

            <p class="mt-0.5 text-xs text-slate-400">
              Pagos registrados recientemente
            </p>
          </div>

          <div
            v-if="recentPayments.length === 0"
            class="p-8 text-center text-sm text-slate-400"
          >
            No hay pagos registrados.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-slate-50">
                <tr
                  class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  <th class="px-5 py-3">Socio</th>

                  <th class="px-5 py-3">Importe</th>

                  <th class="px-5 py-3">Fecha</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="payment in recentPayments"
                  :key="payment.id"
                  class="border-t border-slate-100"
                >
                  <td class="px-5 py-3.5">
                    <p class="text-sm font-medium text-slate-800">
                      {{ payment.razonSocial }}
                    </p>
                  </td>

                  <td
                    class="whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-slate-700"
                  >
                    {{ formatMoney(payment.importe) }}
                  </td>

                  <td
                    class="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500"
                  >
                    {{ formatDateTime(payment.fechaPago) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Historial valor cuota -->
        <section
          class="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div class="border-b border-slate-100 px-5 py-4">
            <h2 class="font-semibold text-slate-900">
              Historial del valor de cuota
            </h2>

            <p class="mt-0.5 text-xs text-slate-400">
              Cambios realizados al importe general
            </p>
          </div>

          <div
            v-if="configurationHistory.length === 0"
            class="p-8 text-center text-sm text-slate-400"
          >
            No hay cambios registrados.
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-slate-50">
                <tr
                  class="text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  <th class="px-5 py-3">Importe</th>

                  <th class="px-5 py-3">Vigente desde</th>

                  <th class="px-5 py-3">Estado</th>
                </tr>
              </thead>

              <tbody>
                <tr
                  v-for="(item, index) in configurationHistory"
                  :key="item.id"
                  class="border-t border-slate-100"
                >
                  <td class="px-5 py-3.5 text-sm font-semibold text-slate-800">
                    {{ formatMoney(item.importeBase) }}
                  </td>

                  <td class="px-5 py-3.5 text-sm text-slate-500">
                    {{ formatDate(item.vigenciaDesde) }}
                  </td>

                  <td class="px-5 py-3.5">
                    <span
                      v-if="index === 0"
                      class="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                    >
                      Actual
                    </span>

                    <span v-else class="text-xs text-slate-400">
                      Anterior
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
