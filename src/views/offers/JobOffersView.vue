<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import {
  Briefcase,
  Building2,
  CalendarClock,
  MapPin,
  Search,
  Users,
  X,
} from 'lucide-vue-next';

import { getOffers } from '@/services/offersService';

import { useToastStore } from '@/stores/toast';

import {
  OFFER_MODALITY_LABELS,
  type Offer,
  type OfferModality,
} from '@/types/offer.type';

import { formatDate, uruguayDay } from '@/utils/date';

const toast = useToastStore();

const offers = ref<Offer[]>([]);
const loading = ref(true);
const loadError = ref(false);

const search = ref('');
const categoryFilter = ref<number | 'TODAS'>('TODAS');
const modalityFilter = ref<OfferModality | 'TODAS'>('TODAS');

async function loadOffers() {
  try {
    loading.value = true;
    loadError.value = false;

    offers.value = await getOffers();
  } catch (err) {
    loadError.value = true;

    toast.error(
      err instanceof Error ? err.message : 'No se pudieron cargar las ofertas',
    );
  } finally {
    loading.value = false;
  }
}

onMounted(loadOffers);

// Solo las categorías que tienen alguna oferta abierta: filtrar por una vacía
// no mostraría nada.
const categories = computed(() => {
  const byId = new Map<number, string>();

  for (const offer of offers.value) {
    for (const { categoria } of offer.categorias) {
      byId.set(categoria.id, categoria.nombre);
    }
  }

  return [...byId]
    .map(([id, nombre]) => ({ id, nombre }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
});

const hasFilters = computed(
  () =>
    search.value.trim() !== '' ||
    categoryFilter.value !== 'TODAS' ||
    modalityFilter.value !== 'TODAS',
);

function clearFilters() {
  search.value = '';
  categoryFilter.value = 'TODAS';
  modalityFilter.value = 'TODAS';
}

const filteredOffers = computed(() => {
  const query = search.value.trim().toLowerCase();

  return offers.value.filter((offer) => {
    const matchesSearch =
      !query ||
      offer.titulo.toLowerCase().includes(query) ||
      offer.socio.razonSocial.toLowerCase().includes(query) ||
      offer.ubicacion?.toLowerCase().includes(query) ||
      offer.categorias.some(({ categoria }) =>
        categoria.nombre.toLowerCase().includes(query),
      );

    const matchesCategory =
      categoryFilter.value === 'TODAS' ||
      offer.categorias.some(
        ({ categoria }) => categoria.id === categoryFilter.value,
      );

    const matchesModality =
      modalityFilter.value === 'TODAS' ||
      offer.modalidad === modalityFilter.value;

    return matchesSearch && matchesCategory && matchesModality;
  });
});

function closesToday(offer: Offer) {
  return !!offer.fechaCierre && uruguayDay(offer.fechaCierre) === uruguayDay();
}

function closingLabel(offer: Offer) {
  if (!offer.fechaCierre) return null;
  if (closesToday(offer)) return 'Cierra hoy';

  return `Cierra el ${formatDate(uruguayDay(offer.fechaCierre))}`;
}

function publishedLabel(offer: Offer) {
  const today = uruguayDay();
  const published = uruguayDay(offer.fechaPublicacion);

  if (published === today) return 'Publicada hoy';

  const days = Math.round(
    (new Date(today).getTime() - new Date(published).getTime()) /
      (24 * 60 * 60 * 1000),
  );

  if (days === 1) return 'Publicada ayer';
  if (days < 7) return `Publicada hace ${days} días`;

  return `Publicada el ${formatDate(published)}`;
}

function details(offer: Offer) {
  return [
    offer.modalidad && OFFER_MODALITY_LABELS[offer.modalidad],
    offer.ubicacion,
  ]
    .filter(Boolean)
    .join(' · ');
}
</script>

<template>
  <div class="space-y-5">
    <!-- Encabezado -->
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Ofertas laborales</h1>

      <p class="mt-1 text-sm text-slate-500">
        Ofertas abiertas de las empresas socias del Centro Comercial.
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
          placeholder="Buscar por puesto, empresa, categoría o ubicación..."
          aria-label="Buscar ofertas"
          class="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <select
        v-model="categoryFilter"
        aria-label="Filtrar por categoría"
        class="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-ccisj"
      >
        <option value="TODAS">Todas las categorías</option>
        <option
          v-for="category in categories"
          :key="category.id"
          :value="category.id"
        >
          {{ category.nombre }}
        </option>
      </select>

      <select
        v-model="modalityFilter"
        aria-label="Filtrar por modalidad"
        class="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-ccisj"
      >
        <option value="TODAS">Todas las modalidades</option>
        <option
          v-for="(label, value) in OFFER_MODALITY_LABELS"
          :key="value"
          :value="value"
        >
          {{ label }}
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
      v-if="loading && offers.length === 0"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"
    >
      Cargando ofertas...
    </div>

    <!-- Error -->
    <div
      v-else-if="loadError && offers.length === 0"
      class="rounded-xl border border-slate-200 bg-white p-12 text-center"
    >
      <p class="text-sm font-medium text-slate-600">
        No se pudieron cargar las ofertas
      </p>

      <button
        type="button"
        class="mt-3 text-sm font-medium text-ccisj hover:underline"
        @click="loadOffers"
      >
        Intentar de nuevo
      </button>
    </div>

    <!-- Sin ofertas -->
    <div
      v-else-if="offers.length === 0"
      class="rounded-xl border border-slate-200 bg-white p-12 text-center"
    >
      <Briefcase class="mx-auto h-8 w-8 text-slate-300" />

      <p class="mt-3 text-sm font-medium text-slate-600">
        No hay ofertas abiertas en este momento
      </p>

      <p class="mt-1 text-sm text-slate-400">
        Volvé a revisar más adelante: las empresas publican ofertas nuevas
        seguido.
      </p>
    </div>

    <template v-else>
      <p class="text-sm text-slate-500">
        {{ filteredOffers.length }}
        {{
          filteredOffers.length === 1 ? 'oferta abierta' : 'ofertas abiertas'
        }}
      </p>

      <!-- Sin resultados para los filtros -->
      <div
        v-if="filteredOffers.length === 0"
        class="rounded-xl border border-slate-200 bg-white p-12 text-center"
      >
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
      </div>

      <!-- Listado -->
      <ul v-else class="grid gap-4 lg:grid-cols-2">
        <li v-for="offer in filteredOffers" :key="offer.id">
          <RouterLink
            :to="{ name: 'oferta-detalle', params: { id: offer.id } }"
            class="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 transition hover:border-ccisj hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
          >
            <div class="flex items-start justify-between gap-3">
              <h2 class="font-semibold text-slate-900">{{ offer.titulo }}</h2>

              <span
                v-if="closingLabel(offer)"
                class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium"
                :class="
                  closesToday(offer)
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-slate-100 text-slate-500'
                "
              >
                {{ closingLabel(offer) }}
              </span>
            </div>

            <p class="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
              <Building2 class="h-4 w-4 shrink-0 text-slate-400" />
              {{ offer.socio.razonSocial }}
            </p>

            <div
              class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"
            >
              <span v-if="details(offer)" class="flex items-center gap-1">
                <MapPin class="h-3.5 w-3.5" />
                {{ details(offer) }}
              </span>

              <span class="flex items-center gap-1">
                <Users class="h-3.5 w-3.5" />
                {{ offer.cantidadVacantes }}
                {{ offer.cantidadVacantes === 1 ? 'vacante' : 'vacantes' }}
              </span>

              <span class="flex items-center gap-1">
                <CalendarClock class="h-3.5 w-3.5" />
                {{ publishedLabel(offer) }}
              </span>
            </div>

            <p class="mt-3 line-clamp-2 text-sm text-slate-500">
              {{ offer.descripcion }}
            </p>

            <div
              v-if="offer.categorias.length"
              class="mt-auto flex flex-wrap gap-1 pt-3"
            >
              <span
                v-for="{ categoria } in offer.categorias"
                :key="categoria.id"
                class="rounded-full bg-ccisj-light px-2 py-0.5 text-[11px] font-medium text-ccisj-dark"
              >
                {{ categoria.nombre }}
              </span>
            </div>
          </RouterLink>
        </li>
      </ul>
    </template>
  </div>
</template>
