<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useRoute, useRouter } from 'vue-router';

import {
  ArrowLeft,
  CircleCheck,
  Clock3,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from 'lucide-vue-next';

import ConfirmModal from '@/components/ConfirmModal.vue';
import FeeAdjustmentModal from '@/components/fees/FeeAdjustmentModal.vue';

import { feesService } from '@/services/feesService';
import { getMember, isFullMember } from '@/services/membersService';

import { useToastStore } from '@/stores/toast.ts';

import type {
  CreateFeeAdjustmentData,
  Fee,
  FeeAdjustment,
  MemberFeeSummary,
} from '@/types/fee.type.ts';
import type { Member, MemberDirectoryEntry } from '@/types/member.type';

import { formatDate, formatMonth } from '@/utils/date';
import { formatMoney } from '@/utils/money';

const route = useRoute();
const router = useRouter();

const feeSummary = ref<MemberFeeSummary | null>(null);
const memberFees = ref<Fee[]>([]);
const adjustmentModalOpen = ref(false);
const feeAdjustments = ref<FeeAdjustment[]>([]);
const adjustmentToDelete = ref<FeeAdjustment | null>(null);
const deletingAdjustment = ref(false);

const socio = ref<Member | MemberDirectoryEntry | null>(null);

// Un directivo recibe solo el directorio: sin RUT, BPS, observaciones ni
// estado de la cuenta.
const fullMember = computed(() =>
  socio.value && isFullMember(socio.value) ? socio.value : null,
);

const loading = ref(true);
const toast = useToastStore();

async function handleAdjustmentConfirm(data: CreateFeeAdjustmentData) {
  if (!fullMember.value) return;

  try {
    await feesService.createAdjustment(fullMember.value.id, data);

    adjustmentModalOpen.value = false;

    toast.success('Ajuste de cuota guardado correctamente');

    await loadMember();
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudo guardar el ajuste de cuota',
    );
  }
}

async function handleDeleteAdjustment() {
  if (!adjustmentToDelete.value) return;

  deletingAdjustment.value = true;

  try {
    const result = await feesService.deleteAdjustment(
      adjustmentToDelete.value.id,
    );

    adjustmentToDelete.value = null;

    if (result.cuotasPagadasNoModificadas > 0) {
      const cantidad = result.cuotasPagadasNoModificadas;

      toast.success(
        `Ajuste eliminado. ${cantidad} ${
          cantidad === 1 ? 'cuota pagada mantuvo' : 'cuotas pagadas mantuvieron'
        } el ajuste. Si necesitás compensar ese importe, creá un nuevo ajuste.`,
      );
    } else {
      toast.success('Ajuste eliminado correctamente');
    }

    await loadMember();

    await loadMember();
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'No se pudo eliminar el ajuste',
    );
  } finally {
    deletingAdjustment.value = false;
  }
}

async function loadMember() {
  const id = Number(route.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    toast.error('El identificador del socio no es válido');
    loading.value = false;
    return;
  }

  try {
    loading.value = true;

    const memberData = await getMember(id);

    socio.value = memberData;

    feeSummary.value = await feesService.getMemberFeeSummary(id);
    memberFees.value = await feesService.getMemberFees(id);
    feeAdjustments.value = await feesService.getMemberAdjustments(id);
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'No se pudo cargar el socio',
    );
  } finally {
    loading.value = false;
  }
}

onMounted(loadMember);

type Field = { label: string; value: string };

/**
 * El detalle agrupa los campos por tema en v de listar los quince seguidos:
 * quien abre la ficha busca "los datos de contacto", no el campo 9.
 */
