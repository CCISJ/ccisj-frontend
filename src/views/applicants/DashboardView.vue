<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { RouterLink, useRouter } from 'vue-router';

import { storeToRefs } from 'pinia';

import {
  Briefcase,
  ChevronRight,
  FileUser,
  MapPin,
  RefreshCw,
  Search,
} from 'lucide-vue-next';

import ApplicationStatusBadge from '@/components/ApplicationStatusBadge.vue';

import { getMyApplications } from '@/services/applicationsService';
import { cvProgress, getMyCv } from '@/services/cvService';
import { getOffers } from '@/services/offersService';

import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';

import type { OwnApplication } from '@/types/application.type';
import { OFFER_MODALITY_LABELS, type Offer } from '@/types/offer.type';

import { formatDate } from '@/utils/date';

const router = useRouter();
const auth = useAuthStore();
const notificationsStore = useNotificationsStore();

const { notifications } = storeToRefs(notificationsStore);

const applications = ref<OwnApplication[]>([]);
const offers = ref<Offer[]>([]);
// null mientras carga o si falló: en ese caso el aviso del CV no se muestra.
const cvPercent = ref<number | null>(null);
// Rubros elegidos (vacío = todos): "Ofertas recientes" muestra esos primero.
const preferredIds = ref<number[]>([]);

// Cada bloque carga por separado: si falla uno, el resto del Inicio se ve.
const loading = ref(true);
const failed = ref({
  applications: false,
  offers: false,
  notifications: false,
});

async function load() {
  loading.value = true;

  const [applicationsResult, offersResult, notificationsResult, cvResult] =
    await Promise.allSettled([
      getMyApplications(),
      getOffers(),
      notificationsStore.fetchMine(),
      getMyCv(),
    ]);

  cvPercent.value =
    cvResult.status === 'fulfilled' ? cvProgress(cvResult.value) : null;
  preferredIds.value =
    cvResult.status === 'fulfilled'
      ? cvResult.value.categorias.map(({ categoria }) => categoria.id)
      : [];

  if (applicationsResult.status === 'fulfilled') {
    applications.value = applicationsResult.value;
  }
  if (offersResult.status === 'fulfilled') offers.value = offersResult.value;

  failed.value = {
    applications: applicationsResult.status === 'rejected',
    offers: offersResult.status === 'rejected',
    notifications: notificationsResult.status === 'rejected',
  };

  loading.value = false;
}

onMounted(load);

const hasErrors = computed(() => Object.values(failed.value).some(Boolean));

/** El nombre de pila, para el saludo. */
const firstName = computed(
  () => auth.user?.displayName?.trim().split(/\s+/)[0] ?? '',
);

// Resumen

/** "1 postulación" / "3 postulaciones"; vacío si todavía no tiene. */
const summary = computed(() => {
  const total = applications.value.length;

  if (total === 0) return '';

  return `${total} ${total === 1 ? 'postulación' : 'postulaciones'}`;
});

// Listados

const latestApplications = computed(() => applications.value.slice(0, 5));

const appliedOfferIds = computed(
  () => new Set(applications.value.map((item) => item.oferta.id)),
);

/** Las más nuevas primero; el backend ya manda solo las abiertas. */
const latestOffers = computed(() =>
  offers.value
    .filter(
      (offer) =>
        preferredIds.value.length === 0 ||
        offer.categorias.some(({ categoria }) =>
          preferredIds.value.includes(categoria.id),
        ),
    )
    .sort((a, b) => b.fechaPublicacion.localeCompare(a.fechaPublicacion))
    .slice(0, 4),
);

