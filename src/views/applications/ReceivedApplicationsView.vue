<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { FileText, RefreshCw, Search, X } from 'lucide-vue-next';

import ApplicationStatusBadge from '@/components/ApplicationStatusBadge.vue';
import ConfirmModal from '@/components/ConfirmModal.vue';
import ApplicationDetailPanel from './ApplicationDetailPanel.vue';
import {
  getReceivedApplications,
  updateApplicationStatus,
} from '@/services/applicationsService';
import { useToastStore } from '@/stores/toast';
import {
  APPLICATION_STATUS_LABELS,
  type ApplicationStatus,
  type MemberApplicationStatus,
  type ReceivedApplication,
} from '@/types/application.type';
import { formatDate } from '@/utils/format';

const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const applications = ref<ReceivedApplication[]>([]);
const loading = ref(true);
const error = ref('');

const search = ref('');
const offerFilter = ref<number | 'TODAS'>('TODAS');
const statusFilter = ref<ApplicationStatus | 'TODOS'>('TODOS');

const PAGE_SIZE = 10;
const page = ref(1);

const STATUS_ORDER: ApplicationStatus[] = [
  'ENVIADA',
  'EN_REVISION',
  'SELECCIONADO',
  'NO_SELECCIONADO',
  'FINALIZADA',
];

/** Un ID positivo de la query (`?oferta=3`), o null. */
function queryId(value: unknown) {
  const id = Number(value);

  return Number.isInteger(id) && id > 0 ? id : null;
}

async function loadApplications() {
  try {
    loading.value = true;
    error.value = '';

    applications.value = await getReceivedApplications();
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : 'No se pudieron cargar las postulaciones';
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await loadApplications();

  // Desde Mis ofertas se llega con ?oferta=ID y desde Inicio con
  // ?postulacion=ID. Si ya no existe, se ignora.
  const offerId = queryId(route.query.oferta);

  if (offerId && offers.value.some((offer) => offer.id === offerId)) {
    offerFilter.value = offerId;
  }

  const applicationId = queryId(route.query.postulacion);

  if (applicationId) {
    if (applications.value.some((item) => item.id === applicationId)) {
      selectedId.value = applicationId;
    } else if (!error.value) {
      toast.info('No encontramos esa postulación');
    }
  }
});

/** Las ofertas que recibieron postulaciones, para el filtro. */
const offers = computed(() => {
  const byId = new Map<number, ReceivedApplication['oferta']>();

  for (const { oferta } of applications.value) byId.set(oferta.id, oferta);

  return [...byId.values()].sort((a, b) =>
    a.titulo.localeCompare(b.titulo, 'es'),
  );
});

const statusCounts = computed(() => {
  const counts = Object.fromEntries(
    STATUS_ORDER.map((status) => [status, 0]),
  ) as Record<ApplicationStatus, number>;

  for (const item of applications.value) counts[item.estado]++;

  return counts;
});

const hasFilters = computed(
  () =>
    search.value.trim() !== '' ||
    offerFilter.value !== 'TODAS' ||
    statusFilter.value !== 'TODOS',
);

function clearFilters() {
  search.value = '';
  offerFilter.value = 'TODAS';
  statusFilter.value = 'TODOS';
}

// Sin tildes ni mayúsculas: "Jose" encuentra a "José".
function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

const filteredApplications = computed(() => {
  const query = normalize(search.value.trim());

  return applications.value.filter((item) => {
    const { nombre, apellido, usuario } = item.postulante;

    const matchesSearch =
      !query ||
      normalize(`${nombre} ${apellido}`).includes(query) ||
      normalize(usuario.email).includes(query);

    const matchesOffer =
      offerFilter.value === 'TODAS' || item.oferta.id === offerFilter.value;

    const matchesStatus =
      statusFilter.value === 'TODOS' || item.estado === statusFilter.value;

    return matchesSearch && matchesOffer && matchesStatus;
  });
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredApplications.value.length / PAGE_SIZE)),
);

const visibleApplications = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;

  return filteredApplications.value.slice(start, start + PAGE_SIZE);
});

const rangeStart = computed(() =>
  filteredApplications.value.length === 0
    ? 0
    : (page.value - 1) * PAGE_SIZE + 1,
);

const rangeEnd = computed(() =>
  Math.min(page.value * PAGE_SIZE, filteredApplications.value.length),
);

watch([search, offerFilter, statusFilter], () => {
  page.value = 1;
});

