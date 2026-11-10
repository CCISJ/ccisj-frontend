<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { Pencil, Plus } from 'lucide-vue-next';

import { feesService } from '@/services/feesService';

import { useToastStore } from '@/stores/toast';

import type {
  FeeConfiguration,
  FeeConfigurationHistory,
  FeesDashboardSummary,
  RecentFeePayment,
} from '@/types/fee.type';

import { formatDate, getCurrentMonth, uruguayDay } from '@/utils/date';
import { formatMoney } from '@/utils/money';

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

const showGenerateModal = ref(false);
const generatingFees = ref(false);
const selectedMonth = ref(getCurrentMonth());

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
  const currentYear = Number(uruguayDay().slice(0, 4));

  return `${currentYear + 1}-01-01`;
});

// La vigencia es un día sin hora: llega como medianoche UTC
// (`2027-01-01T00:00:00.000Z`). Comparada como instante con `new Date()`, la
// del año nuevo pasaba a "Actual" el 31/12 a las 21 de Uruguay. Se comparan
// días en texto `AAAA-MM-DD`, igual que hace el backend con el día de acá.
function effectiveDay(item: FeeConfigurationHistory) {
  return item.vigenciaDesde.slice(0, 10);
}

const currentConfigurationId = computed(() => {
  const today = uruguayDay();

  const current = configurationHistory.value
    .filter((item) => effectiveDay(item) <= today)
    .sort((a, b) => effectiveDay(b).localeCompare(effectiveDay(a)))[0];

  return current?.id ?? null;
});

function getConfigurationStatus(item: FeeConfigurationHistory) {
  if (effectiveDay(item) > uruguayDay()) {
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

async function handleGenerateFees() {
  if (generatingFees.value) return;

  const [yearString, monthString] = selectedMonth.value.split('-');
  const year = Number(yearString);
  const month = Number(monthString);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    year < 1 ||
    month < 1 ||
    month > 12
  ) {
    toast.error('Seleccioná un mes válido.');
    return;
  }

  try {
    generatingFees.value = true;

    const result = await feesService.generateMonthlyFees(year, month);

    showGenerateModal.value = false;

    toast.success(
      `Cuotas generadas: ${result.generated}. Omitidas: ${result.skipped}.`,
    );

    await loadData();
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'No se pudieron generar las cuotas.',
    );
  } finally {
    generatingFees.value = false;
  }
}

onMounted(loadData);
</script>

