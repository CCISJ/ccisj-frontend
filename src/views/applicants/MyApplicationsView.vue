<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useRoute } from 'vue-router';

import {
  Building2,
  Calendar,
  ExternalLink,
  MapPin,
  Search,
  Trash2,
  X,
} from 'lucide-vue-next';

import ApplicationStatusBadge from '@/components/ApplicationStatusBadge.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';

import {
  getMyApplications,
  withdrawApplication,
} from '@/services/applicationsService';

import { useToastStore } from '@/stores/toast';

import {
  APPLICANT_STATUS_LABELS,
  type ApplicationStatus,
  type OwnApplication,
} from '@/types/application.type';
import { OFFER_MODALITY_LABELS } from '@/types/offer.type';

import { formatDate } from '@/utils/date';

const route = useRoute();
const toast = useToastStore();

const applications = ref<OwnApplication[]>([]);
const loading = ref(true);

const search = ref('');
const statusFilter = ref<ApplicationStatus | 'TODOS'>('TODOS');

const STATUS_ORDER: ApplicationStatus[] = [
  'ENVIADA',
  'EN_REVISION',
  'SELECCIONADO',
  'NO_SELECCIONADO',
  'FINALIZADA',
];

/**
 * Se puede retirar mientras la empresa no decidió. Una vez seleccionado o
 * descartado, retirarla borraría el historial sin cambiar nada.
 */
const WITHDRAWABLE: ApplicationStatus[] = ['ENVIADA', 'EN_REVISION'];

async function loadApplications() {
  try {
    loading.value = true;

    applications.value = await getMyApplications();
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudieron cargar tus postulaciones',
    );
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  // Desde Inicio se puede llegar con ?estado=SELECCIONADO.
  const status = route.query.estado;

  if (STATUS_ORDER.includes(status as ApplicationStatus)) {
    statusFilter.value = status as ApplicationStatus;
  }

  await loadApplications();
});

const statusCounts = computed(() => {
  const counts = Object.fromEntries(
    STATUS_ORDER.map((status) => [status, 0]),
  ) as Record<ApplicationStatus, number>;

  for (const item of applications.value) counts[item.estado]++;

  return counts;
});

const hasFilters = computed(
  () => search.value.trim() !== '' || statusFilter.value !== 'TODOS',
);

function clearFilters() {
  search.value = '';
  statusFilter.value = 'TODOS';
}

// Sin tildes ni mayúsculas: "logistica" encuentra "Logística".
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

const filteredApplications = computed(() => {
  const query = normalize(search.value.trim());

  return applications.value.filter((item) => {
    const matchesSearch =
      !query ||
      normalize(item.oferta.titulo).includes(query) ||
      normalize(item.oferta.socio.razonSocial).includes(query);

    const matchesStatus =
      statusFilter.value === 'TODOS' || item.estado === statusFilter.value;

    return matchesSearch && matchesStatus;
  });
});

function canWithdraw(item: OwnApplication) {
  return WITHDRAWABLE.includes(item.estado);
}

// Retirar una postulación, pendiente de confirmar.

const pendingWithdraw = ref<OwnApplication | null>(null);
const processing = ref(false);

function askWithdraw(item: OwnApplication) {
  pendingWithdraw.value = item;
}

function cancelWithdraw() {
  if (processing.value) return;

  pendingWithdraw.value = null;
}

async function confirmWithdraw() {
  const item = pendingWithdraw.value;

  if (!item || processing.value) return;

  try {
    processing.value = true;

    await withdrawApplication(item.id);

    applications.value = applications.value.filter(
      (current) => current.id !== item.id,
    );

    toast.success('Retiraste tu postulación');
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudo retirar la postulación. Intentá nuevamente.',
    );

    await loadApplications();
  } finally {
    pendingWithdraw.value = null;
    processing.value = false;
  }
}

const withdrawMessage = computed(() => {
  const item = pendingWithdraw.value;

  if (!item) return '';

  const reapply =
    item.oferta.estado === 'ACTIVA'
      ? ' Mientras la oferta siga abierta, vas a poder volver a postularte.'
      : ' La oferta ya cerró, así que no vas a poder volver a postularte.';

  return `Tu postulación a "${item.oferta.titulo}" se va a eliminar y ${item.oferta.socio.razonSocial} ya no la va a ver.${reapply}`;
});
</script>

