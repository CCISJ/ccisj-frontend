<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';

import { RouterLink, useRoute, useRouter } from 'vue-router';

import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Pencil,
  Trash2,
  Upload,
} from 'lucide-vue-next';

import ConfirmModal from '@/components/ConfirmModal.vue';

import { openSignedFile } from '@/services/cvService';
import {
  GESTION_ACCEPT,
  deleteArchivoGestion,
  deleteGestion,
  getArchivoGestionUrl,
  getGestion,
  problemasDeArchivos,
  tamanoLegible,
  tipoLegible,
  uploadArchivosGestion,
} from '@/services/gestionesService';

import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

import type { ArchivoGestion, Gestion } from '@/types/gestion.type';

import { formatDate } from '@/utils/date';

const auth = useAuthStore();
const toast = useToastStore();
const route = useRoute();
const router = useRouter();

const gestion = ref<Gestion | null>(null);
const loading = ref(true);
const error = ref('');

const uploading = ref(false);
const uploadError = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

const confirmDelete = ref(false);
const deleting = ref(false);
const fileToDelete = ref<ArchivoGestion | null>(null);
const deletingFile = ref(false);
const opening = ref<number | null>(null);

function id() {
  return Number(route.params.id);
}

async function load() {
  loading.value = true;
  error.value = '';

  try {
    gestion.value = await getGestion(id());
  } catch (err) {
    gestion.value = null;
    error.value =
      err instanceof Error ? err.message : 'No se pudo cargar la gestión';
  } finally {
    loading.value = false;
  }
}

async function openFile(archivo: ArchivoGestion) {
  if (opening.value !== null) return;

  opening.value = archivo.id;

  try {
    await openSignedFile(
      () => getArchivoGestionUrl(id(), archivo.id),
      'Cargando archivo...',
    );
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'No se pudo abrir el archivo',
    );
  } finally {
    opening.value = null;
  }
}

async function handleFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);

  input.value = '';
  uploadError.value = '';

  if (files.length === 0) return;

  const problemas = problemasDeArchivos(files);

  if (problemas.length) {
    uploadError.value = problemas.join(' ');
    return;
  }

  uploading.value = true;

  try {
    await uploadArchivosGestion(id(), files);
    toast.success(
      files.length === 1
        ? 'Archivo agregado'
        : `${files.length} archivos agregados`,
    );
    await load();
  } catch (err) {
    uploadError.value =
      err instanceof Error ? err.message : 'No se pudieron subir los archivos';
  } finally {
    uploading.value = false;
  }
}

async function removeFile() {
  if (!fileToDelete.value) return;

  deletingFile.value = true;

  try {
    await deleteArchivoGestion(id(), fileToDelete.value.id);
    toast.success('Archivo eliminado');
    fileToDelete.value = null;
    await load();
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'No se pudo eliminar el archivo',
    );
  } finally {
    deletingFile.value = false;
  }
}

async function removeGestion() {
  deleting.value = true;

  try {
    await deleteGestion(id());
    toast.success('Gestión eliminada');
    await router.push({ name: 'gestoria' });
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'No se pudo eliminar la gestión',
    );
  } finally {
    deleting.value = false;
    confirmDelete.value = false;
  }
}

