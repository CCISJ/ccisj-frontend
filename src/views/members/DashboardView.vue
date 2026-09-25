<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import { useRouter } from 'vue-router';

import { storeToRefs } from 'pinia';

import {
  Briefcase,
  Building2,
  ChevronRight,
  KeyRound,
  Plus,
  RefreshCw,
  Users,
} from 'lucide-vue-next';

import ApplicationStatusBadge from '@/components/ApplicationStatusBadge.vue';

import { getReceivedApplications } from '@/services/applicationsService';
import { getMyCompany } from '@/services/membersService';
import { getMyOffers } from '@/services/offersService';

import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';

import type { ReceivedApplication } from '@/types/application.type';
import type { OwnMember } from '@/types/member.type';
import type { OwnOffer } from '@/types/offer.type';

import { formatDate, uruguayDay } from '@/utils/date';

const router = useRouter();
const auth = useAuthStore();
const notificationsStore = useNotificationsStore();

const { notifications } = storeToRefs(notificationsStore);

const company = ref<OwnMember | null>(null);
const offers = ref<OwnOffer[]>([]);
const applications = ref<ReceivedApplication[]>([]);

// Cada bloque carga por separado: si falla uno, el resto del Inicio se ve.
const loading = ref(true);
const failed = ref({
  company: false,
  offers: false,
  applications: false,
  notifications: false,
});

async function load() {
  loading.value = true;

  const [companyResult, offersResult, applicationsResult, notificationsResult] =
    await Promise.allSettled([
      getMyCompany(),
      getMyOffers(),
      getReceivedApplications(),
      notificationsStore.fetchMine(),
    ]);

  if (companyResult.status === 'fulfilled') company.value = companyResult.value;
  if (offersResult.status === 'fulfilled') offers.value = offersResult.value;
  if (applicationsResult.status === 'fulfilled') {
    applications.value = applicationsResult.value;
  }

  failed.value = {
    company: companyResult.status === 'rejected',
    offers: offersResult.status === 'rejected',
    applications: applicationsResult.status === 'rejected',
    notifications: notificationsResult.status === 'rejected',
  };

  loading.value = false;
}

onMounted(load);

const hasErrors = computed(() => Object.values(failed.value).some(Boolean));

const subtitle = computed(() => {
  if (!company.value) return '';

  const condition =
    company.value.tipo === 'DIRECTIVO' ? 'Socio directivo' : 'Socio';

  return `${condition} · Afiliada desde el ${formatDate(company.value.fechaAfiliacion)}`;
});

// Cifras

const DAY_MS = 24 * 60 * 60 * 1000;

const activeOffers = computed(() =>
  offers.value.filter((offer) => offer.estado === 'ACTIVA'),
);

const newApplications = computed(
  () => applications.value.filter((item) => item.estado === 'ENVIADA').length,
);

const applicationsLast30Days = computed(() => {
  const since = Date.now() - 30 * DAY_MS;

  return applications.value.filter(
    (item) => new Date(item.fechaPostulacion).getTime() >= since,
  ).length;
});

/** Días que faltan para el cierre, contando en días de Uruguay (hoy = 0). */
function daysUntilClosing(offer: OwnOffer) {
  if (!offer.fechaCierre) return null;

  const closing = new Date(`${uruguayDay(offer.fechaCierre)}T00:00:00Z`);
  const today = new Date(`${uruguayDay()}T00:00:00Z`);

  return Math.round((closing.getTime() - today.getTime()) / DAY_MS);
}

const closingSoon = computed(
  () =>
    activeOffers.value.filter((offer) => {
      const days = daysUntilClosing(offer);

      return days !== null && days >= 0 && days <= 7;
    }).length,
);

// Listados

const latestApplications = computed(() => applications.value.slice(0, 5));

/** Activas, primero las que cierran antes; las sin fecha, al final. */
const upcomingOffers = computed(() =>
  [...activeOffers.value]
    .sort((a, b) => {
      if (a.fechaCierre && b.fechaCierre) {
        return a.fechaCierre.localeCompare(b.fechaCierre);
      }

      if (a.fechaCierre) return -1;
      if (b.fechaCierre) return 1;

      return b.fechaPublicacion.localeCompare(a.fechaPublicacion);
    })
    .slice(0, 5),
);

