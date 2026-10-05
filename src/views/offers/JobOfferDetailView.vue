<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useRoute } from 'vue-router';

import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CalendarX,
  Laptop,
  MapPin,
  Send,
  UserPlus,
  Users,
} from 'lucide-vue-next';

import { getOffer } from '@/services/offersService';

import { useAuthStore } from '@/stores/auth';

import { OFFER_MODALITY_LABELS, type Offer } from '@/types/offer.type';

import { formatDate, uruguayDay } from '@/utils/date';

const route = useRoute();
const auth = useAuthStore();

const offer = ref<Offer | null>(null);
const loading = ref(true);
const error = ref('');

async function loadOffer(id: number) {
  try {
    loading.value = true;
    error.value = '';
    offer.value = null;

    offer.value = await getOffer(id);
  } catch (err) {
    // Para el postulante, una oferta cerrada responde "no encontrada".
    error.value =
      err instanceof Error && err.message === 'Oferta no encontrada'
        ? 'Esta oferta ya no está disponible. Puede que se haya cerrado.'
        : err instanceof Error
          ? err.message
          : 'No se pudo cargar la oferta';
  } finally {
    loading.value = false;
  }
}

watch(
  () => Number(route.params.id),
  (id) => loadOffer(id),
  { immediate: true },
);

const closesToday = computed(
  () =>
    !!offer.value?.fechaCierre &&
    uruguayDay(offer.value.fechaCierre) === uruguayDay(),
);

const closingLabel = computed(() => {
  if (!offer.value?.fechaCierre) return 'Sin fecha de cierre';
  if (closesToday.value) return 'Cierra hoy';

  return `Cierra el ${formatDate(uruguayDay(offer.value.fechaCierre))}`;
});
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-5">
    <RouterLink
      :to="{ name: 'ofertas' }"
      class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
    >
      <ArrowLeft class="h-4 w-4" />
      Volver a ofertas laborales
    </RouterLink>

    <!-- Cargando -->
    <div
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"
    >
      Cargando oferta...
    </div>

    <!-- Error / no disponible -->
    <div
      v-else-if="error || !offer"
      class="rounded-xl border border-slate-200 bg-white p-12 text-center"
    >
      <p class="text-sm font-medium text-slate-600">{{ error }}</p>

      <RouterLink
        :to="{ name: 'ofertas' }"
        class="mt-3 inline-block text-sm font-medium text-ccisj hover:underline"
      >
        Ver las ofertas abiertas
      </RouterLink>
    </div>

    <article
      v-else
      class="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <!-- Encabezado -->
      <header class="border-b border-slate-100 p-6">
        <h1 class="text-2xl font-bold text-slate-900">{{ offer.titulo }}</h1>

        <p class="mt-2 flex items-center gap-1.5 text-slate-600">
          <Building2 class="h-4 w-4 shrink-0 text-slate-400" />
          <span class="font-medium">{{ offer.socio.razonSocial }}</span>
          <span class="text-slate-400">· {{ offer.socio.giroComercial }}</span>
        </p>

        <div class="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
          <span class="flex items-center gap-1.5">
            <MapPin class="h-4 w-4 text-slate-400" />
            {{ offer.ubicacion || offer.socio.ciudad }}
          </span>

          <span v-if="offer.modalidad" class="flex items-center gap-1.5">
            <Laptop class="h-4 w-4 text-slate-400" />
            {{ OFFER_MODALITY_LABELS[offer.modalidad] }}
          </span>

          <span class="flex items-center gap-1.5">
            <Users class="h-4 w-4 text-slate-400" />
            {{ offer.cantidadVacantes }}
            {{ offer.cantidadVacantes === 1 ? 'vacante' : 'vacantes' }}
          </span>

          <span class="flex items-center gap-1.5">
            <CalendarClock class="h-4 w-4 text-slate-400" />
            Publicada el {{ formatDate(uruguayDay(offer.fechaPublicacion)) }}
          </span>

          <span
            class="flex items-center gap-1.5"
            :class="closesToday ? 'font-medium text-amber-700' : ''"
          >
            <CalendarX
              class="h-4 w-4"
              :class="closesToday ? 'text-amber-600' : 'text-slate-400'"
            />
            {{ closingLabel }}
          </span>
        </div>

        <div v-if="offer.categorias.length" class="mt-4 flex flex-wrap gap-1.5">
          <span
            v-for="{ categoria } in offer.categorias"
            :key="categoria.id"
            class="rounded-full bg-ccisj-light px-2.5 py-0.5 text-xs font-medium text-ccisj-dark"
          >
            {{ categoria.nombre }}
          </span>
        </div>
      </header>

      <!-- Descripción -->
      <section class="p-6">
        <h2
          class="text-xs font-semibold uppercase tracking-wide text-slate-500"
        >
          Descripción del puesto
        </h2>

        <p
          class="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700"
        >
          {{ offer.descripcion }}
        </p>
      </section>

      <!--
        Sin sesión se invita a entrar o a crear la cuenta, llevando `volver`
        para no perder la oferta que estaba mirando. Con sesión el botón sigue
        deshabilitado hasta que la postulación esté conectada.
      -->
      <footer
        class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4"
      >
        <template v-if="!auth.isAuthenticated">
          <p class="text-sm text-slate-500">
            Para postularte necesitás una cuenta. Es gratis y lleva un minuto.
          </p>

          <div class="flex items-center gap-2">
            <RouterLink
              :to="{ name: 'login', query: { volver: route.fullPath } }"
              class="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200 hover:text-slate-800"
            >
              Ya tengo cuenta
            </RouterLink>

            <RouterLink
              :to="{ name: 'registro', query: { volver: route.fullPath } }"
              class="flex items-center gap-2 rounded-xl bg-ccisj px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ccisj-dark"
            >
              <UserPlus class="h-4 w-4" />
              Crear cuenta para postularme
            </RouterLink>
          </div>
        </template>

        <template v-else>
          <p class="text-sm text-slate-500">
            Muy pronto vas a poder postularte desde acá.
          </p>

          <button
            type="button"
            disabled
            title="Próximamente"
            class="flex cursor-not-allowed items-center gap-2 rounded-xl bg-ccisj px-5 py-2.5 text-sm font-semibold text-white opacity-50"
          >
            <Send class="h-4 w-4" />
            Postularme
          </button>
        </template>
      </footer>
    </article>
  </div>
</template>
