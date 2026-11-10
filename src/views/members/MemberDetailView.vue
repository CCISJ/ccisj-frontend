<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useRoute, useRouter } from 'vue-router';

import { useReceiptViewer } from '@/composables/useReceiptViewer';
import {
  ArrowLeft,
  Briefcase,
  Eye,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from 'lucide-vue-next';

import ConfirmModal from '@/components/ConfirmModal.vue';
import FeeAdjustmentModal from '@/components/fees/FeeAdjustmentModal.vue';
import FeePaymentModal from '@/components/fees/FeePaymentModal.vue';
import CancelPaymentModal from '@/components/members/CancelPaymentModal.vue';
import MemberFeeAdjustments from '@/components/members/MemberFeeAdjustments.vue';
import MemberFeeHistory from '@/components/members/MemberFeeHistory.vue';
import MemberFeeSummary from '@/components/members/MemberFeeSummary.vue';
import MemberPaymentHistory from '@/components/members/MemberPaymentHistory.vue';
import AccountAccess from '@/components/users/AccountAccess.vue';

import { feesService } from '@/services/feesService';
import { getMember, isFullMember } from '@/services/membersService';

import { useToastStore } from '@/stores/toast.ts';

import type {
  CreateFeeAdjustmentData,
  CreateFeePaymentData,
  Fee,
  FeeAdjustment,
  FeePayment,
  MemberFeeSummary as MemberFeeSummaryType,
} from '@/types/fee.type.ts';
import type { Member, MemberDirectoryEntry } from '@/types/member.type';

import { formatDate, formatMonth } from '@/utils/date';

const route = useRoute();
const router = useRouter();
const { viewReceipt } = useReceiptViewer();

const feeSummary = ref<MemberFeeSummaryType | null>(null);
const memberFees = ref<Fee[]>([]);
const adjustmentModalOpen = ref(false);
const feeAdjustments = ref<FeeAdjustment[]>([]);
const adjustmentToDelete = ref<FeeAdjustment | null>(null);
const deletingAdjustment = ref(false);

const feePayments = ref<FeePayment[]>([]);
const paymentToCancel = ref<FeePayment | null>(null);
const cancellationReason = ref('');
const cancellingPayment = ref(false);

const paymentModalOpen = ref(false);
const registeringPayment = ref(false);

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

async function handleCancelPayment() {
  if (!paymentToCancel.value) return;

  const motivo = cancellationReason.value.trim();

  if (!motivo) {
    toast.error('Ingresá un motivo de anulación');
    return;
  }

  try {
    cancellingPayment.value = true;

    await feesService.cancelPayment(paymentToCancel.value.id, motivo);

    paymentToCancel.value = null;
    cancellationReason.value = '';

    toast.success('Pago anulado correctamente');

    await loadMember();
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'No se pudo anular el pago',
    );
  } finally {
    cancellingPayment.value = false;
  }
}