watch(totalPages, (total) => {
  if (page.value > total) page.value = total;
});

function goToPage(next: number) {
  page.value = Math.min(Math.max(next, 1), totalPages.value);
}

// Detalle

const selectedId = ref<number | null>(null);

const selected = computed(
  () => applications.value.find((item) => item.id === selectedId.value) ?? null,
);

// La postulación abierta queda en la URL: recargar la página no la cierra.
watch(selectedId, (id) => {
  const query = { ...route.query };

  if (id) query.postulacion = String(id);
  else delete query.postulacion;

  router.replace({ query });
});

function openApplication(item: ReceivedApplication) {
  selectedId.value = item.id;
}

function closeApplication() {
  selectedId.value = null;
}

// Cambio de estado pendiente de confirmar.

const pendingStatus = ref<MemberApplicationStatus | null>(null);
const processing = ref(false);

const modal = computed(() => {
  const item = selected.value;
  const estado = pendingStatus.value;

  if (!item || !estado) return { title: '', message: '', confirmText: '' };

  const nombre = item.postulante.nombre;
  const titulo = item.oferta.titulo;

  switch (estado) {
    case 'EN_REVISION':
      return {
        title: 'Marcar en revisión',
        message: `${nombre} va a recibir un aviso de que estás revisando su postulación a "${titulo}".`,
        confirmText: 'Marcar en revisión',
      };

    case 'SELECCIONADO':
      return {
        title: 'Marcar como seleccionado',
        message: `${nombre} va a recibir un aviso de que su postulación a "${titulo}" fue seleccionada.`,
        confirmText: 'Marcar como seleccionado',
      };

    case 'NO_SELECCIONADO':
      return {
        title: 'Marcar como no seleccionado',
        message: `${nombre} va a recibir un aviso de que su postulación a "${titulo}" no fue seleccionada.`,
        confirmText: 'Marcar como no seleccionado',
      };
  }
});

function askStatusChange(estado: MemberApplicationStatus) {
  if (!selected.value || selected.value.estado === estado) return;

  pendingStatus.value = estado;
}

function cancelStatusChange() {
  if (processing.value) return;

  pendingStatus.value = null;
}