<template>
  <div class="space-y-5">
    <!-- Encabezado -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Mis postulaciones</h1>

        <p class="mt-1 text-sm text-slate-500">
          Las ofertas a las que te postulaste y en qué estado está cada una.
        </p>
      </div>

      <RouterLink
        :to="{ name: 'ofertas' }"
        class="flex items-center gap-2 rounded-xl bg-ccisj px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
      >
        <Search class="h-4 w-4" />
        Buscar ofertas
      </RouterLink>
    </div>

    <!-- Filtros -->
    <div
      v-if="applications.length > 0"
      class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center"
    >
      <div class="relative flex-1">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />

        <input
          v-model="search"
          type="search"
          placeholder="Buscar por puesto o empresa..."
          aria-label="Buscar postulaciones"
          class="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <select
        v-model="statusFilter"
        aria-label="Filtrar por estado"
        class="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-ccisj"
      >
        <option value="TODOS">Todos los estados</option>
        <option v-for="status in STATUS_ORDER" :key="status" :value="status">
          {{ APPLICANT_STATUS_LABELS[status] }} ({{ statusCounts[status] }})
        </option>
      </select>

      <button
        v-if="hasFilters"
        type="button"
        class="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        @click="clearFilters"
      >
        <X class="h-4 w-4" />
        Limpiar
      </button>
    </div>

    <!-- Cargando -->
    <div
      v-if="loading && applications.length === 0"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"
    >
      Cargando postulaciones...
    </div>

    <!-- Sin postulaciones -->
    <div
      v-else-if="applications.length === 0"
      class="rounded-xl border border-slate-200 bg-white p-12 text-center"
    >
      <p class="text-sm font-medium text-slate-600">
        Todavía no te postulaste a ninguna oferta
      </p>

      <p class="mt-1 text-sm text-slate-400">
        Cuando te postules, vas a poder seguir el estado de cada postulación
        acá.
      </p>

      <RouterLink
        :to="{ name: 'ofertas' }"
        class="mt-4 inline-flex text-sm font-medium text-ccisj hover:underline"
      >
        Ver ofertas disponibles
      </RouterLink>
    </div>

    <!-- Sin resultados para los filtros -->
    <div
      v-else-if="filteredApplications.length === 0"
      class="rounded-xl border border-slate-200 bg-white p-12 text-center"
    >
      <p class="text-sm text-slate-500">
        Ninguna postulación coincide con esos filtros.
      </p>

      <button
        type="button"
        class="mt-2 text-sm font-medium text-ccisj hover:underline"
        @click="clearFilters"
      >
        Limpiar filtros
      </button>
    </div>

    <!-- Listado -->
    <ul v-else class="space-y-3">
      <li
        v-for="item in filteredApplications"
        :key="item.id"
        class="rounded-xl border border-slate-200 bg-white p-5"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-base font-semibold text-slate-900">
              {{ item.oferta.titulo }}
            </h2>

            <div
              class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500"
            >
              <span class="flex items-center gap-1">
                <Building2 class="h-3.5 w-3.5" />
                {{ item.oferta.socio.razonSocial }}
              </span>

              <span
                v-if="item.oferta.ubicacion"
                class="flex items-center gap-1"
              >
                <MapPin class="h-3.5 w-3.5" />
                {{ item.oferta.ubicacion }}
              </span>

              <span v-if="item.oferta.modalidad">
                {{ OFFER_MODALITY_LABELS[item.oferta.modalidad] }}
              </span>

              <span class="flex items-center gap-1">
                <Calendar class="h-3.5 w-3.5" />
                Te postulaste el {{ formatDate(item.fechaPostulacion) }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span
              v-if="item.oferta.estado === 'CERRADA'"
              class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500"
            >
              Oferta cerrada
            </span>

            <ApplicationStatusBadge :status="item.estado" applicant />
          </div>
        </div>

        <p
          v-if="item.observaciones"
          class="mt-3 line-clamp-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600"
        >
          <span class="font-medium text-slate-700">Tu mensaje:</span>
          {{ item.observaciones }}
        </p>

        <div
          v-if="item.oferta.estado === 'ACTIVA' || canWithdraw(item)"
          class="mt-4 flex flex-wrap justify-end gap-2"
        >
          <button
            v-if="canWithdraw(item)"
            type="button"
            class="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            @click="askWithdraw(item)"
          >
            <Trash2 class="h-4 w-4" />
            Retirar
          </button>

          <RouterLink
            v-if="item.oferta.estado === 'ACTIVA'"
            :to="{ name: 'oferta-detalle', params: { id: item.oferta.id } }"
            class="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-ccisj transition hover:border-ccisj hover:bg-ccisj-light/40"
          >
            <ExternalLink class="h-4 w-4" />
            Ver oferta
          </RouterLink>
        </div>
      </li>
    </ul>
  </div>

  <ConfirmModal
    :open="pendingWithdraw !== null"
    title="Retirar postulación"
    :message="withdrawMessage"
    confirm-text="Retirar"
    danger
    :loading="processing"
    @cancel="cancelWithdraw"
    @confirm="confirmWithdraw"
  />
</template>
