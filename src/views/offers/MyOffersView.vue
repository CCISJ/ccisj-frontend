<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-vue-next';

import ConfirmModal from '@/components/ConfirmModal.vue';
import {
  deleteOffer,
  getMyOffers,
  updateOffer,
} from '@/services/offersService';
import { useToastStore } from '@/stores/toast';
import { OFFER_MODALITY_LABELS, type OwnOffer } from '@/types/offer.type';
import { formatDate, uruguayDay } from '@/utils/format';

const router = useRouter();
const toast = useToastStore();

const offers = ref<OwnOffer[]>([]);
const loading = ref(true);
const error = ref('');

const search = ref('');
const statusFilter = ref<'TODOS' | 'ACTIVA' | 'CERRADA'>('TODOS');

const PAGE_SIZE = 10;
const page = ref(1);

async function loadOffers() {
  try {
    loading.value = true;
    error.value = '';

    offers.value = await getMyOffers();
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'No se pudieron cargar tus ofertas';
  } finally {
    loading.value = false;
  }
}

onMounted(loadOffers);

const counts = computed(() => ({
  activas: offers.value.filter((offer) => offer.estado === 'ACTIVA').length,
  cerradas: offers.value.filter((offer) => offer.estado === 'CERRADA').length,
}));

const hasFilters = computed(
  () => search.value.trim() !== '' || statusFilter.value !== 'TODOS',
);

function clearFilters() {
  search.value = '';
  statusFilter.value = 'TODOS';
}

const filteredOffers = computed(() => {
  const query = search.value.trim().toLowerCase();

  return offers.value.filter((offer) => {
    const matchesSearch =
      !query ||
      offer.titulo.toLowerCase().includes(query) ||
      offer.ubicacion?.toLowerCase().includes(query) ||
      offer.categorias.some(({ categoria }) =>
        categoria.nombre.toLowerCase().includes(query),
      );

    const matchesStatus =
      statusFilter.value === 'TODOS' || offer.estado === statusFilter.value;

    return matchesSearch && matchesStatus;
  });
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredOffers.value.length / PAGE_SIZE)),
);

const visibleOffers = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;

  return filteredOffers.value.slice(start, start + PAGE_SIZE);
});

const rangeStart = computed(() =>
  filteredOffers.value.length === 0 ? 0 : (page.value - 1) * PAGE_SIZE + 1,
);

const rangeEnd = computed(() =>
  Math.min(page.value * PAGE_SIZE, filteredOffers.value.length),
);

watch([search, statusFilter], () => {
  page.value = 1;
});

// Si una acción deja la página actual vacía (por ejemplo, al eliminar la
// última oferta de la página), volver a la anterior.
watch(totalPages, (total) => {
  if (page.value > total) page.value = total;
});

function goToPage(next: number) {
  page.value = Math.min(Math.max(next, 1), totalPages.value);
}

/** La fecha de cierre ya pasó: la oferta no se puede reabrir tal cual. */
function isExpired(offer: OwnOffer) {
  return !!offer.fechaCierre && new Date(offer.fechaCierre) < new Date();
}

function closingLabel(offer: OwnOffer) {
  if (!offer.fechaCierre) return 'Sin fecha';

  return formatDate(uruguayDay(offer.fechaCierre));
}

function closesToday(offer: OwnOffer) {
  return (
    offer.estado === 'ACTIVA' &&
    !!offer.fechaCierre &&
    uruguayDay(offer.fechaCierre) === uruguayDay()
  );
}

function newOffer() {
  router.push({ name: 'mis-ofertas-nueva' });
}

function editOffer(offer: OwnOffer) {
  router.push({ name: 'mis-ofertas-editar', params: { id: offer.id } });
}

// Acción pendiente de confirmar en el modal.
type PendingAction =
  | { type: 'cerrar'; offer: OwnOffer }
  | { type: 'reabrir'; offer: OwnOffer }
  | { type: 'eliminar'; offer: OwnOffer };

const pending = ref<PendingAction | null>(null);
const processing = ref(false);