watch(() => route.params.id, load);
onMounted(load);
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <RouterLink
      :to="{ name: 'gestoria' }"
      class="inline-flex items-center gap-2 font-semibold text-ccisj hover:underline"
    >
      <ArrowLeft class="h-5 w-5" />
      Volver a Gestoría
    </RouterLink>

    <p v-if="loading && !gestion" role="status" class="text-slate-600">
      Cargando...
    </p>

    <p v-if="error" role="alert" class="rounded-xl bg-red-50 p-4 text-red-700">
      {{ error }}
    </p>

    <template v-if="gestion">
      <article class="rounded-2xl border border-slate-200 bg-white p-6">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="font-semibold text-ccisj">{{ gestion.categoria }}</p>
            <h1 class="mt-1 text-3xl font-bold text-slate-900">
              {{ gestion.titulo }}
            </h1>
            <p class="mt-2 text-sm text-slate-600">
              Creada el {{ formatDate(gestion.fechaCreacion) }} · actualizada el
              {{ formatDate(gestion.fechaActualizacion) }}
            </p>
          </div>

          <div v-if="auth.isAdmin" class="flex flex-wrap gap-2">
            <RouterLink
              :to="{ name: 'gestion-editar', params: { id: gestion.id } }"
              class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 font-semibold text-slate-700 transition hover:border-ccisj hover:text-ccisj"
            >
              <Pencil class="h-5 w-5" />
              Editar
            </RouterLink>

            <button
              type="button"
              class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-200 bg-white px-4 font-semibold text-red-700 transition hover:bg-red-50"
              @click="confirmDelete = true"
            >
              <Trash2 class="h-5 w-5" />
              Eliminar
            </button>
          </div>
        </div>

        <p class="mt-6 whitespace-pre-line text-lg leading-8 text-slate-800">
          {{ gestion.descripcion }}
        </p>
      </article>

      <section
        aria-labelledby="archivos"
        class="rounded-2xl border border-slate-200 bg-white p-6"
      >
        <div class="flex flex-wrap items-center justify-between gap-4">
          <h2 id="archivos" class="text-xl font-bold text-slate-900">
            Archivos
          </h2>

          <template v-if="auth.isAdmin">
            <input
              ref="fileInput"
              type="file"
              multiple
              :accept="GESTION_ACCEPT"
              class="sr-only"
              aria-label="Elegir archivos para agregar"
              @change="handleFiles"
            />
            <button
              type="button"
              :disabled="uploading"
              class="inline-flex min-h-11 items-center gap-2 rounded-xl bg-ccisj px-4 font-semibold text-white transition hover:bg-ccisj-dark disabled:opacity-60"
              @click="fileInput?.click()"
            >
              <Upload class="h-5 w-5" />
              {{ uploading ? 'Subiendo...' : 'Agregar archivos' }}
            </button>
          </template>
        </div>

        <p v-if="auth.isAdmin" class="mt-1 text-sm text-slate-600">
          PDF, fotos (JPG o PNG), Word o Excel; hasta 5 por vez y 10 MB cada
          uno.
        </p>

        <p
          v-if="uploadError"
          role="alert"
          class="mt-3 rounded-xl bg-red-50 p-3 text-red-700"
        >
          {{ uploadError }}
        </p>

        <p v-if="gestion.archivos.length === 0" class="mt-4 text-slate-600">
          Esta gestión no tiene archivos.
        </p>

        <ul v-else class="mt-4 divide-y divide-slate-100">
          <li
            v-for="archivo in gestion.archivos"
            :key="archivo.id"
            class="flex flex-wrap items-center gap-3 py-3"
          >
            <FileText class="h-6 w-6 shrink-0 text-slate-500" />

            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold text-slate-900">
                {{ archivo.nombre }}
              </p>
              <p class="text-sm text-slate-600">
                {{ tipoLegible(archivo.tipo) }} ·
                {{ tamanoLegible(archivo.tamano) }}
              </p>
            </div>

            <button
              type="button"
              :disabled="opening !== null"
              class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 font-semibold text-slate-700 transition hover:border-ccisj hover:text-ccisj disabled:opacity-60"
              :aria-label="`Abrir ${archivo.nombre}`"
              @click="openFile(archivo)"
            >
              <ExternalLink class="h-5 w-5" />
              {{ opening === archivo.id ? 'Abriendo...' : 'Abrir' }}
            </button>

            <button
              v-if="auth.isAdmin"
              type="button"
              class="inline-flex min-h-11 items-center rounded-xl px-3 text-red-700 transition hover:bg-red-50"
              :aria-label="`Eliminar ${archivo.nombre}`"
              @click="fileToDelete = archivo"
            >
              <Trash2 class="h-5 w-5" />
            </button>
          </li>
        </ul>
      </section>
    </template>

    <ConfirmModal
      :open="confirmDelete"
      title="Eliminar gestión"
      message="Se borra la gestión con todos sus archivos, y no se puede deshacer."
      confirm-text="Eliminar"
      danger
      :loading="deleting"
      @confirm="removeGestion"
      @cancel="confirmDelete = false"
    />

    <ConfirmModal
      :open="fileToDelete !== null"
      title="Eliminar archivo"
      :message="`Se borra «${fileToDelete?.nombre ?? ''}» de esta gestión, y no se puede deshacer.`"
      confirm-text="Eliminar"
      danger
      :loading="deletingFile"
      @confirm="removeFile"
      @cancel="fileToDelete = null"
    />
  </div>
</template>