const sections = computed(() => {
  const data = socio.value;

  if (!data) return [];

  const full = fullMember.value;

  const empresa: Field[] = [
    { label: 'Razón social', value: data.razonSocial },
    { label: 'Titular', value: data.titular },
    { label: 'Giro comercial', value: data.giroComercial },
  ];

  const afiliacion: Field[] = [
    {
      label: 'Tipo de socio',
      value: data.tipo === 'DIRECTIVO' ? 'Directivo' : 'Común',
    },
    { label: 'Fecha de afiliación', value: formatDate(data.fechaAfiliacion) },
  ];

  if (full) {
    empresa.push(
      { label: 'RUT', value: full.rut },
      { label: 'Nº BPS', value: full.numeroBps },
      {
        label: 'Inicio de actividad',
        value: formatDate(full.fechaInicioEmpresa),
      },
    );

    // El estado de la cuenta ya lo dice la etiqueta del encabezado: desde
    // que `Member.activo` se fue, el socio está activo si su usuario lo
    // está, y repetirlo acá es decir lo mismo dos veces.
    afiliacion.push({ label: 'Email de la cuenta', value: full.usuario.email });
  }

  return [
    {
      title: 'Datos de la empresa',
      fields: empresa,
    },
    {
      title: 'Contacto',
      fields: [
        { label: 'Teléfono', value: data.telefono },
        { label: 'Celular', value: data.celular },
        { label: 'Email', value: data.email },
        { label: 'Dirección', value: data.direccion },
        { label: 'Ciudad', value: data.ciudad },
      ],
    },
    {
      title: 'Afiliación',
      fields: afiliacion,
    },
  ];
});

function feeStatusLabel() {
  if (!feeSummary.value) return 'Sin información';

  if (feeSummary.value.estado === 'AL_DIA') return 'Al día';
  if (feeSummary.value.estado === 'PENDIENTE') return 'Pendiente';

  return 'Deudor';
}

function feeStatusClass() {
  if (!feeSummary.value) {
    return 'bg-slate-100 text-slate-600';
  }

  if (feeSummary.value.estado === 'AL_DIA') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (feeSummary.value.estado === 'PENDIENTE') {
    return 'bg-amber-50 text-amber-700';
  }

  return 'bg-red-50 text-red-600';
}

function individualFeeStatusLabel(status: Fee['estado']) {
  if (status === 'PAGADA') return 'Pagada';
  if (status === 'ANULADA') return 'Anulada';

  return 'Pendiente';
}

function individualFeeStatusClass(status: Fee['estado']) {
  if (status === 'PAGADA') {
    return 'bg-emerald-50 text-emerald-700';
  }

  if (status === 'ANULADA') {
    return 'bg-slate-100 text-slate-500';
  }

  return 'bg-amber-50 text-amber-700';
}

function goBack() {
  router.push({ name: 'socios' });
}
</script>