async function handlePaymentConfirm(data: CreateFeePaymentData) {
  if (!fullMember.value || registeringPayment.value) return;

  try {
    registeringPayment.value = true;

    await feesService.createPayment(fullMember.value.id, data);

    paymentModalOpen.value = false;

    toast.success('Pago registrado correctamente');

    await loadMember();
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'No se pudo registrar el pago',
    );
  } finally {
    registeringPayment.value = false;
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
    feePayments.value = await feesService.getMemberPayments(id);
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

function goBack() {
  router.push({ name: 'socios' });
}
</script>

<template>
  <div class="space-y-5">
    <button
      type="button"
      class="flex items-center gap-2 text-base font-medium text-slate-600 transition hover:text-ccisj"
      @click="goBack"
    >
      <ArrowLeft class="h-4 w-4" />
      Volver a socios
    </button>

    <!-- Loading -->
    <div
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-base text-slate-600"
    >
      Cargando socio...
    </div>

    <template v-if="socio">
      <!-- Encabezado -->
      <div
        class="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ccisj-light text-base font-bold text-ccisj"
        >
          {{ socio.razonSocial.slice(0, 2).toUpperCase() }}
        </div>

        <div class="min-w-0 flex-1">
          <h1 class="truncate text-2xl font-bold text-slate-900">
            {{ socio.razonSocial }}
          </h1>

          <p class="mt-0.5 truncate text-base text-slate-600">
            {{ socio.giroComercial || 'Sin giro comercial' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex rounded-full px-2.5 py-1 text-sm font-medium"
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
            class="inline-flex rounded-full px-2.5 py-1 text-sm font-medium"
            :class="
              fullMember.usuario.activo
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            "
          >
            {{ fullMember.usuario.activo ? 'Activo' : 'Inactivo' }}
          </span>

          <button
            v-if="fullMember"
            type="button"
            class="flex items-center gap-1.5 rounded-lg bg-ccisj px-3 py-1.5 text-base font-medium text-white shadow-sm transition hover:opacity-90"
            @click="paymentModalOpen = true"
          >
            <Plus class="h-4 w-4" />
            Registrar pago
          </button>

          <button
            v-if="fullMember"
            type="button"
            class="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-base font-medium text-slate-600 shadow-sm transition hover:border-ccisj hover:text-ccisj"
            @click="adjustmentModalOpen = true"
          >
            <Plus class="h-4 w-4" />
            Agregar ajuste
          </button>

          <button
            v-if="fullMember"
            type="button"
            class="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-base font-medium text-slate-600 shadow-sm transition hover:border-ccisj hover:text-ccisj"
            @click="
              router.push({ name: 'socio-editar', params: { id: socio.id } })
            "
          >
            <Pencil class="h-4 w-4" />
            Editar
          </button>

          <RouterLink
            v-if="fullMember && fullMember.usuario.activo"
            :to="{ name: 'oferta-nueva', query: { socio: socio.id } }"
            class="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-base font-medium text-slate-600 shadow-sm transition hover:border-ccisj hover:text-ccisj"
          >
            <Briefcase class="h-4 w-4" />
            Publicar oferta
          </RouterLink>
        </div>
      </div>

      <!-- Estado de cuenta -->
      <MemberFeeSummary :summary="feeSummary" />

      <MemberFeeAdjustments
        v-if="fullMember"
        :adjustments="feeAdjustments"
        @delete="adjustmentToDelete = $event"
      />

      <!-- Historial de pagos -->
      <MemberPaymentHistory
        v-if="fullMember"
        :payments="feePayments"
        @view-receipt="viewReceipt"
        @cancel-payment="
          paymentToCancel = $event;
          cancellationReason = '';
        "
      />

      <!-- Historial de cuotas -->
      <MemberFeeHistory :fees="memberFees" />

      <!-- Fichas por tema -->
      <div
        v-for="section in sections"
        :key="section.title"
        class="rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2 class="mb-4 text-sm font-semibold text-slate-600">
          {{ section.title }}
        </h2>

        <dl
          class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div v-for="field in section.fields" :key="field.label">
            <dt class="text-sm text-slate-600">{{ field.label }}</dt>

            <dd class="mt-0.5 wrap-break-word text-base text-slate-800">
              {{ field.value || '—' }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- Cuenta de acceso: solo la administración recibe la ficha completa -->
      <AccountAccess
        v-if="fullMember"
        :usuario-id="fullMember.usuario.id"
        :email="fullMember.usuario.email"
        :nombre="fullMember.razonSocial"
      />

      <!-- Observaciones: solo si hay algo que mostrar -->
      <div
        v-if="fullMember?.observaciones"
        class="rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2 class="mb-2 text-sm font-semibold text-slate-600">Observaciones</h2>

        <p class="whitespace-pre-line text-base text-slate-700">
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

    <FeePaymentModal
      v-if="fullMember"
      :open="paymentModalOpen"
      :socio-name="fullMember.razonSocial"
      @close="paymentModalOpen = false"
      @confirm="handlePaymentConfirm"
    />

    <CancelPaymentModal
      :open="paymentToCancel !== null"
      v-model:reason="cancellationReason"
      :loading="cancellingPayment"
      @confirm="handleCancelPayment"
      @close="
        paymentToCancel = null;
        cancellationReason = '';
      "
    />
  </div>
</template>
