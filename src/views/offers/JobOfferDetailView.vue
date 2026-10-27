<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useRoute } from 'vue-router';

import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  FileText,
  Laptop,
  LoaderCircle,
  MapPin,
  Send,
  UserPlus,
  Users,
} from 'lucide-vue-next';

import {
  applyToOffer,
  getMyApplications,
} from '@/services/applicationsService';
import { cvProgress, getMyCv } from '@/services/cvService';
import { getOffer } from '@/services/offersService';

import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

import type { Cv } from '@/types/cv.type';
import { OFFER_MODALITY_LABELS, type Offer } from '@/types/offer.type';

import { formatDate, uruguayDay } from '@/utils/date';

const route = useRoute();
const auth = useAuthStore();
const toast = useToastStore();

const isApplicant = computed(() => auth.user?.role === 'POSTULANTE');

// Postulación: el postulante elige a mano qué PDF manda (o ninguno).
const cv = ref<Cv | null>(null);
const alreadyApplied = ref(false);
const message = ref('');
// 'NINGUNO' = solo el CV del formulario; '' = todavía no eligió.
const selectedCv = ref<number | 'NINGUNO' | ''>('');
const applying = ref(false);

const hasFormCv = computed(
  () =>
    !!cv.value &&
    (cv.value.estudios.length > 0 || cv.value.experiencias.length > 0),
);

/** Lo mismo que exige el backend: un PDF o el formulario con algo. */
const canApply = computed(
  () => !!cv.value && (cv.value.cvs.length > 0 || hasFormCv.value),
);

async function loadApplicantData(offerId: number) {
  if (!isApplicant.value) return;

  try {
    const [myCv, applications] = await Promise.all([
      getMyCv(),
      getMyApplications(),
    ]);

    cv.value = myCv;
    alreadyApplied.value = applications.some(
      (item) => item.oferta.id === offerId,
    );
    // Sin PDF no hay nada que elegir: va el formulario.
    selectedCv.value = myCv.cvs.length === 0 ? 'NINGUNO' : '';
  } catch {
    cv.value = null;
  }
}

async function apply() {
  if (!offer.value || applying.value) return;

  if (selectedCv.value === '') {
    toast.error('Elegí qué CV querés enviar.');
    return;
  }

  applying.value = true;

  try {
    await applyToOffer({
      ofertaId: offer.value.id,
      observaciones: message.value.trim() || undefined,
      cvId: selectedCv.value === 'NINGUNO' ? null : selectedCv.value,
    });

    alreadyApplied.value = true;
    toast.success('¡Listo! Te postulaste a esta oferta.');
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'No se pudo enviar la postulación',
    );
  } finally {
    applying.value = false;
  }
}

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
  (id) => {
    void loadOffer(id);
    void loadApplicantData(id);
  },
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
        para no perder la oferta que estaba mirando. El postulante elige a mano
        qué PDF manda (o ninguno, si completó el CV en el portal).
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

        <!-- Socios y administración no se postulan -->
        <p v-else-if="!isApplicant" class="text-sm text-slate-500">
          Solo las cuentas de postulante pueden postularse a las ofertas.
        </p>

        <!-- Ya se postuló -->
        <div
          v-else-if="alreadyApplied"
          class="flex w-full flex-wrap items-center justify-between gap-3"
        >
          <p class="flex items-center gap-2 text-sm font-medium text-ccisj">
            <CheckCircle2 class="h-4 w-4" />
            Ya te postulaste a esta oferta.
          </p>

          <RouterLink
            :to="{ name: 'mis-postulaciones' }"
            class="text-sm font-medium text-ccisj hover:underline"
          >
            Ver mis postulaciones
          </RouterLink>
        </div>

        <!-- Sin CV todavía -->
        <div
          v-else-if="cv && !canApply"
          class="flex w-full flex-wrap items-center justify-between gap-3"
        >
          <p class="text-sm text-slate-600">
            Para postularte, completá tu CV o subí uno en PDF.
          </p>

          <RouterLink
            :to="{ name: 'mi-cv' }"
            class="rounded-xl bg-ccisj px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ccisj-dark"
          >
            Completar mi CV
          </RouterLink>
        </div>

        <!-- Formulario de postulación -->
        <form v-else-if="cv" class="w-full space-y-4" @submit.prevent="apply">
          <fieldset v-if="cv.cvs.length > 0">
            <legend class="mb-2 text-sm font-medium text-slate-700">
              ¿Qué CV querés enviar?
            </legend>

            <div class="space-y-2">
              <label
                v-for="file in cv.cvs"
                :key="file.id"
                class="flex cursor-pointer items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-sm transition"
                :class="
                  selectedCv === file.id
                    ? 'border-ccisj bg-ccisj-light'
                    : 'border-slate-200 hover:border-slate-300'
                "
              >
                <input
                  v-model="selectedCv"
                  type="radio"
                  name="cv"
                  :value="file.id"
                  class="accent-ccisj"
                />
                <FileText class="h-4 w-4 shrink-0 text-slate-400" />
                <span class="truncate text-slate-700">
                  {{ file.nombreArchivo ?? 'CV' }}
                </span>
              </label>

              <label
                v-if="hasFormCv"
                class="flex cursor-pointer items-center gap-3 rounded-lg border bg-white px-3 py-2.5 text-sm transition"
                :class="
                  selectedCv === 'NINGUNO'
                    ? 'border-ccisj bg-ccisj-light'
                    : 'border-slate-200 hover:border-slate-300'
                "
              >
                <input
                  v-model="selectedCv"
                  type="radio"
                  name="cv"
                  value="NINGUNO"
                  class="accent-ccisj"
                />
                <span class="text-slate-700">
                  No adjuntar PDF (solo mi CV cargado en el portal)
                </span>
              </label>
            </div>
          </fieldset>

          <p v-else class="text-sm text-slate-500">
            Se enviará el CV que completaste en el portal ({{ cvProgress(cv) }}%
            completo).
          </p>

          <div>
            <label
              for="mensaje"
              class="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Mensaje para la empresa
              <span class="font-normal text-slate-400">(opcional)</span>
            </label>

            <textarea
              id="mensaje"
              v-model="message"
              rows="3"
              maxlength="2000"
              placeholder="Contá brevemente por qué te interesa el puesto"
              class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="applying || selectedCv === ''"
              class="flex items-center gap-2 rounded-xl bg-ccisj px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ccisj-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LoaderCircle v-if="applying" class="h-4 w-4 animate-spin" />
              <Send v-else class="h-4 w-4" />
              {{ applying ? 'Enviando...' : 'Postularme' }}
            </button>
          </div>
        </form>

        <p v-else class="text-sm text-slate-500">Cargando...</p>
      </footer>
    </article>
  </div>
</template>