function offerDetails(offer: Offer) {
  return [
    offer.socio.razonSocial,
    offer.modalidad ? OFFER_MODALITY_LABELS[offer.modalidad] : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

const latestNotifications = computed(() => notifications.value.slice(0, 4));

const card = 'rounded-xl border border-slate-200 bg-white';
const cardHeader =
  'flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5';
const cardTitle = 'text-sm font-semibold text-slate-800';
const cardLink = 'text-xs font-medium text-ccisj hover:underline';
</script>

<template>
  <div class="space-y-5">
    <!-- Encabezado -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="truncate text-2xl font-bold text-slate-900">
          {{ firstName ? `Hola, ${firstName}` : 'Inicio' }}
        </h1>

        <p class="mt-1 text-sm text-slate-500">
          Seguí tus postulaciones y encontrá nuevas oportunidades.
        </p>
      </div>

      <button
        type="button"
        class="flex items-center gap-2 rounded-xl bg-ccisj px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        @click="router.push({ name: 'ofertas' })"
      >
        <Search class="h-4 w-4" />
        Buscar ofertas
      </button>
    </div>

    <div
      v-if="!loading && hasErrors"
      class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <p class="text-sm text-amber-800">
        No se pudo cargar parte de la información.
      </p>

      <button
        type="button"
        class="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
        @click="load"
      >
        <RefreshCw class="h-4 w-4" />
        Reintentar
      </button>
    </div>

    <!-- Mi CV -->
    <RouterLink
      v-if="cvPercent !== null"
      :to="{ name: 'mi-cv' }"
      class="flex items-center gap-4 rounded-xl border px-5 py-4 transition"
      :class="
        cvPercent < 100
          ? 'border-amber-200 bg-amber-50 hover:bg-amber-100'
          : 'border-slate-200 bg-white hover:bg-slate-50'
      "
    >
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        :class="cvPercent < 100 ? 'bg-amber-100 text-amber-700' : 'bg-ccisj-light text-ccisj'"
      >
        <FileUser class="h-5 w-5" />
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-slate-900">
          {{ cvPercent < 100 ? 'Completá tu CV' : 'Mi CV' }}
        </p>

        <p class="text-xs text-slate-500">
          {{
            cvPercent < 100
              ? `Está completo al ${cvPercent}%. Las empresas lo ven cuando te postulás.`
              : 'Tu CV está completo. Podés actualizarlo cuando quieras.'
          }}
        </p>

        <div
          v-if="cvPercent < 100"
          class="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-amber-100"
        >
          <div
            class="h-full rounded-full bg-amber-500"
            :style="{ width: `${cvPercent}%` }"
          />
        </div>
      </div>

      <span
        class="shrink-0 rounded-lg bg-ccisj px-3 py-1.5 text-xs font-semibold text-white"
      >
        {{ cvPercent < 100 ? 'Completar' : 'Ver mi CV' }}
      </span>
    </RouterLink>

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <!-- Mis postulaciones -->
      <section :class="[card, 'lg:col-span-2']">
        <div :class="cardHeader">
          <h2 :class="cardTitle">Mis últimas postulaciones</h2>

          <div class="flex min-w-0 items-center gap-4">
            <span
              v-if="!loading && !failed.applications && summary"
              class="hidden truncate text-xs text-slate-400 sm:inline"
            >
              {{ summary }}
            </span>

            <RouterLink
              :to="{ name: 'mis-postulaciones' }"
              :class="[cardLink, 'shrink-0']"
            >
              Ver todas
            </RouterLink>
          </div>
        </div>

        <p v-if="loading" class="px-5 py-8 text-center text-sm text-slate-400">
          Cargando...
        </p>

        <p
          v-else-if="failed.applications"
          class="px-5 py-8 text-center text-sm text-slate-400"
        >
          No se pudieron cargar tus postulaciones.
        </p>

        <div
          v-else-if="latestApplications.length === 0"
          class="px-5 py-8 text-center"
        >
          <p class="text-sm text-slate-400">
            Todavía no te postulaste a ninguna oferta.
          </p>

          <RouterLink
            :to="{ name: 'ofertas' }"
            class="mt-2 inline-flex text-sm font-medium text-ccisj hover:underline"
          >
            Ver ofertas disponibles
          </RouterLink>
        </div>

        <ul v-else class="divide-y divide-slate-100">
          <li v-for="item in latestApplications" :key="item.id">
            <component
              :is="item.oferta.estado === 'ACTIVA' ? RouterLink : 'div'"
              :to="
                item.oferta.estado === 'ACTIVA'
                  ? { name: 'oferta-detalle', params: { id: item.oferta.id } }
                  : undefined
              "
              class="flex items-center gap-3 px-5 py-3"
              :class="{
                'transition hover:bg-slate-50': item.oferta.estado === 'ACTIVA',
              }"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-slate-900">
                  {{ item.oferta.titulo }}
                </p>

                <p class="truncate text-xs text-slate-400">
                  {{ item.oferta.socio.razonSocial }} · Te postulaste el
                  {{ formatDate(item.fechaPostulacion) }}
                  <template v-if="item.oferta.estado === 'CERRADA'">
                    · Oferta cerrada
                  </template>
                </p>
              </div>

              <ApplicationStatusBadge :status="item.estado" applicant />

              <ChevronRight
                v-if="item.oferta.estado === 'ACTIVA'"
                class="h-4 w-4 shrink-0 text-slate-300"
              />
            </component>
          </li>
        </ul>
      </section>

      <!-- Novedades -->
      <section :class="[card, 'lg:row-span-2']">
        <div :class="cardHeader">
          <h2 :class="cardTitle">Novedades</h2>

          <RouterLink :to="{ name: 'notificaciones' }" :class="cardLink">
            Ver todas
          </RouterLink>
        </div>

        <p v-if="loading" class="px-5 py-8 text-center text-sm text-slate-400">
          Cargando...
        </p>

        <p
          v-else-if="failed.notifications"
          class="px-5 py-8 text-center text-sm text-slate-400"
        >
          No se pudieron cargar las novedades.
        </p>

        <p
          v-else-if="latestNotifications.length === 0"
          class="px-5 py-8 text-center text-sm text-slate-400"
        >
          No tenés novedades.
        </p>

        <ul v-else class="divide-y divide-slate-100">
          <li
            v-for="item in latestNotifications"
            :key="item.id"
            class="px-5 py-3"
          >
            <div class="flex items-baseline justify-between gap-2">
              <p
                class="truncate text-sm text-slate-800"
                :class="{ 'font-semibold': !item.leida }"
              >
                {{ item.notificacion.titulo }}
              </p>

              <span class="shrink-0 text-xs text-slate-400">
                {{ formatDate(item.notificacion.fechaCreacion) }}
              </span>
            </div>

            <p class="mt-0.5 line-clamp-2 text-xs text-slate-500">
              {{ item.notificacion.mensaje }}
            </p>
          </li>
        </ul>
      </section>

      <!-- Ofertas recientes -->
      <section :class="[card, 'lg:col-span-2']">
        <div :class="cardHeader">
          <h2 :class="cardTitle">Ofertas recientes</h2>

          <RouterLink :to="{ name: 'ofertas' }" :class="cardLink">
            Ver todas
          </RouterLink>
        </div>

        <p v-if="loading" class="px-5 py-8 text-center text-sm text-slate-400">
          Cargando...
        </p>

        <p
          v-else-if="failed.offers"
          class="px-5 py-8 text-center text-sm text-slate-400"
        >
          No se pudieron cargar las ofertas.
        </p>

        <p
          v-else-if="latestOffers.length === 0"
          class="px-5 py-8 text-center text-sm text-slate-400"
        >
          No hay ofertas abiertas en este momento.
        </p>

        <ul v-else class="divide-y divide-slate-100">
          <li v-for="offer in latestOffers" :key="offer.id">
            <RouterLink
              :to="{ name: 'oferta-detalle', params: { id: offer.id } }"
              class="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50"
            >
              <Briefcase class="h-4 w-4 shrink-0 text-slate-400" />

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-slate-900">
                  {{ offer.titulo }}
                </p>

                <p
                  class="flex items-center gap-1 truncate text-xs text-slate-400"
                >
                  {{ offerDetails(offer) }}
                  <template v-if="offer.ubicacion">
                    · <MapPin class="h-3 w-3 shrink-0" />
                    {{ offer.ubicacion }}
                  </template>
                </p>
              </div>

              <span
                v-if="appliedOfferIds.has(offer.id)"
                class="shrink-0 rounded-full bg-ccisj-light px-2.5 py-1 text-xs font-medium text-ccisj"
              >
                Ya te postulaste
              </span>

              <ChevronRight v-else class="h-4 w-4 shrink-0 text-slate-300" />
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