<template>
  <div class="space-y-5">
    <!-- Encabezado: el valor de la cuota y la acción del mes -->
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Cuotas y pagos</h1>

        <p class="mt-1 text-base text-slate-600">
          <template v-if="configuration">
            La cuota vale
            <strong class="text-slate-900">{{
              formatMoney(configuration.importeBase)
            }}</strong>
            desde el {{ formatDate(configuration.vigenciaDesde) }}.
          </template>
          <template v-else>Las cuotas de los socios y sus pagos.</template>
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          v-if="configuration"
          type="button"
          class="flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-800 transition hover:border-ccisj hover:text-ccisj"
          @click="openConfigurationModal()"
        >
          <Pencil class="h-4 w-4" />
          Cambiar el valor
        </button>

        <button
          type="button"
          class="flex min-h-11 items-center gap-2 rounded-xl bg-ccisj px-4 font-semibold max-sm:order-first text-white transition hover:bg-ccisj-dark"
          @click="showGenerateModal = true"
        >
          <Plus class="h-4 w-4" />
          Generar cuotas
        </button>
      </div>
    </header>

    <!-- Loading -->
    <div
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-base text-slate-600"
    >
      Cargando información de cuotas...
    </div>

    <template v-else-if="configuration && summary">
      <!--
        Una franja con lo que importa. "Por cobrar" es todo lo que falta
        pagar, venza cuando venza; "Vencido" es la parte que ya pasó su fecha:
        antes se llamaban "Pendiente" y "Deuda total" y no se entendía la
        diferencia.
      -->
      <section
        class="grid divide-slate-100 rounded-xl border border-slate-200 bg-white sm:grid-cols-3 sm:divide-x"
        aria-label="Resumen de cuotas"
      >
        <div class="p-5">
          <p class="text-base text-slate-600">Cobrado este mes</p>
          <p class="mt-1 text-2xl font-bold text-slate-900">
            {{ formatMoney(summary.cobradoMes) }}
          </p>
        </div>

        <div class="p-5">
          <p class="text-base text-slate-600">Por cobrar</p>
          <p class="mt-1 text-2xl font-bold text-slate-900">
            {{ formatMoney(summary.pendiente) }}
          </p>
          <p class="text-sm text-slate-600">Todo lo que falta pagar</p>
        </div>

        <div class="p-5">
          <p class="text-base text-slate-600">Vencido</p>
          <p
            class="mt-1 text-2xl font-bold"
            :class="summary.deudaTotal > 0 ? 'text-red-700' : 'text-slate-900'"
          >
            {{ formatMoney(summary.deudaTotal) }}
          </p>
          <p class="text-sm text-slate-600">Ya pasó su fecha</p>
        </div>
      </section>

      <!-- Cómo están los socios: la misma barra que el Inicio -->
      <section
        v-if="totalSocios > 0"
        class="rounded-xl border border-slate-200 bg-white p-5"
      >
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-lg font-semibold text-slate-900">
            {{ totalSocios }} socios activos
          </h2>

          <RouterLink
            :to="{ name: 'socios' }"
            class="font-semibold text-ccisj hover:underline"
          >
            Ver quiénes deben
          </RouterLink>
        </div>

        <div
          role="img"
          :aria-label="`De ${totalSocios} socios activos, ${summary.sociosAlDia} al día, ${summary.sociosPendientes} con 1 o 2 cuotas vencidas y ${summary.sociosDeudores} con 3 o más`"
          class="mt-3 flex h-3 overflow-hidden rounded-full bg-slate-100"
        >
          <span
            class="bg-ccisj-brand"
            :style="{ flexGrow: summary.sociosAlDia }"
          />
          <span
            class="bg-amber-500"
            :style="{ flexGrow: summary.sociosPendientes }"
          />
          <span
            class="bg-red-700"
            :style="{ flexGrow: summary.sociosDeudores }"
          />
        </div>

        <p class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-base text-slate-600">
          <span>
            <strong class="text-slate-900">{{ summary.sociosAlDia }}</strong>
            al día
          </span>
          <span>
            <strong class="text-slate-900">{{
              summary.sociosPendientes
            }}</strong>
            con 1 o 2 cuotas vencidas
          </span>
          <span>
            <strong class="text-red-700">{{ summary.sociosDeudores }}</strong>
            con 3 o más
          </span>
        </p>
      </section>

      <div class="grid gap-5 xl:grid-cols-2">
        <!-- Últimos pagos -->
        <section
          class="overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div class="border-b border-slate-100 px-5 py-4">
            <h2 class="font-semibold text-slate-900">Últimos pagos</h2>

            <p class="mt-0.5 text-sm text-slate-600">
              Pagos registrados recientemente
            </p>
          </div>

          <div
            v-if="recentPayments.length === 0"
            class="p-8 text-center text-base text-slate-600"
          >
            No hay pagos registrados.
          </div>

          <div v-else class="relative overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-slate-50">
                <tr class="text-sm font-semibold text-slate-600">
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
                    <p class="text-base font-medium text-slate-800">
                      {{ payment.razonSocial }}
                    </p>
                  </td>

                  <td
                    class="whitespace-nowrap px-5 py-3.5 text-base font-semibold text-slate-700"
                  >
                    {{ formatMoney(payment.importe) }}
                  </td>

                  <td
                    class="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600"
                  >
                    {{ formatDate(payment.fechaPago) }}
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

            <p class="mt-0.5 text-sm text-slate-600">
              Cambios realizados al importe general
            </p>
          </div>

          <div
            v-if="configurationHistory.length === 0"
            class="p-8 text-center text-base text-slate-600"
          >
            No hay cambios registrados.
          </div>

          <div v-else class="relative overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-slate-50">
                <tr class="text-sm font-semibold text-slate-600">
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
                  <td
                    class="px-5 py-3.5 text-base font-semibold text-slate-800"
                  >
                    {{ formatMoney(item.importeBase) }}
                  </td>

                  <td class="px-5 py-3.5 text-base text-slate-600">
                    {{ formatDate(item.vigenciaDesde) }}
                  </td>

                  <td class="px-5 py-3.5">
                    <span
                      v-if="getConfigurationStatus(item) === 'FUTURO'"
                      class="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-sm font-medium text-blue-700"
                    >
                      Futuro
                    </span>

                    <span
                      v-else-if="getConfigurationStatus(item) === 'ACTUAL'"
                      class="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-medium text-emerald-700"
                    >
                      Actual
                    </span>

                    <span v-else class="text-sm text-slate-600">
                      Anterior
                    </span>
                  </td>

                  <td class="px-5 py-3.5 text-right">
                    <button
                      v-if="getConfigurationStatus(item) === 'FUTURO'"
                      type="button"
                      class="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 transition hover:bg-ccisj-light hover:text-ccisj"
                      title="Editar valor"
                      @click="openEditConfiguration(item)"
                    >
                      <Pencil class="h-4 w-4" />
                    </button>

                    <span v-else class="text-sm text-slate-300"> — </span>
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

        <p class="mt-1 text-base text-slate-600">
          El nuevo importe se aplicará a partir de la fecha indicada.
        </p>

        <div class="mt-5 space-y-4">
          <div>
            <label
              for="fees-nuevo-importe"
              class="mb-1.5 block text-base font-medium text-slate-700"
            >
              Nuevo importe
            </label>

            <input
              id="fees-nuevo-importe"
              v-model.number="newFeeAmount"
              type="number"
              min="1"
              class="w-full rounded-lg border border-slate-200 px-3 py-2 text-base outline-none focus:border-ccisj"
            />
          </div>

          <div>
            <p class="mb-1.5 text-base font-medium text-slate-700">
              Vigente desde
            </p>

            <div
              class="rounded-lg bg-slate-50 px-3 py-2 text-base text-slate-700"
            >
              {{ formatDate(nextEffectiveDate) }}
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-base font-medium text-slate-600 hover:bg-slate-50"
            :disabled="savingConfiguration"
            @click="closeConfigurationModal"
          >
            Cancelar
          </button>

          <button
            type="button"
            class="rounded-lg bg-ccisj px-4 py-2 text-base font-semibold text-white disabled:opacity-50"
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

        <p class="mt-1 text-base text-slate-600">
          Vigencia:
          {{ formatDate(editingConfiguration.vigenciaDesde) }}
        </p>

        <div class="mt-5">
          <label
            for="fees-importe"
            class="mb-1.5 block text-base font-medium text-slate-700"
          >
            Importe
          </label>

          <input
            id="fees-importe"
            v-model.number="editFeeAmount"
            type="number"
            min="1"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-base outline-none focus:border-ccisj"
          />
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-4 py-2 text-base font-medium text-slate-600 hover:bg-slate-50"
            :disabled="savingEdit"
            @click="closeEditConfiguration"
          >
            Cancelar
          </button>

          <button
            type="button"
            class="rounded-lg bg-ccisj px-4 py-2 text-base font-semibold text-white disabled:opacity-50"
            :disabled="savingEdit"
            @click="saveConfigurationEdit"
          >
            {{ savingEdit ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showGenerateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 class="text-lg font-semibold text-slate-900">
          Generar cuotas mensuales
        </h2>

        <p class="mt-1 text-base text-slate-600">
          Se generarán las cuotas de todos los socios activos para el mes
          seleccionado. Las cuotas existentes no se duplicarán.
        </p>

        <div class="mt-5">
          <label
            for="generate-month"
            class="mb-1.5 block text-base font-medium text-slate-700"
          >
            Mes a generar
          </label>

          <input
            id="generate-month"
            v-model="selectedMonth"
            type="month"
            class="w-full rounded-lg border border-slate-200 px-3 py-2 text-base outline-none focus:border-ccisj"
          />
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            :disabled="generatingFees"
            class="rounded-lg border border-slate-200 px-4 py-2 text-base font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            @click="showGenerateModal = false"
          >
            Cancelar
          </button>

          <button
            type="button"
            :disabled="generatingFees || !selectedMonth"
            class="rounded-lg bg-ccisj px-4 py-2 text-base font-semibold text-white disabled:opacity-50"
            @click="handleGenerateFees"
          >
            {{ generatingFees ? 'Generando...' : 'Confirmar generación' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
