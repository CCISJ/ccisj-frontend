<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { useRoute, useRouter } from 'vue-router';

import { useReceiptViewer } from '@/composables/useReceiptViewer';
import { ArrowLeft, Briefcase, Pencil, Plus } from 'lucide-vue-next';

import ConfirmModal from '@/components/ConfirmModal.vue';
import TabBar from '@/components/TabBar.vue';
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

import { formatDate } from '@/utils/date';

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

    // Las cinco consultas a la vez: no dependen una de otra.
    const [memberData, summary, fees, adjustments, payments] =
      await Promise.all([
        getMember(id),
        feesService.getMemberFeeSummary(id),
        feesService.getMemberFees(id),
        feesService.getMemberAdjustments(id),
        feesService.getMemberPayments(id),
      ]);

    socio.value = memberData;
    feeSummary.value = summary;
    memberFees.value = fees;
    feeAdjustments.value = adjustments;
    feePayments.value = payments;
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

/*
 * La ficha completa se parte en tres pestañas: lo que se mira casi siempre
 * (resumen), el detalle de cuotas y pagos, y los datos de la empresa. La
 * pestaña va en la URL (`?seccion=`) para que volver o compartir el enlace
 * abra la misma.
 */
const TAB_VALUES = ['resumen', 'cuotas', 'datos'] as const;
type TabValue = (typeof TAB_VALUES)[number];

function tabFrom(value: unknown): TabValue {
  return TAB_VALUES.includes(value as TabValue)
    ? (value as TabValue)
    : 'resumen';
}

const tab = ref<string>(tabFrom(route.query.seccion));

watch(tab, (value) => {
  void router.replace({
    query: { ...route.query, seccion: value === 'resumen' ? undefined : value },
  });
});

const tabs = [
  { value: 'resumen', label: 'Resumen' },
  { value: 'cuotas', label: 'Cuotas y pagos' },
  { value: 'datos', label: 'Datos' },
];

