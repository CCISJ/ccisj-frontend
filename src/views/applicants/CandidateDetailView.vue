<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import { RouterLink, useRoute } from 'vue-router';

import { ArrowLeft, ExternalLink } from 'lucide-vue-next';

import {
  getCandidateById,
  getCandidateCvFileUrl,
} from '@/services/applicantService';

import type { CandidateDetail } from '@/types/applicants.type';

import { formatMonth, formatPeriod } from '@/utils/date';

const route = useRoute();
const candidate = ref<CandidateDetail | null>(null);
const loading = ref(false);
const error = ref('');
const pdfError = ref('');
const openingCv = ref<number | null>(null);

let requestId = 0;

async function loadCandidate() {
  const currentRequest = ++requestId;

  loading.value = true;
  error.value = '';
  pdfError.value = '';
  candidate.value = null;

  try {
    const data = await getCandidateById(Number(route.params.id));

    if (currentRequest === requestId) {
      candidate.value = data;
    }
  } catch (err) {
    if (currentRequest === requestId) {
      error.value =
        err instanceof Error ? err.message : 'No se pudo cargar el candidato';
    }
  } finally {
    if (currentRequest === requestId) {
      loading.value = false;
    }
  }
}

async function openCv(cvId: number) {
  if (!candidate.value || openingCv.value !== null) return;

  // Abrir una pestaña en el clic evita que el navegador bloquee
  // la apertura después de esperar la petición HTTP.
  const tab = window.open('', '_blank');

  if (!tab) {
    pdfError.value = 'El navegador bloqueó la nueva pestaña.';
    return;
  }

  // Sin esto, el archivo abierto (lo subió el postulante) podría navegar esta
  // pestaña con `window.opener` (reverse tabnabbing), como en
  // `useReceiptViewer` y `openSignedFile`.
  tab.opener = null;

  openingCv.value = cvId;
  pdfError.value = '';

  try {
    const result = await getCandidateCvFileUrl(candidate.value.id, cvId);

    tab.location.replace(result.url);
  } catch (err) {
    tab.close();
    pdfError.value =
      err instanceof Error ? err.message : 'No se pudo abrir el CV';
  } finally {
    openingCv.value = null;
  }
}

watch(() => route.params.id, loadCandidate, { immediate: true });
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <RouterLink
      :to="{ name: 'candidatos' }"
      class="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:underline"
    >
      <ArrowLeft class="h-4 w-4" />
      Volver a candidatos
    </RouterLink>

    <p v-if="loading" role="status" class="text-slate-500">
      Cargando perfil...
    </p>

    <div
      v-if="error"
      role="alert"
      class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
    >
      {{ error }}
      <button
        type="button"
        class="ml-2 font-semibold underline"
        @click="loadCandidate"
      >
        Reintentar
      </button>
    </div>

    <template v-if="candidate && !loading">
      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 class="text-2xl font-bold text-slate-900">
          {{ candidate.nombre }} {{ candidate.apellido }}
        </h1>

        <p v-if="candidate.direccion" class="mt-2 text-slate-600">
          {{ candidate.direccion }}
        </p>

        <div class="mt-4 flex flex-wrap gap-2">
          <span
            v-for="item in candidate.categorias"
            :key="item.categoria.id"
            class="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700"
          >
            {{ item.categoria.nombre }}
          </span>
        </div>

        <p
          v-if="candidate.otros"
          class="mt-5 whitespace-pre-line text-slate-700"
        >
          {{ candidate.otros }}
        </p>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="mb-4 text-lg font-bold text-slate-900">
          Experiencia laboral
        </h2>

        <p v-if="!candidate.experiencias.length" class="text-sm text-slate-500">
          No tiene experiencias registradas.
        </p>

        <div
          v-for="experience in candidate.experiencias"
          :key="experience.id"
          class="border-b border-slate-100 py-4 first:pt-0 last:border-0 last:pb-0"
        >
          <h3 class="font-semibold text-slate-800">
            {{ experience.cargo }}
          </h3>
          <p class="text-sm text-slate-600">{{ experience.empresa }}</p>
          <p class="mt-1 text-xs text-slate-500">
            {{
              formatPeriod(
                experience.fechaInicio,
                experience.fechaFin,
                experience.actual,
              )
            }}
          </p>
          <p
            v-if="experience.tareas"
            class="mt-2 whitespace-pre-line text-sm text-slate-600"
          >
            {{ experience.tareas }}
          </p>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="mb-4 text-lg font-bold text-slate-900">Formación</h2>

        <p v-if="!candidate.estudios.length" class="text-sm text-slate-500">
          No tiene estudios registrados.
        </p>

        <div
          v-for="study in candidate.estudios"
          :key="study.id"
          class="border-b border-slate-100 py-4 first:pt-0 last:border-0 last:pb-0"
        >
          <h3 class="font-semibold text-slate-800">{{ study.titulo }}</h3>
          <p class="text-sm text-slate-600">{{ study.institucion }}</p>
          <p class="mt-1 text-xs text-slate-500">
            {{
              study.tipo === 'CURRICULAR'
                ? 'Estudio curricular'
                : 'Curso o taller'
            }}
          </p>

          <p class="mt-1 text-xs text-slate-500">
            {{ formatPeriod(study.fechaInicio, study.fechaFin, study.enCurso) }}
          </p>
          <p
            v-if="study.descripcion"
            class="mt-2 whitespace-pre-line text-sm text-slate-600"
          >
            {{ study.descripcion }}
          </p>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="mb-4 text-lg font-bold text-slate-900">Referencias</h2>

        <p v-if="!candidate.referencias.length" class="text-sm text-slate-500">
          No tiene referencias registradas.
        </p>

        <div
          v-for="reference in candidate.referencias"
          :key="reference.id"
          class="border-b border-slate-100 py-4 first:pt-0 last:border-0 last:pb-0"
        >
          <h3 class="font-semibold text-slate-800">{{ reference.nombre }}</h3>
          <p class="text-sm text-slate-600">
            {{ reference.tipo }}
            <span v-if="reference.relacion"> · {{ reference.relacion }}</span>
          </p>
          <p v-if="reference.telefono" class="mt-1 text-sm text-slate-600">
            Teléfono: {{ reference.telefono }}
          </p>
          <p v-if="reference.email" class="text-sm text-slate-600">
            Email: {{ reference.email }}
          </p>
        </div>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 class="mb-4 text-lg font-bold text-slate-900">CV en PDF</h2>

        <p v-if="!candidate.cvs.length" class="text-sm text-slate-500">
          No tiene archivos PDF cargados.
        </p>

        <p v-if="pdfError" role="alert" class="mb-3 text-sm text-red-600">
          {{ pdfError }}
        </p>

        <div
          v-for="cv in candidate.cvs"
          :key="cv.id"
          class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-0"
        >
          <div>
            <p class="font-medium text-slate-800">
              {{ cv.nombreArchivo || `CV #${cv.id}` }}
            </p>
            <p v-if="cv.descripcion" class="text-sm text-slate-500">
              {{ cv.descripcion }}
            </p>
          </div>

          <button
            type="button"
            :disabled="openingCv !== null"
            class="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
            @click="openCv(cv.id)"
          >
            <ExternalLink class="h-4 w-4" />
            {{ openingCv === cv.id ? 'Abriendo...' : 'Ver PDF' }}
          </button>
        </div>
      </section>
    </template>
  </div>
</template>