function closingLabel(offer: OwnOffer) {
  const days = daysUntilClosing(offer);

  if (days === null) return 'Sin fecha de cierre';
  if (days === 0) return 'Cierra hoy';
  if (days === 1) return 'Cierra mañana';

  return `Cierra el ${formatDate(uruguayDay(offer.fechaCierre!))}`;
}

const latestNotifications = computed(() => notifications.value.slice(0, 4));

/** Accesos que existen para esta cuenta; los que no tienen ruta no se ofrecen. */
const shortcuts = computed(() => {
  const items = [
    {
      label: 'Mi empresa',
      description: 'Datos de contacto y número de BPS',
      icon: Building2,
      to: '/mi-empresa',
    },
    {
      label: 'Mi cuenta',
      description: 'Cambiar la contraseña',
      icon: KeyRound,
      to: '/mi-cuenta',
    },
  ];

  if (auth.user?.memberType === 'DIRECTIVO') {
    items.push({
      label: 'Directorio de socios',
      description: 'Contacto de las empresas socias',
      icon: Users,
      to: '/socios',
    });
  }

  return items.filter((item) => {
    const resolved = router.resolve(item.to);

    return resolved.matched.length > 0 && resolved.name !== 'not-found';
  });
});

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
          {{ company?.razonSocial ?? auth.user?.displayName ?? 'Inicio' }}
        </h1>

        <p v-if="subtitle" class="mt-1 text-sm text-slate-500">
          {{ subtitle }}
        </p>
      </div>

      <button
        type="button"
        class="flex items-center gap-2 rounded-xl bg-ccisj px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        @click="router.push({ name: 'mis-ofertas-nueva' })"
      >
        <Plus class="h-4 w-4" />
        Publicar oferta
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

    <!-- Cifras -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <RouterLink
        :to="{ name: 'mis-ofertas' }"
        :class="[card, 'p-4 transition hover:border-ccisj']"
      >
        <p class="text-xs font-medium text-slate-500">Ofertas activas</p>

        <p class="mt-1 text-2xl font-bold tabular-nums text-slate-900">
          {{ loading || failed.offers ? '—' : activeOffers.length }}
        </p>

        <p class="mt-0.5 text-xs text-slate-400">
          <template v-if="!loading && !failed.offers">
            de {{ offers.length }}
            {{ offers.length === 1 ? 'publicada' : 'publicadas' }}
          </template>
        </p>
      </RouterLink>

      <RouterLink
        :to="{ name: 'postulaciones-recibidas', query: { estado: 'ENVIADA' } }"
        :class="[card, 'p-4 transition hover:border-ccisj']"
      >
        <p class="text-xs font-medium text-slate-500">Postulaciones nuevas</p>

        <p
          class="mt-1 text-2xl font-bold tabular-nums"
          :class="newApplications > 0 ? 'text-ccisj' : 'text-slate-900'"
        >
          {{ loading || failed.applications ? '—' : newApplications }}
        </p>

        <p class="mt-0.5 text-xs text-slate-400">Sin revisar</p>
      </RouterLink>

      <RouterLink
        :to="{ name: 'postulaciones-recibidas' }"
        :class="[card, 'p-4 transition hover:border-ccisj']"
      >
        <p class="text-xs font-medium text-slate-500">
          Postulaciones recibidas
        </p>

        <p class="mt-1 text-2xl font-bold tabular-nums text-slate-900">
          {{ loading || failed.applications ? '—' : applications.length }}
        </p>

        <p class="mt-0.5 text-xs text-slate-400">
          <template v-if="!loading && !failed.applications">
            {{ applicationsLast30Days }} en los últimos 30 días
          </template>
        </p>
      </RouterLink>

      <RouterLink
        :to="{ name: 'mis-ofertas' }"
        :class="[card, 'p-4 transition hover:border-ccisj']"
      >
        <p class="text-xs font-medium text-slate-500">Cierran esta semana</p>

        <p
          class="mt-1 text-2xl font-bold tabular-nums"
          :class="closingSoon > 0 ? 'text-amber-600' : 'text-slate-900'"
        >
          {{ loading || failed.offers ? '—' : closingSoon }}
        </p>

        <p class="mt-0.5 text-xs text-slate-400">En los próximos 7 días</p>
      </RouterLink>
    </div>

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <!-- Últimas postulaciones -->
      <section :class="[card, 'lg:col-span-2']">
        <div :class="cardHeader">
          <h2 :class="cardTitle">Últimas postulaciones</h2>

          <RouterLink
            :to="{ name: 'postulaciones-recibidas' }"
            :class="cardLink"
          >
            Ver todas
          </RouterLink>
        </div>

        <p v-if="loading" class="px-5 py-8 text-center text-sm text-slate-400">
          Cargando...
        </p>

        <p
          v-else-if="failed.applications"
          class="px-5 py-8 text-center text-sm text-slate-400"
        >
          No se pudieron cargar las postulaciones.
        </p>

        <p
          v-else-if="latestApplications.length === 0"
          class="px-5 py-8 text-center text-sm text-slate-400"
        >
          Todavía no recibiste postulaciones.
        </p>

        <ul v-else class="divide-y divide-slate-100">
          <li v-for="item in latestApplications" :key="item.id">
            <RouterLink
              :to="{
                name: 'postulaciones-recibidas',
                query: { postulacion: item.id },
              }"
              class="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50"
            >
              <div class="min-w-0 flex-1">
                <p
                  class="truncate text-sm text-slate-900"
                  :class="
                    item.estado === 'ENVIADA' ? 'font-semibold' : 'font-medium'
                  "
                >
                  {{ item.postulante.nombre }} {{ item.postulante.apellido }}
                </p>

                <p class="truncate text-xs text-slate-400">
                  {{ item.oferta.titulo }} ·
                  {{ formatDate(item.fechaPostulacion) }}
                </p>
              </div>

              <ApplicationStatusBadge :status="item.estado" />

              <ChevronRight class="h-4 w-4 shrink-0 text-slate-300" />
            </RouterLink>
          </li>
        </ul>
      </section>

      <!-- Novedades -->
      <section :class="card">
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

      <!-- Ofertas activas -->
      <section :class="[card, 'lg:col-span-2']">
        <div :class="cardHeader">
          <h2 :class="cardTitle">Ofertas activas</h2>

          <RouterLink :to="{ name: 'mis-ofertas' }" :class="cardLink">
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

        <div
          v-else-if="upcomingOffers.length === 0"
          class="px-5 py-8 text-center"
        >
          <p class="text-sm text-slate-400">No tenés ofertas activas.</p>

          <RouterLink
            :to="{ name: 'mis-ofertas-nueva' }"
            class="mt-2 inline-flex text-sm font-medium text-ccisj hover:underline"
          >
            Publicar una oferta
          </RouterLink>
        </div>

        <ul v-else class="divide-y divide-slate-100">
          <li v-for="offer in upcomingOffers" :key="offer.id">
            <RouterLink
              :to="{ name: 'mis-ofertas-editar', params: { id: offer.id } }"
              class="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50"
            >
              <Briefcase class="h-4 w-4 shrink-0 text-slate-400" />

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-slate-900">
                  {{ offer.titulo }}
                </p>

                <p
                  class="text-xs"
                  :class="
                    (daysUntilClosing(offer) ?? 99) <= 1
                      ? 'font-medium text-amber-600'
                      : 'text-slate-400'
                  "
                >
                  {{ closingLabel(offer) }}
                </p>
              </div>

              <span
                class="shrink-0 text-xs tabular-nums text-slate-500"
                :title="`${offer._count.postulaciones} postulaciones`"
              >
                {{ offer._count.postulaciones }}
                {{
                  offer._count.postulaciones === 1
                    ? 'postulación'
                    : 'postulaciones'
                }}
              </span>
            </RouterLink>
          </li>
        </ul>
      </section>

      <!-- Accesos -->
      <section :class="card">
        <div :class="cardHeader">
          <h2 :class="cardTitle">Accesos</h2>
        </div>

        <ul class="divide-y divide-slate-100">
          <li v-for="shortcut in shortcuts" :key="shortcut.to">
            <RouterLink
              :to="shortcut.to"
              class="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50"
            >
              <span
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ccisj-light text-ccisj"
              >
                <component :is="shortcut.icon" class="h-4 w-4" />
              </span>

              <span class="min-w-0 flex-1">
                <span class="block text-sm font-medium text-slate-800">
                  {{ shortcut.label }}
                </span>

                <span class="block text-xs text-slate-400">
                  {{ shortcut.description }}
                </span>
              </span>

              <ChevronRight class="h-4 w-4 shrink-0 text-slate-300" />
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