/** Lo que más se busca de un socio: cómo ubicarlo. */
const contact = computed<Field[]>(() => {
  const data = socio.value;

  if (!data) return [];

  return [
    { label: 'Titular', value: data.titular },
    {
      label: 'Teléfono',
      value: [data.telefono, data.celular].filter(Boolean).join(' · '),
    },
    { label: 'Email', value: data.email },
    {
      label: 'Dirección',
      value: [data.direccion, data.ciudad].filter(Boolean).join(', '),
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
      <!-- Encabezado: quién es y lo que más se hace desde acá -->
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h1 class="text-3xl font-bold text-slate-900">
            {{ socio.razonSocial }}
          </h1>

          <p class="mt-1 text-base text-slate-600">
            {{ socio.giroComercial || 'Sin giro comercial' }}
            · Socio {{ socio.tipo === 'DIRECTIVO' ? 'directivo' : 'común' }}
            <template v-if="fullMember">
              ·
              <span
                :class="
                  fullMember.usuario.activo ? '' : 'font-semibold text-red-700'
                "
              >
                {{ fullMember.usuario.activo ? 'Activo' : 'Dado de baja' }}
              </span>
            </template>
          </p>
        </div>

        <div v-if="fullMember" class="flex flex-wrap items-center gap-2">
          <RouterLink
            v-if="fullMember.usuario.activo"
            :to="{ name: 'oferta-nueva', query: { socio: socio.id } }"
            class="flex min-h-11 items-center gap-1.5 rounded-xl px-3 font-semibold text-slate-700 transition hover:bg-white hover:text-ccisj"
          >
            <Briefcase class="h-4 w-4" />
            Publicar oferta
          </RouterLink>

          <RouterLink
            :to="{ name: 'socio-editar', params: { id: socio.id } }"
            class="flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-800 transition hover:border-ccisj hover:text-ccisj"
          >
            <Pencil class="h-4 w-4" />
            Editar
          </RouterLink>

          <button
            type="button"
            class="flex min-h-11 items-center gap-1.5 rounded-xl bg-ccisj px-4 font-semibold max-sm:order-first text-white transition hover:bg-ccisj-dark"
            @click="paymentModalOpen = true"
          >
            <Plus class="h-4 w-4" />
            Registrar pago
          </button>
        </div>
      </header>

      <!-- La ficha completa (administración), por temas -->
      <template v-if="fullMember">
        <TabBar
          v-model="tab"
          :tabs="tabs"
          id-prefix="socio"
          label="Secciones de la ficha del socio"
        />

        <!-- Resumen: lo que se mira casi siempre -->
        <div
          v-show="tab === 'resumen'"
          id="socio-panel-resumen"
          role="tabpanel"
          aria-labelledby="socio-tab-resumen"
          class="space-y-5"
        >
          <MemberFeeSummary :summary="feeSummary" />

          <div class="grid gap-5 lg:grid-cols-[3fr_2fr]">
            <MemberPaymentHistory
              class="min-w-0"
              :payments="feePayments"
              :limit="3"
              @view-receipt="viewReceipt"
              @cancel-payment="
                paymentToCancel = $event;
                cancellationReason = '';
              "
            />

            <section class="rounded-xl border border-slate-200 bg-white p-5">
              <h2 class="text-lg font-semibold text-slate-900">Contacto</h2>

              <dl class="mt-3 space-y-3">
                <div v-for="field in contact" :key="field.label">
                  <dt class="text-sm text-slate-600">{{ field.label }}</dt>
                  <dd class="wrap-break-word text-base text-slate-900">
                    {{ field.value || '—' }}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                class="mt-4 font-semibold text-ccisj hover:underline"
                @click="tab = 'datos'"
              >
                Ver todos los datos
              </button>
            </section>
          </div>

          <section
            v-if="fullMember.observaciones"
            class="rounded-xl border border-slate-200 bg-white p-5"
          >
            <h2 class="text-lg font-semibold text-slate-900">Observaciones</h2>

            <p class="mt-2 whitespace-pre-line text-base text-slate-700">
              {{ fullMember.observaciones }}
            </p>
          </section>
        </div>

        <!-- Cuotas y pagos: todo el detalle -->
        <div
          v-show="tab === 'cuotas'"
          id="socio-panel-cuotas"
          role="tabpanel"
          aria-labelledby="socio-tab-cuotas"
          class="space-y-5"
        >
          <MemberFeeSummary :summary="feeSummary" />

          <MemberFeeAdjustments
            :adjustments="feeAdjustments"
            @add="adjustmentModalOpen = true"
            @delete="adjustmentToDelete = $event"
          />

          <MemberPaymentHistory
            :payments="feePayments"
            :limit="6"
            @view-receipt="viewReceipt"
            @cancel-payment="
              paymentToCancel = $event;
              cancellationReason = '';
            "
          />

          <MemberFeeHistory :fees="memberFees" :limit="6" />
        </div>

        <!-- Datos: la ficha de la empresa y su cuenta -->
        <div
          v-show="tab === 'datos'"
          id="socio-panel-datos"
          role="tabpanel"
          aria-labelledby="socio-tab-datos"
          class="space-y-5"
        >
          <section
            v-for="section in sections"
            :key="section.title"
            class="rounded-xl border border-slate-200 bg-white p-5"
          >
            <h2 class="mb-4 text-lg font-semibold text-slate-900">
              {{ section.title }}
            </h2>

            <dl
              class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <div v-for="field in section.fields" :key="field.label">
                <dt class="text-sm text-slate-600">{{ field.label }}</dt>

                <dd class="mt-0.5 wrap-break-word text-base text-slate-900">
                  {{ field.value || '—' }}
                </dd>
              </div>
            </dl>
          </section>

          <AccountAccess
            :usuario-id="fullMember.usuario.id"
            :email="fullMember.usuario.email"
            :nombre="fullMember.razonSocial"
          />
        </div>
      </template>

      <!-- Un directivo ve el directorio: los datos públicos y sus cuotas -->
      <template v-else>
        <section
          v-for="section in sections"
          :key="section.title"
          class="rounded-xl border border-slate-200 bg-white p-5"
        >
          <h2 class="mb-4 text-lg font-semibold text-slate-900">
            {{ section.title }}
          </h2>

          <dl
            class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div v-for="field in section.fields" :key="field.label">
              <dt class="text-sm text-slate-600">{{ field.label }}</dt>

              <dd class="mt-0.5 wrap-break-word text-base text-slate-900">
                {{ field.value || '—' }}
              </dd>
            </div>
          </dl>
        </section>

        <MemberFeeHistory :fees="memberFees" :limit="6" />
      </template>
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