const modal = computed(() => {
  const action = pending.value;

  if (!action) return { title: '', message: '', confirmText: '' };

  const titulo = action.offer.titulo;

  switch (action.type) {
    case 'cerrar':
      return {
        title: 'Cerrar oferta',
        message: `"${titulo}" dejará de recibir postulaciones. Las que ya recibiste se conservan y podés reabrirla más adelante.`,
        confirmText: 'Cerrar oferta',
      };

    case 'reabrir':
      return {
        title: 'Reabrir oferta',
        message: `"${titulo}" volverá a estar visible y a recibir postulaciones.`,
        confirmText: 'Reabrir',
      };

    case 'eliminar':
      return {
        title: 'Eliminar oferta',
        message: `¿Seguro que querés eliminar "${titulo}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
      };
  }
});

function askClose(offer: OwnOffer) {
  pending.value = { type: 'cerrar', offer };
}

function askReopen(offer: OwnOffer) {
  // Con la fecha vencida hace falta elegir una nueva: eso se hace en el
  // formulario, que ya valida la fecha.
  if (isExpired(offer)) {
    router.push({
      name: 'mis-ofertas-editar',
      params: { id: offer.id },
      query: { reabrir: '1' },
    });

    return;
  }

  pending.value = { type: 'reabrir', offer };
}

function askDelete(offer: OwnOffer) {
  if (offer._count.postulaciones > 0) return;

  pending.value = { type: 'eliminar', offer };
}

function cancelAction() {
  if (processing.value) return;

  pending.value = null;
}

async function confirmAction() {
  const action = pending.value;

  if (!action || processing.value) return;

  try {
    processing.value = true;

    if (action.type === 'eliminar') {
      await deleteOffer(action.offer.id);
      toast.success('Oferta eliminada');
    } else {
      const estado = action.type === 'cerrar' ? 'CERRADA' : 'ACTIVA';

      await updateOffer(action.offer.id, { estado });
      toast.success(
        estado === 'CERRADA' ? 'Oferta cerrada' : 'Oferta reabierta',
      );
    }

    pending.value = null;
    await loadOffers();
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudo completar la acción. Intentá nuevamente.',
    );

    pending.value = null;

    // Algo cambió del otro lado (por ejemplo, llegó una postulación o la
    // oferta venció): refrescar para mostrar el estado real.
    await loadOffers();
  } finally {
    processing.value = false;
  }
}

const iconButton =
  'rounded-lg p-2 text-slate-400 transition disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-slate-400';
</script>

<template>
  <div class="space-y-5">
    <!-- Encabezado -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Mis ofertas</h1>

        <p class="mt-1 text-sm text-slate-500">
          Publicá y administrá las ofertas laborales de tu empresa.
        </p>
      </div>

      <button
        type="button"
        class="flex items-center gap-2 rounded-xl bg-ccisj px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        @click="newOffer"
      >
        <Plus class="h-4 w-4" />
        Publicar oferta
      </button>
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
          placeholder="Buscar por título, categoría o ubicación..."
          aria-label="Buscar ofertas"
          class="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <select
        v-model="statusFilter"
        aria-label="Filtrar por estado"
        class="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-ccisj"
      >
        <option value="TODOS">Todos los estados</option>
        <option value="ACTIVA">Activas ({{ counts.activas }})</option>
        <option value="CERRADA">Cerradas ({{ counts.cerradas }})</option>
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
      v-if="loading && offers.length === 0"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"
    >
      Cargando ofertas...
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
        @click="loadOffers"
      >
        <RefreshCw class="h-4 w-4" />
        Reintentar
      </button>
    </div>

    <!-- Sin ofertas -->
    <div
      v-else-if="offers.length === 0"
      class="rounded-xl border border-slate-200 bg-white p-12 text-center"
    >
      <p class="text-sm font-medium text-slate-600">
        Todavía no publicaste ofertas
      </p>

      <p class="mt-1 text-sm text-slate-400">
        Cuando publiques una, los postulantes van a poder verla y postularse.
      </p>

      <button
        type="button"
        class="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-ccisj px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        @click="newOffer"
      >
        <Plus class="h-4 w-4" />
        Publicar la primera
      </button>
    </div>

    <!-- Tabla -->
    <div
      v-else
      class="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div class="overflow-x-auto">
        <table class="w-full min-w-200 text-left">
          <thead class="bg-slate-50">
            <tr
              class="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              <th class="px-5 py-3">Oferta</th>
              <th class="px-5 py-3">Publicada</th>
              <th class="px-5 py-3">Cierra</th>
              <th class="px-5 py-3 text-center">Postulaciones</th>
              <th class="px-5 py-3">Estado</th>
              <th class="px-5 py-3 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="offer in visibleOffers"
              :key="offer.id"
              class="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50"
              @click="editOffer(offer)"
            >
              <!-- Oferta -->
              <td class="max-w-80 px-5 py-3.5">
                <p class="truncate font-semibold text-slate-900">
                  {{ offer.titulo }}
                </p>

                <p class="mt-0.5 truncate text-xs text-slate-400">
                  {{
                    [
                      offer.modalidad && OFFER_MODALITY_LABELS[offer.modalidad],
                      offer.ubicacion,
                      `${offer.cantidadVacantes} ${offer.cantidadVacantes === 1 ? 'vacante' : 'vacantes'}`,
                    ]
                      .filter(Boolean)
                      .join(' · ')
                  }}
                </p>

                <div class="mt-1.5 flex flex-wrap gap-1">
                  <span
                    v-for="{ categoria } in offer.categorias"
                    :key="categoria.id"
                    class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                  >
                    {{ categoria.nombre }}
                  </span>
                </div>
              </td>

              <!-- Publicada -->
              <td class="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600">
                {{ formatDate(uruguayDay(offer.fechaPublicacion)) }}
              </td>

              <!-- Cierra -->
              <td class="whitespace-nowrap px-5 py-3.5 text-sm">
                <span
                  :class="
                    offer.fechaCierre ? 'text-slate-600' : 'text-slate-400'
                  "
                >
                  {{ closingLabel(offer) }}
                </span>

                <p
                  v-if="closesToday(offer)"
                  class="text-xs font-medium text-amber-600"
                >
                  Cierra hoy
                </p>
              </td>

              <!-- Postulaciones -->
              <td
                class="px-5 py-3.5 text-center text-sm font-semibold tabular-nums text-slate-800"
                @click.stop
              >
                <RouterLink
                  v-if="offer._count.postulaciones > 0"
                  :to="{
                    name: 'postulaciones-recibidas',
                    query: { oferta: offer.id },
                  }"
                  class="rounded-md px-2 py-1 text-ccisj transition hover:bg-ccisj-light hover:underline"
                  :title="`Ver las postulaciones a ${offer.titulo}`"
                >
                  {{ offer._count.postulaciones }}
                </RouterLink>

                <span v-else class="text-slate-400">0</span>
              </td>

              <!-- Estado -->
              <td class="px-5 py-3.5">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="
                    offer.estado === 'ACTIVA'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-slate-100 text-slate-500'
                  "
                >
                  {{ offer.estado === 'ACTIVA' ? 'Activa' : 'Cerrada' }}
                </span>
              </td>

              <!-- Acciones -->
              <td class="px-5 py-3.5" @click.stop>
                <div class="flex items-center justify-center gap-1">
                  <button
                    type="button"
                    :class="[
                      iconButton,
                      'hover:bg-ccisj-light hover:text-ccisj',
                    ]"
                    title="Editar oferta"
                    :aria-label="`Editar ${offer.titulo}`"
                    @click="editOffer(offer)"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>

                  <button
                    v-if="offer.estado === 'ACTIVA'"
                    type="button"
                    :class="[
                      iconButton,
                      'hover:bg-amber-50 hover:text-amber-700',
                    ]"
                    title="Cerrar oferta"
                    :aria-label="`Cerrar ${offer.titulo}`"
                    @click="askClose(offer)"
                  >
                    <Lock class="h-4 w-4" />
                  </button>

                  <button
                    v-else
                    type="button"
                    :class="[
                      iconButton,
                      'hover:bg-ccisj-light hover:text-ccisj',
                    ]"
                    :title="
                      isExpired(offer)
                        ? 'Reabrir oferta (elegí una nueva fecha de cierre)'
                        : 'Reabrir oferta'
                    "
                    :aria-label="`Reabrir ${offer.titulo}`"
                    @click="askReopen(offer)"
                  >
                    <RotateCcw class="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    :class="[iconButton, 'hover:bg-red-50 hover:text-red-600']"
                    :disabled="offer._count.postulaciones > 0"
                    :title="
                      offer._count.postulaciones > 0
                        ? 'No se puede eliminar: ya recibió postulaciones. Podés cerrarla.'
                        : 'Eliminar oferta'
                    "
                    :aria-label="`Eliminar ${offer.titulo}`"
                    @click="askDelete(offer)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>

            <!-- Sin resultados para los filtros actuales -->
            <tr v-if="filteredOffers.length === 0">
              <td colspan="6" class="px-5 py-12 text-center">
                <p class="text-sm text-slate-500">
                  Ninguna oferta coincide con esos filtros.
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
        v-if="filteredOffers.length > 0"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500"
      >
        <span>
          Mostrando {{ rangeStart }}-{{ rangeEnd }} de
          {{ filteredOffers.length }}
          {{ filteredOffers.length === 1 ? 'oferta' : 'ofertas' }}
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

  <ConfirmModal
    :open="pending !== null"
    :title="modal.title"
    :message="modal.message"
    :confirm-text="modal.confirmText"
    :danger="pending?.type === 'eliminar'"
    :loading="processing"
    @cancel="cancelAction"
    @confirm="confirmAction"
  />
</template>
