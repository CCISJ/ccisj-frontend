<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { useReceiptViewer } from '@/composables/useReceiptViewer';
import {
  Eye,
  Paperclip,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
  UserRoundCheck,
  X,
} from 'lucide-vue-next';

import CashCategoriesModal from '@/components/cash/CashCategoriesModal.vue';
import RegisterCashMovementModal from '@/components/cash/RegisterCashMovementModal.vue';
import RegisterMemberPaymentModal from '@/components/cash/RegisterMemberPaymentModal.vue';

import {
  cancelCashMovement,
  getCashCategories,
  getCashMovements,
  getSummary,
  uploadCashMovementReceipt,
} from '@/services/cashService';

import { useToastStore } from '@/stores/toast';

import type {
  CashCategory,
  CashMovement,
  CashMovementFilters,
  CashSummary,
} from '@/types/cash.type';

import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';

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
const { viewReceipt } = useReceiptViewer();

const loading = ref(true);
const showRegisterModal = ref(false);
const showCategoriesModal = ref(false);
const showRegisterMemberPaymentModal = ref(false);
const movementToCancel = ref<CashMovement | null>(null);
const cancellationReason = ref('');
const cancelling = ref(false);

const uploadingReceiptId = ref<number | null>(null);
const receiptInput = ref<HTMLInputElement | null>(null);
const selectedMovementId = ref<number | null>(null);

function selectReceipt(movementId: number) {
  selectedMovementId.value = movementId;
  receiptInput.value?.click();
}

async function handleReceiptSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  const movementId = selectedMovementId.value;

  if (!file || movementId === null) return;

  if (
    !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) ||
    file.size > 5 * 1024 * 1024
  ) {
    toast.error('Seleccioná un PDF, JPG o PNG de hasta 5 MB');
    input.value = '';
    return;
  }

  uploadingReceiptId.value = movementId;

  try {
    await uploadCashMovementReceipt(movementId, file);
    toast.success('Comprobante guardado correctamente');
    await loadCash();
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'Error al subir el comprobante',
    );
  } finally {
    uploadingReceiptId.value = null;
    selectedMovementId.value = null;
    input.value = '';
  }
}

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
}

/*
 * Los filtros se aplican solos al cambiar (el texto, con una pausa para no
 * consultar por cada letra). Fechas y categoría quedan plegadas en "Más
 * filtros": casi siempre se busca por concepto o se mira el mes.
 */
const showMoreFilters = ref(false);

const hasFilters = computed(() =>
  Object.values(filters.value).some(
    (value) => value !== undefined && value !== '',
  ),
);

const extraFilterCount = computed(
  () =>
    [
      filters.value.desde,
      filters.value.hasta,
      filters.value.categoriaId,
    ].filter((value) => value !== undefined && value !== '').length,
);

let debounce: ReturnType<typeof setTimeout> | undefined;

watch(
  filters,
  () => {
    clearTimeout(debounce);
    debounce = setTimeout(loadCash, 300);
  },
  { deep: true },
);

// La lista muestra los más recientes y el resto a pedido.
const PAGE = 15;
const visibleCount = ref(PAGE);

const visibleMovements = computed(() =>
  movements.value.slice(0, visibleCount.value),
);

watch(movements, () => {
  visibleCount.value = PAGE;
});

function money(value: number | string) {
  return formatMoney(Number(value));
}

onMounted(loadCash);
</script>