<template>
  <div class="space-y-5">
    <button
      type="button"
      class="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-ccisj"
      @click="goBack"
    >
      <ArrowLeft class="h-4 w-4" />
      Volver a socios
    </button>

    <!-- Loading -->
    <div
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"
    >
      Cargando socio...
    </div>

    <template v-if="socio">
      <!-- Encabezado -->
      <div
        class="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ccisj-light text-sm font-bold text-ccisj"
        >
          {{ socio.razonSocial.slice(0, 2).toUpperCase() }}
        </div>

        <div class="min-w-0 flex-1">
          <h1 class="truncate text-2xl font-bold text-slate-900">
            {{ socio.razonSocial }}
          </h1>

          <p class="mt-0.5 truncate text-sm text-slate-500">
            {{ socio.giroComercial || 'Sin giro comercial' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
            :class="
              socio.tipo === 'DIRECTIVO'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-slate-100 text-slate-600'
            "
          >
            {{ socio.tipo === 'DIRECTIVO' ? 'Directivo' : 'Común' }}
          </span>

          <span
            v-if="fullMember"
            class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
            :class="
              fullMember.usuario.activo
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-600'
            "
          >
            {{ fullMember.usuario.activo ? 'Activo' : 'Inactivo' }}
          </span>

          <button
            v-if="fullMember"
            type="button"
            class="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-ccisj hover:text-ccisj"
            @click="adjustmentModalOpen = true"
          >
            <Plus class="h-4 w-4" />
            Agregar ajuste
          </button>

          <button
            v-if="fullMember"
            type="button"
            class="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:border-ccisj hover:text-ccisj"
            @click="
              router.push({ name: 'socio-editar', params: { id: socio.id } })
            "
          >
            <Pencil class="h-4 w-4" />
            Editar
          </button>
        </div>
      </div>

      <!-- Estado de cuenta -->
      <section class="rounded-xl border border-slate-200 bg-white p-5">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              class="text-xs font-semibold uppercase tracking-wide text-slate-400"
            >
              Estado de cuenta
            </h2>

            <p class="mt-1 text-sm text-slate-500">
              Situación actual de las cuotas del socio.
            </p>
          </div>

          <span
            class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
            :class="feeStatusClass()"
          >
            {{ feeStatusLabel() }}
          </span>
        </div>

        <div v-if="feeSummary" class="mt-5 grid gap-4 sm:grid-cols-2">
          <div class="rounded-xl bg-slate-50 p-4">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-slate-500">
                Cuotas pendientes
              </p>

              <Clock3 class="h-4 w-4 text-slate-400" />
            </div>

            <p class="mt-2 text-xl font-bold text-slate-900">
              {{ feeSummary.cuotasPendientes }}
            </p>
          </div>

          <div class="rounded-xl bg-slate-50 p-4">
            <div class="flex items-center justify-between">
              <p class="text-xs font-medium text-slate-500">Deuda total</p>

              <TriangleAlert
                v-if="feeSummary.deudaTotal > 0"
                class="h-4 w-4 text-red-500"
              />

              <CircleCheck v-else class="h-4 w-4 text-emerald-600" />
            </div>

            <p class="mt-2 text-xl font-bold text-slate-900">
              {{ formatMoney(feeSummary.deudaTotal) }}
            </p>
          </div>
        </div>

        <div
          v-else
          class="mt-5 rounded-lg bg-slate-50 p-5 text-center text-sm text-slate-400"
        >
          No hay información de cuotas disponible para este socio.
        </div>
      </section>

      <section
        v-if="fullMember"
        class="rounded-xl border border-slate-200 bg-white p-5"
      >
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900">
              Ajustes programados
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              Adicionales y descuentos aplicados a las cuotas del socio.
            </p>
          </div>
        </div>

        <div
          v-if="feeAdjustments.length === 0"
          class="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500"
        >
          No hay ajustes registrados.
        </div>

        <div v-else class="divide-y divide-slate-100">
          <div
            v-for="adjustment in feeAdjustments"
            :key="adjustment.id"
            class="flex items-center justify-between gap-4 py-3"
          >
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span
                  class="font-semibold"
                  :class="
                    adjustment.tipo === 'ADICIONAL'
                      ? 'text-red-600'
                      : 'text-emerald-600'
                  "
                >
                  {{ adjustment.tipo === 'ADICIONAL' ? '+' : '-' }}${{
                    adjustment.importe.toLocaleString('es-UY')
                  }}
                </span>

                <span
                  class="rounded-full px-2 py-0.5 text-xs font-medium"
                  :class="
                    adjustment.tipo === 'ADICIONAL'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-emerald-50 text-emerald-700'
                  "
                >
                  {{
                    adjustment.tipo === 'ADICIONAL' ? 'Adicional' : 'Descuento'
                  }}
                </span>
              </div>

              <p v-if="adjustment.motivo" class="mt-1 text-sm text-slate-600">
                {{ adjustment.motivo }}
              </p>
            </div>

            <div class="flex shrink-0 items-center gap-4">
              <p class="text-right text-sm text-slate-500">
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
                class="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                title="Eliminar ajuste"
                @click="adjustmentToDelete = adjustment"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Historial de cuotas -->
      <section
        class="overflow-hidden rounded-xl border border-slate-200 bg-white"
      >
        <div class="px-5 py-4">
          <h2
            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            Historial de cuotas
          </h2>

          <p class="mt-1 text-sm text-slate-500">
            Cuotas generadas para este socio.
          </p>
        </div>

        <div
          v-if="memberFees.length === 0"
          class="border-t border-slate-100 p-8 text-center text-sm text-slate-400"
        >
          No hay cuotas registradas para este socio.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-180 text-left">
            <thead class="border-t border-slate-100 bg-slate-50">
              <tr
                class="text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                <th class="px-5 py-3">Período</th>

                <th class="px-5 py-3">Vencimiento</th>

                <th class="px-5 py-3">Base</th>

                <th class="px-5 py-3">Ajustes</th>

                <th class="px-5 py-3">Total</th>

                <th class="px-5 py-3">Estado</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="fee in memberFees"
                :key="fee.id"
                class="border-t border-slate-100"
              >
                <td
                  class="whitespace-nowrap px-5 py-3.5 text-sm text-slate-700"
                >
                  {{ formatDate(fee.periodoDesde) }}
                  <span class="mx-1 text-slate-300">—</span>
                  {{ formatDate(fee.periodoHasta) }}
                </td>

                <td
                  class="whitespace-nowrap px-5 py-3.5 text-sm text-slate-500"
                >
                  {{ formatDate(fee.fechaVencimiento) }}
                </td>

                <td
                  class="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600"
                >
                  {{ formatMoney(fee.importeBase) }}
                </td>

                <td class="whitespace-nowrap px-5 py-3.5 text-sm">
                  <span
                    :class="
                      fee.importeAjustes > 0
                        ? 'text-red-600'
                        : fee.importeAjustes < 0
                          ? 'text-emerald-700'
                          : 'text-slate-400'
                    "
                  >
                    {{
                      fee.importeAjustes > 0
                        ? `+${formatMoney(fee.importeAjustes)}`
                        : formatMoney(fee.importeAjustes)
                    }}
                  </span>
                </td>

                <td
                  class="whitespace-nowrap px-5 py-3.5 text-sm font-semibold text-slate-800"
                >
                  {{ formatMoney(fee.importeTotal) }}
                </td>

                <td class="px-5 py-3.5">
                  <span
                    class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                    :class="individualFeeStatusClass(fee.estado)"
                  >
                    {{ individualFeeStatusLabel(fee.estado) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Fichas por tema -->
      <div
        v-for="section in sections"
        :key="section.title"
        class="rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2
          class="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400"
        >
          {{ section.title }}
        </h2>

        <dl
          class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div v-for="field in section.fields" :key="field.label">
            <dt class="text-xs text-slate-400">{{ field.label }}</dt>

            <dd class="mt-0.5 wrap-break-word text-sm text-slate-800">
              {{ field.value || '—' }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- Observaciones: solo si hay algo que mostrar -->
      <div
        v-if="fullMember?.observaciones"
        class="rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2
          class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400"
        >
          Observaciones
        </h2>

        <p class="whitespace-pre-line text-sm text-slate-700">
          {{ fullMember.observaciones }}
        </p>
      </div>
    </template>
    <FeeAdjustmentModal
      v-if="fullMember"
      :open="adjustmentModalOpen"
      :socio-name="fullMember.razonSocial"
      @close="adjustmentModalOpen = false"
      @confirm="handleAdjustmentConfirm"
    />

    <ConfirmModal
      :open="adjustmentToDelete !== null"
      title="Eliminar ajuste"
      message="¿Seguro que querés eliminar este ajuste? Las cuotas pendientes afectadas se recalcularán automáticamente."
      confirm-text="Eliminar"
      cancel-text="Cancelar"
      danger
      :loading="deletingAdjustment"
      @confirm="handleDeleteAdjustment"
      @cancel="adjustmentToDelete = null"
    />
  </div>
</template>