async function confirmStatusChange() {
  const item = selected.value;
  const estado = pendingStatus.value;

  if (!item || !estado || processing.value) return;

  try {
    processing.value = true;

    const updated = await updateApplicationStatus(item.id, estado);

    applications.value = applications.value.map((current) =>
      current.id === updated.id ? updated : current,
    );

    toast.success(
      `Estado actualizado: ${APPLICATION_STATUS_LABELS[updated.estado]}`,
    );
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudo cambiar el estado. Intentá nuevamente.',
    );

    // Otro cambio pudo llegar antes: mostrar el estado real.
    await loadApplications();
  } finally {
    pendingStatus.value = null;
    processing.value = false;
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Encabezado -->
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Postulantes</h1>

      <p class="mt-1 text-sm text-slate-500">
        Las personas que se postularon a las ofertas de tu empresa.
      </p>
    </div>

    <!-- Filtros -->
    <div
      class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center"
    >
      <div class="relative flex-1">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />

        <input
          v-model="search"
          type="search"
          placeholder="Buscar por nombre o email..."
          aria-label="Buscar postulantes"
          class="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <select
        v-model="offerFilter"
        aria-label="Filtrar por oferta"
        class="h-10 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-ccisj lg:max-w-64"
      >
        <option value="TODAS">Todas las ofertas</option>
        <option v-for="offer in offers" :key="offer.id" :value="offer.id">
          {{ offer.titulo }}{{ offer.estado === 'CERRADA' ? ' (cerrada)' : '' }}
        </option>
      </select>

      <select
        v-model="statusFilter"
        aria-label="Filtrar por estado"
        class="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-ccisj"
      >
        <option value="TODOS">Todos los estados</option>
        <option v-for="status in STATUS_ORDER" :key="status" :value="status">
          {{ APPLICATION_STATUS_LABELS[status] }} ({{ statusCounts[status] }})
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

    <!-- Loading -->
    <div
      v-if="loading && applications.length === 0"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"
    >
      Cargando postulaciones...
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
    >
      <p class="text-sm text-red-600">{{ error }}</p>

      <button
        type="button"
        class="mx-auto mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        @click="loadApplications"
      >
        <RefreshCw class="h-4 w-4" />
        Reintentar
      </button>
    </div>

    <!-- Sin postulaciones -->
    <div
      v-else-if="applications.length === 0"
      class="rounded-xl border border-slate-200 bg-white p-12 text-center"
    >
      <p class="text-sm font-medium text-slate-600">
        Todavía no recibiste postulaciones
      </p>

      <p class="mt-1 text-sm text-slate-400">
        Cuando alguien se postule a una de tus ofertas, va a aparecer acá.
      </p>

      <RouterLink
        to="/mis-ofertas"
        class="mt-4 inline-flex text-sm font-medium text-ccisj hover:underline"
      >
        Ir a Mis ofertas
      </RouterLink>
    </div>

    <!-- Tabla -->
    <div
      v-else
      class="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div class="overflow-x-auto">
        <table class="w-full min-w-180 text-left">
          <thead class="bg-slate-50">
            <tr
              class="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              <th class="px-5 py-3">Postulante</th>
              <th class="px-5 py-3">Oferta</th>
              <th class="px-5 py-3">Fecha</th>
              <th class="px-5 py-3 text-center">CV</th>
              <th class="px-5 py-3">Estado</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="item in visibleApplications"
              :key="item.id"
              class="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50"
              :class="{ 'bg-ccisj-light/40': item.id === selectedId }"
              tabindex="0"
              @click="openApplication(item)"
              @keydown.enter="openApplication(item)"
            >
              <!-- Postulante -->
              <td class="max-w-72 px-5 py-3.5">
                <p
                  class="truncate text-slate-900"
                  :class="
                    item.estado === 'ENVIADA' ? 'font-semibold' : 'font-medium'
                  "
                >
                  {{ item.postulante.nombre }} {{ item.postulante.apellido }}
                </p>

                <p class="mt-0.5 truncate text-xs text-slate-400">
                  {{ item.postulante.usuario.email }}
                </p>
              </td>

              <!-- Oferta -->
              <td class="max-w-64 px-5 py-3.5">
                <p class="truncate text-sm text-slate-700">
                  {{ item.oferta.titulo }}
                </p>

                <p
                  v-if="item.oferta.estado === 'CERRADA'"
                  class="text-xs text-slate-400"
                >
                  Cerrada
                </p>
              </td>

              <!-- Fecha -->
              <td class="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">
                {{ formatDate(item.fechaPostulacion) }}
              </td>

              <!-- CV -->
              <td class="px-5 py-3.5 text-center">
                <FileText
                  v-if="item.postulante.cvs.length > 0"
                  class="mx-auto h-4 w-4 text-ccisj"
                  aria-label="Tiene CV"
                />

                <span v-else class="text-xs text-slate-400">—</span>
              </td>

              <!-- Estado -->
              <td class="px-5 py-3.5">
                <ApplicationStatusBadge :status="item.estado" />
              </td>
            </tr>

            <!-- Sin resultados para los filtros actuales -->
            <tr v-if="filteredApplications.length === 0">
              <td colspan="5" class="px-5 py-12 text-center">
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div
        v-if="filteredApplications.length > 0"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500"
      >
        <span>
          Mostrando {{ rangeStart }}-{{ rangeEnd }} de
          {{ filteredApplications.length }}
          {{
            filteredApplications.length === 1 ? 'postulación' : 'postulaciones'
          }}
        </span>

        <div v-if="totalPages > 1" class="flex items-center gap-1">
          <button
            type="button"
            :disabled="page === 1"
            class="rounded-lg px-2 py-1 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            @click="goToPage(page - 1)"
          >
            Anterior
          </button>

          <button
            v-for="n in totalPages"
            :key="n"
            type="button"
            class="rounded-lg px-2.5 py-1 transition"
            :class="
              n === page
                ? 'bg-ccisj-light font-semibold text-ccisj'
                : 'hover:bg-slate-100'
            "
            @click="goToPage(n)"
          >
            {{ n }}
          </button>

          <button
            type="button"
            :disabled="page === totalPages"
            class="rounded-lg px-2 py-1 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            @click="goToPage(page + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  </div>

  <ApplicationDetailPanel
    v-if="selected"
    :application="selected"
    :busy="processing || pendingStatus !== null"
    @close="closeApplication"
    @change-status="askStatusChange"
  />

  <ConfirmModal
    :open="pendingStatus !== null"
    :title="modal.title"
    :message="modal.message"
    :confirm-text="modal.confirmText"
    :loading="processing"
    @cancel="cancelStatusChange"
    @confirm="confirmStatusChange"
  />
</template>