<template>
  <div class="space-y-6">
    <input
      id="cash-receipt-file"
      ref="receiptInput"
      type="file"
      accept=".pdf,.jpg,.jpeg,.png"
      aria-label="Seleccionar comprobante del movimiento"
      class="hidden"
      @change="handleReceiptSelected"
    />
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Caja</h1>

        <p class="mt-1 text-base text-slate-600">
          Ingresos y egresos de la institución.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold text-slate-700 transition hover:bg-white hover:text-ccisj"
          @click="showCategoriesModal = true"
        >
          <Settings2 class="h-4 w-4" />
          Categorías
        </button>

        <button
          type="button"
          class="flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-800 transition hover:border-ccisj hover:text-ccisj"
          @click="showRegisterMemberPaymentModal = true"
        >
          <UserRoundCheck class="h-4 w-4" />
          Registrar pago de socio
        </button>

        <button
          type="button"
          class="flex min-h-11 items-center gap-2 rounded-xl bg-ccisj px-4 font-semibold max-sm:order-first text-white transition hover:bg-ccisj-dark"
          @click="showRegisterModal = true"
        >
          <Plus class="h-4 w-4" />
          Registrar movimiento
        </button>
      </div>
    </header>

    <!-- El mes en una franja: lo mismo que el Inicio, sin cuatro tarjetas -->
    <section
      class="grid grid-cols-2 divide-slate-100 rounded-xl border border-slate-200 bg-white lg:grid-cols-4 lg:divide-x"
      aria-label="Resumen del mes"
    >
      <div class="p-5">
        <p class="text-base text-slate-600">Ingresos del mes</p>
        <p class="mt-1 text-2xl font-bold text-slate-900">
          {{ money(summary?.ingresos ?? 0) }}
        </p>
      </div>

      <div class="p-5">
        <p class="text-base text-slate-600">Egresos del mes</p>
        <p class="mt-1 text-2xl font-bold text-slate-900">
          {{ money(summary?.egresos ?? 0) }}
        </p>
      </div>

      <div class="p-5">
        <p class="text-base text-slate-600">Balance del mes</p>
        <p
          class="mt-1 text-2xl font-bold"
          :class="(summary?.balance ?? 0) >= 0 ? 'text-ccisj' : 'text-red-700'"
        >
          {{ money(summary?.balance ?? 0) }}
        </p>
      </div>

      <div class="p-5">
        <p class="text-base text-slate-600">Movimientos del mes</p>
        <p class="mt-1 text-2xl font-bold text-slate-900">
          {{ summary?.cantidadMovimientos ?? 0 }}
        </p>
      </div>
    </section>

    <section
      class="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div class="space-y-3 border-b border-slate-100 p-5">
        <div class="flex flex-wrap items-center gap-3">
          <h2 class="mr-auto text-lg font-semibold text-slate-900">
            Movimientos
          </h2>

          <div class="relative min-w-60 flex-1 sm:flex-none">
            <label for="cash-concepto" class="sr-only"
              >Buscar por concepto</label
            >
            <Search
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600"
            />
            <input
              id="cash-concepto"
              v-model="filters.buscar"
              type="search"
              placeholder="Buscar por concepto"
              class="min-h-11 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-base text-slate-900 outline-none transition focus:border-ccisj"
            />
          </div>

          <label for="cash-tipo" class="sr-only">Tipo</label>
          <select
            id="cash-tipo"
            v-model="filters.tipo"
            class="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-ccisj"
          >
            <option :value="undefined">Ingresos y egresos</option>
            <option value="INGRESO">Solo ingresos</option>
            <option value="EGRESO">Solo egresos</option>
          </select>

          <button
            type="button"
            class="flex min-h-11 items-center gap-2 rounded-lg border px-3 font-semibold transition"
            :class="
              showMoreFilters || extraFilterCount > 0
                ? 'border-ccisj bg-ccisj-light text-ccisj-dark'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
            "
            :aria-expanded="showMoreFilters"
            aria-controls="cash-mas-filtros"
            @click="showMoreFilters = !showMoreFilters"
          >
            <SlidersHorizontal class="h-4 w-4" />
            Más filtros
            <span v-if="extraFilterCount > 0">({{ extraFilterCount }})</span>
          </button>

          <button
            v-if="hasFilters"
            type="button"
            class="flex min-h-11 items-center gap-1.5 rounded-lg px-3 font-semibold text-slate-700 transition hover:bg-slate-100"
            @click="clearFilters"
          >
            <X class="h-4 w-4" />
            Limpiar
          </button>
        </div>

        <div
          v-show="showMoreFilters"
          id="cash-mas-filtros"
          class="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-3"
        >
          <div>
            <label
              for="cash-desde"
              class="mb-1 block text-sm font-medium text-slate-700"
            >
              Desde
            </label>

            <input
              id="cash-desde"
              v-model="filters.desde"
              type="date"
              class="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-ccisj"
            />
          </div>

          <div>
            <label
              for="cash-hasta"
              class="mb-1 block text-sm font-medium text-slate-700"
            >
              Hasta
            </label>

            <input
              id="cash-hasta"
              v-model="filters.hasta"
              type="date"
              class="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-ccisj"
            />
          </div>

          <div>
            <label
              for="cash-categoria"
              class="mb-1 block text-sm font-medium text-slate-700"
            >
              Categoría
            </label>

            <select
              id="cash-categoria"
              v-model="filters.categoriaId"
              class="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-ccisj"
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
        </div>
      </div>

      <div
        v-if="loading && movements.length === 0"
        class="p-10 text-center text-base text-slate-600"
      >
        Cargando movimientos...
      </div>

      <div
        v-else-if="movements.length === 0"
        class="p-10 text-center text-base text-slate-600"
      >
        {{
          hasFilters
            ? 'Ningún movimiento coincide con la búsqueda.'
            : 'No hay movimientos registrados.'
        }}
      </div>

      <div v-else class="relative overflow-x-auto">
        <table class="w-full min-w-200 text-left">
          <thead class="bg-slate-50">
            <tr class="text-sm font-semibold text-slate-600">
              <th class="px-5 py-3">Fecha</th>

              <th class="px-5 py-3">Concepto</th>

              <th class="px-5 py-3">Categoría</th>

              <th class="px-5 py-3 text-right">Importe</th>

              <th class="px-5 py-3 text-right">
                <span class="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="movement in visibleMovements"
              :key="movement.id"
              class="border-t border-slate-100"
            >
              <td
                class="whitespace-nowrap px-5 py-3.5 text-base text-slate-600"
              >
                {{ formatDate(movement.fecha) }}
              </td>

              <td class="px-5 py-3.5">
                <p class="text-base font-medium text-slate-800">
                  {{ movement.concepto }}
                </p>

                <p
                  v-if="movement.observaciones"
                  class="mt-0.5 max-w-xs truncate text-sm text-slate-600"
                >
                  {{ movement.observaciones }}
                </p>
              </td>

              <td class="px-5 py-3.5">
                <span class="text-base text-slate-600">
                  {{ movement.categoria.nombre }}
                </span>
              </td>

              <td
                class="whitespace-nowrap px-5 py-3.5 text-right text-base font-semibold"
                :class="
                  movement.anulado
                    ? 'text-slate-600 line-through'
                    : movement.tipo === 'INGRESO'
                      ? 'text-ccisj'
                      : 'text-red-700'
                "
              >
                <span class="sr-only">
                  {{ movement.tipo === 'INGRESO' ? 'Ingreso' : 'Egreso' }}:
                </span>
                {{ movement.tipo === 'INGRESO' ? '+' : '−' }}
                {{ money(movement.importe) }}
              </td>

              <td class="whitespace-nowrap px-5 py-3.5">
                <div class="flex flex-wrap items-center justify-end gap-2">
                  <span
                    v-if="movement.anulado"
                    class="rounded-md bg-slate-100 px-2.5 py-1.5 text-sm font-medium text-slate-600"
                  >
                    Anulado
                  </span>

                  <button
                    v-else-if="!movement.pagoCuota"
                    type="button"
                    class="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
                    @click="movementToCancel = movement"
                  >
                    Anular
                  </button>

                  <button
                    v-if="movement.comprobanteUrl"
                    type="button"
                    class="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-ccisj hover:bg-ccisj-light hover:text-ccisj"
                    @click="viewReceipt(movement.id)"
                  >
                    <Eye class="h-3.5 w-3.5" />
                    Ver
                  </button>

                  <button
                    v-if="!movement.anulado"
                    type="button"
                    :disabled="uploadingReceiptId === movement.id"
                    class="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-ccisj hover:bg-ccisj-light hover:text-ccisj disabled:opacity-50"
                    @click="selectReceipt(movement.id)"
                  >
                    <Paperclip class="h-3.5 w-3.5" />
                    {{
                      uploadingReceiptId === movement.id
                        ? 'Subiendo...'
                        : movement.comprobanteUrl
                          ? 'Reemplazar'
                          : 'Adjuntar'
                    }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        v-if="movements.length > visibleCount"
        type="button"
        class="w-full border-t border-slate-100 px-5 py-3 text-base font-semibold text-ccisj transition hover:bg-slate-50"
        @click="visibleCount += PAGE"
      >
        Ver más movimientos ({{ movements.length - visibleCount }} más)
      </button>
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

        <p class="mt-2 text-base text-slate-600">
          El movimiento permanecerá en el historial, pero dejará de
          contabilizarse en Caja.
        </p>

        <div class="mt-4 rounded-lg bg-slate-50 p-3">
          <p class="text-base font-medium text-slate-800">
            {{ movementToCancel.concepto }}
          </p>

          <p class="mt-1 text-base text-slate-600">
            ${{ Number(movementToCancel.importe).toLocaleString('es-UY') }}
          </p>
        </div>

        <div class="mt-4">
          <label
            for="cash-motivo-de-anulacion"
            class="mb-1 block text-base font-medium text-slate-700"
          >
            Motivo de anulación
          </label>

          <textarea
            id="cash-motivo-de-anulacion"
            v-model="cancellationReason"
            rows="3"
            maxlength="500"
            placeholder="Ej: Importe registrado incorrectamente"
            class="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-700 outline-none transition focus:border-ccisj"
          />
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-lg border border-slate-200 px-3.5 py-2 text-base font-medium text-slate-600 transition hover:bg-slate-50"
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
            class="rounded-lg bg-red-600 px-3.5 py-2 text-base font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
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
