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

import { useToastStore } from '@/stores/toast';

import type {
  FeeConfiguration,
  FeeConfigurationHistory,
  FeesDashboardSummary,
  RecentFeePayment,
} from '@/types/fee.type';

import { formatDate, formatDateTime, formatMoney } from '@/utils/format';

const configuration = ref<FeeConfiguration | null>(null);
const summary = ref<FeesDashboardSummary | null>(null);
const recentPayments = ref<RecentFeePayment[]>([]);
const configurationHistory = ref<FeeConfigurationHistory[]>([]);

const showConfigurationModal = ref(false);
const savingConfiguration = ref(false);
const newFeeAmount = ref<number>(0);
const loading = ref(false);

const editingConfiguration = ref<FeeConfigurationHistory | null>(null);
const editFeeAmount = ref<number>(0);
const savingEdit = ref(false);

const toast = useToastStore();

const totalSocios = computed(() => {
  if (!summary.value) return 0;

  return (
    summary.value.sociosAlDia +
    summary.value.sociosPendientes +
    summary.value.sociosDeudores
  );
});

const nextEffectiveDate = computed(() => {
  const currentYear = new Date().getFullYear();

  return `${currentYear + 1}-01-01`;
});

const currentConfigurationId = computed(() => {
  const now = new Date();

  const current = configurationHistory.value
    .filter((item) => new Date(item.vigenciaDesde) <= now)
    .sort(
      (a, b) =>
        new Date(b.vigenciaDesde).getTime() -
        new Date(a.vigenciaDesde).getTime(),
    )[0];

  return current?.id ?? null;
});

function getConfigurationStatus(item: FeeConfigurationHistory) {
  if (new Date(item.vigenciaDesde) > new Date()) {
    return 'FUTURO';
  }

  if (item.id === currentConfigurationId.value) {
    return 'ACTUAL';
  }

  return 'ANTERIOR';
}

function openConfigurationModal() {
  if (!configuration.value) return;

  newFeeAmount.value = configuration.value.importeBase;
  showConfigurationModal.value = true;
}

function closeConfigurationModal() {
  showConfigurationModal.value = false;
}

async function saveConfiguration() {
  if (newFeeAmount.value <= 0) {
    toast.error('El importe debe ser válido.');
    return;
  }

  try {
    savingConfiguration.value = true;

    await feesService.createConfiguration({
      importeBase: newFeeAmount.value,
      vigenciaDesde: nextEffectiveDate.value,
    });

    showConfigurationModal.value = false;

    setTimeout(() => {
      toast.success('Se guardó la nueva configuración de cuota.');
    }, 300);

    await loadData();
  } catch (err) {
    console.error(err);
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudo guardar la nueva configuración de cuota.',
    );
  } finally {
    savingConfiguration.value = false;
  }
}

function openEditConfiguration(item: FeeConfigurationHistory) {
  editingConfiguration.value = item;
  editFeeAmount.value = item.importeBase;
}

function closeEditConfiguration() {
  editingConfiguration.value = null;
}

async function saveConfigurationEdit() {
  if (!editingConfiguration.value) return;

  if (editFeeAmount.value <= 0) {
    toast.error('El importe debe ser válido.');
    return;
  }

  try {
    savingEdit.value = true;

    await feesService.updateConfiguration(
      editingConfiguration.value.id,
      editFeeAmount.value,
    );

    editingConfiguration.value = null;

    await loadData();
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudo modificar la configuración',
    );
  } finally {
    savingEdit.value = false;
  }
}

async function loadData() {
  try {
    loading.value = true;

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
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudo cargar la información de cuotas y pagos.',
    );
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
          @click="openConfigurationModal()"
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

                  <th class="px-5 py-3 text-right">Acciones</th>
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
                      v-if="getConfigurationStatus(item) === 'FUTURO'"
                      class="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                    >
                      Futuro
                    </span>

                    <span
                      v-else-if="getConfigurationStatus(item) === 'ACTUAL'"
                      class="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                    >
                      Actual
                    </span>

                    <span v-else class="text-xs text-slate-400">
                      Anterior
                    </span>
                  </td>

                  <td class="px-5 py-3.5 text-right">
                    <button
                      v-if="getConfigurationStatus(item) === 'FUTURO'"
                      type="button"
                      class="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-ccisj-light hover:text-ccisj"
                      title="Editar valor"
                      @click="openEditConfiguration(item)"
                    >
                      <Pencil class="h-4 w-4" />
                    </button>

                    <span v-else class="text-xs text-slate-300"> — </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </template>
    <div
      v-if="showConfigurationModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 class="text-lg font-semibold text-slate-900">
          Modificar valor de cuota
        </h2>

        <p class="mt-1 text-sm text-slate-500">
          El nuevo importe se aplicará a partir de la fecha indicada.
        </p>

        <div class="mt-5 space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-slate-700">
              Nuevo importe
            </label>

            <input
              v-model.number="newFeeAmount"
              type="number"
              min="1"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-ccisj"
            />
          </div>

          <div>
            <p class="mb-1.5 text-sm font-medium text-slate-700">
              Vigente desde
            </p>

            <div
              class="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"
            >
              {{ formatDate(nextEffectiveDate) }}
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            :disabled="savingConfiguration"
            @click="closeConfigurationModal"
          >
            Cancelar
          </button>

          <button
            type="button"
            class="rounded-lg bg-ccisj px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            :disabled="savingConfiguration"
            @click="saveConfiguration"
          >
            {{ savingConfiguration ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="editingConfiguration"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 class="text-lg font-semibold text-slate-900">
          Editar valor de cuota
        </h2>

        <p class="mt-1 text-sm text-slate-500">
          Vigencia:
          {{ formatDate(editingConfiguration.vigenciaDesde) }}
        </p>

        <div class="mt-5">
          <label class="mb-1.5 block text-sm font-medium text-slate-700">
            Importe
          </label>

          <input
            v-model.number="editFeeAmount"
            type="number"
            min="1"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-ccisj"
          />
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            :disabled="savingEdit"
            @click="closeEditConfiguration"
          >
            Cancelar
          </button>

          <button
            type="button"
            class="rounded-lg bg-ccisj px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            :disabled="savingEdit"
            @click="saveConfigurationEdit"
          >
            {{ savingEdit ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
