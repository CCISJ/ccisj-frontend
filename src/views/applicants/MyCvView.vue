<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import {
  Check,
  ExternalLink,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-vue-next';

import {
  CV_MAX_FILES_PER_UPLOAD,
  CV_MAX_FILE_MB,
  cvProgress,
  deleteMyCvFile,
  getMyCv,
  getMyCvFileUrl,
  openSignedFile,
  saveMyCv,
  uploadMyCvFiles,
} from '@/services/cvService';

import { useToastStore } from '@/stores/toast';

import type {
  Cv,
  CvData,
  CvEducation,
  CvExperience,
  CvFile,
  CvReference,
  EducationType,
  ReferenceType,
} from '@/types/cv.type';

import { formatDate, todayLocal } from '@/utils/date';

const toast = useToastStore();

const loading = ref(true);
const loadError = ref('');
const saving = ref(false);
const uploading = ref(false);
const email = ref('');
const files = ref<CvFile[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

const form = reactive<CvData>({
  nombre: '',
  apellido: '',
  telefono: '',
  direccion: '',
  fechaNacimiento: '',
  otros: '',
  estudios: [],
  experiencias: [],
  referencias: [],
});

/** Las fechas no pueden ser futuras (el backend valida lo mismo). */
const today = todayLocal();

/** "2022-03-01T00:00:00.000Z" → "2022-03-01" para un `<input type="date">`. */
const toDay = (value: string | null) => (value ? value.slice(0, 10) : '');

function fill(cv: Cv) {
  // Lo guardado se ve resumido; se abre de a uno para editarlo.
  editing.clear();
  email.value = cv.usuario.email;
  files.value = cv.cvs;

  Object.assign(form, {
    nombre: cv.nombre,
    apellido: cv.apellido,
    telefono: cv.telefono ?? '',
    direccion: cv.direccion ?? '',
    fechaNacimiento: toDay(cv.fechaNacimiento),
    otros: cv.otros ?? '',
    estudios: cv.estudios.map((item) => ({
      ...item,
      fechaInicio: toDay(item.fechaInicio),
      fechaFin: toDay(item.fechaFin),
      descripcion: item.descripcion ?? '',
    })),
    experiencias: cv.experiencias.map((item) => ({
      ...item,
      fechaInicio: toDay(item.fechaInicio),
      fechaFin: toDay(item.fechaFin),
      tareas: item.tareas ?? '',
    })),
    referencias: cv.referencias.map((item) => ({
      ...item,
      relacion: item.relacion ?? '',
      telefono: item.telefono ?? '',
      email: item.email ?? '',
    })),
  });
}

async function load() {
  loading.value = true;
  loadError.value = '';

  try {
    fill(await getMyCv());
  } catch (err) {
    loadError.value =
      err instanceof Error ? err.message : 'No se pudo cargar tu CV';
  } finally {
    loading.value = false;
  }
}

onMounted(load);

const progress = computed(() => cvProgress(form));

// Listas

/*
 * Cada estudio, experiencia o referencia ya cargada se ve como una línea
 * ("Bachillerato · Liceo N°1 · 2011 – 2016"). Los campos aparecen al tocar
 * Editar, y lo que se agrega nuevo ya viene abierto. Así el CV completo se
 * lee de un vistazo y no es una pared de formularios.
 */
const editing = reactive(new Set<object>());

function isOpen(entry: object) {
  return editing.has(entry);
}

function toggle(entry: object) {
  if (editing.has(entry)) editing.delete(entry);
  else editing.add(entry);
}

function openLast<T extends object>(list: T[]) {
  const last = list.at(-1);
  if (last) editing.add(last);
}

function years(desde: string | null, hasta: string | null, ongoing: boolean) {
  const from = (desde ?? '').slice(0, 4);
  const to = ongoing ? 'hoy' : (hasta ?? '').slice(0, 4);

  if (!from && !to) return '';
  if (from === to) return from;

  return [from || '?', to || '?'].join(' – ');
}

function studySummary(study: CvEducation) {
  return {
    title:
      study.titulo.trim() ||
      study.institucion.trim() ||
      'Estudio sin completar',
    detail: [
      study.titulo.trim() ? study.institucion.trim() : '',
      years(study.fechaInicio, study.fechaFin ?? '', study.enCurso),
    ]
      .filter(Boolean)
      .join(' · '),
  };
}

function jobSummary(job: CvExperience) {
  return {
    title:
      job.cargo.trim() || job.empresa.trim() || 'Experiencia sin completar',
    detail: [
      job.cargo.trim() ? job.empresa.trim() : '',
      years(job.fechaInicio, job.fechaFin ?? '', job.actual),
    ]
      .filter(Boolean)
      .join(' · '),
  };
}

function referenceSummary(reference: CvReference) {
  return {
    title: reference.nombre.trim() || 'Referencia sin completar',
    detail: [reference.relacion, reference.telefono, reference.email]
      .map((value) => (value ?? '').trim())
      .filter(Boolean)
      .join(' · '),
  };
}

function addEducation(tipo: EducationType) {
  form.estudios.push({
    tipo,
    institucion: '',
    titulo: '',
    fechaInicio: '',
    fechaFin: '',
    enCurso: false,
    descripcion: '',
  } satisfies CvEducation);
  openLast(form.estudios);
}

function addExperience() {
  form.experiencias.push({
    empresa: '',
    cargo: '',
    fechaInicio: '',
    fechaFin: '',
    actual: false,
    tareas: '',
  } satisfies CvExperience);
  openLast(form.experiencias);
}

function addReference(tipo: ReferenceType) {
  form.referencias.push({
    tipo,
    nombre: '',
    relacion: '',
    telefono: '',
    email: '',
  } satisfies CvReference);
  openLast(form.referencias);
}

function remove<T>(list: T[], index: number) {
  list.splice(index, 1);
}

const curricular = computed(() =>
  form.estudios
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.tipo === 'CURRICULAR'),
);
const nonCurricular = computed(() =>
  form.estudios
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.tipo === 'NO_CURRICULAR'),
);
const workReferences = computed(() =>
  form.referencias
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.tipo === 'LABORAL'),
);
const personalReferences = computed(() =>
  form.referencias
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.tipo === 'PERSONAL'),
);

// Guardar

async function save() {
  if (saving.value) return;

  if (!form.nombre.trim() || !form.apellido.trim()) {
    toast.error('Completá nombre y apellido.');
    return;
  }

  saving.value = true;

  try {
    fill(await saveMyCv(form));
    toast.success('CV guardado');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Error al guardar el CV');
  } finally {
    saving.value = false;
  }
}

// PDF

async function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const selected = [...(input.files ?? [])];

  input.value = '';

  if (selected.length === 0) return;

  if (selected.length > CV_MAX_FILES_PER_UPLOAD) {
    toast.error(`Podés subir hasta ${CV_MAX_FILES_PER_UPLOAD} PDF a la vez.`);
    return;
  }

  const invalid = selected.find(
    (file) =>
      file.type !== 'application/pdf' ||
      file.size > CV_MAX_FILE_MB * 1024 * 1024,
  );

  if (invalid) {
    toast.error(
      `"${invalid.name}" tiene que ser un PDF de hasta ${CV_MAX_FILE_MB} MB.`,
    );
    return;
  }

  uploading.value = true;

  try {
    const created = await uploadMyCvFiles(selected);

    files.value = [...created, ...files.value];
    toast.success(
      created.length === 1 ? 'CV subido' : `${created.length} CV subidos`,
    );
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Error al subir el CV');
  } finally {
    uploading.value = false;
  }
}

async function openFile(file: CvFile) {
  try {
    await openSignedFile(() => getMyCvFileUrl(file.id));
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Error al abrir el CV');
  }
}

async function removeFile(file: CvFile) {
  if (!window.confirm(`¿Eliminar "${file.nombreArchivo ?? 'CV'}"?`)) return;

  try {
    await deleteMyCvFile(file.id);
    files.value = files.value.filter((item) => item.id !== file.id);
    toast.success('CV eliminado');
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Error al eliminar el CV');
  }
}

const card = 'rounded-xl border border-slate-200 bg-white';
const cardHeader =
  'flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5';
const cardTitle = 'text-base font-semibold text-slate-800';
const label = 'mb-1.5 block text-sm font-medium text-slate-600';
const input =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-base text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-ccisj focus:ring-2 focus:ring-emerald-100';
const item = 'relative rounded-lg border border-slate-200 p-4';
const addButton =
  'flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-ccisj transition hover:bg-slate-50';
const removeButton =
  'absolute right-3 top-3 rounded-md p-1 text-slate-600 transition hover:bg-red-50 hover:text-red-600';
const doneButton =
  'absolute right-11 top-2 flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold text-ccisj transition hover:bg-ccisj-light';
const iconButton =
  'rounded-md p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900';
const empty = 'text-base text-slate-600';
</script>

<template>
  <div class="space-y-5">
    <!-- Encabezado -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-3xl font-bold text-slate-900">Mi CV</h1>

        <p class="mt-1 text-base text-slate-600">
          Completá tus datos o subí tu CV en PDF. Las empresas lo ven cuando te
          postulás a sus ofertas.
        </p>
      </div>

      <button
        v-if="!loading && !loadError"
        type="button"
        :disabled="saving"
        class="flex items-center gap-2 rounded-xl bg-ccisj px-4 py-2.5 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        @click="save"
      >
        <LoaderCircle v-if="saving" class="h-4 w-4 animate-spin" />
        <Save v-else class="h-4 w-4" />
        {{ saving ? 'Guardando...' : 'Guardar CV' }}
      </button>
    </div>

    <p v-if="loading" class="py-10 text-center text-base text-slate-600">
      Cargando...
    </p>

    <div
      v-else-if="loadError"
      class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-base text-amber-800"
    >
      {{ loadError }}
      <button type="button" class="ml-2 font-medium underline" @click="load">
        Reintentar
      </button>
    </div>

    <template v-else>
      <!-- Progreso -->
      <div :class="[card, 'px-5 py-4']">
        <div class="flex items-center justify-between text-base">
          <span class="font-medium text-slate-700">CV completo al</span>
          <span class="font-semibold text-ccisj">{{ progress }}%</span>
        </div>

        <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            class="h-full rounded-full bg-ccisj transition-all"
            :style="{ width: `${progress}%` }"
          />
        </div>
      </div>

      <!-- Datos personales -->
      <section :class="card">
        <div :class="cardHeader">
          <h2 :class="cardTitle">Datos personales</h2>
        </div>

        <div class="grid gap-4 p-5 sm:grid-cols-2">
          <div>
            <label for="cv-nombre" :class="label">Nombre</label>
            <input
              id="cv-nombre"
              v-model="form.nombre"
              maxlength="100"
              :class="input"
            />
          </div>

          <div>
            <label for="cv-apellido" :class="label">Apellidos</label>
            <input
              id="cv-apellido"
              v-model="form.apellido"
              maxlength="100"
              :class="input"
            />
          </div>

          <div>
            <label for="cv-nacimiento" :class="label"
              >Fecha de nacimiento</label
            >
            <input
              id="cv-nacimiento"
              v-model="form.fechaNacimiento"
              type="date"
              :class="input"
            />
          </div>

          <div>
            <label for="cv-telefono" :class="label">Teléfono</label>
            <input
              id="cv-telefono"
              v-model="form.telefono"
              type="tel"
              maxlength="50"
              placeholder="099 123 456"
              :class="input"
            />
          </div>

          <div class="sm:col-span-2">
            <label for="cv-direccion" :class="label">Dirección</label>
            <input
              id="cv-direccion"
              v-model="form.direccion"
              maxlength="255"
              placeholder="Calle, número y ciudad"
              :class="input"
            />
          </div>

          <p class="text-sm text-slate-600 sm:col-span-2">
            Correo electrónico: {{ email }}
          </p>
        </div>
      </section>

      <!-- Estudios -->
      <section
        v-for="group in [
          {
            tipo: 'CURRICULAR' as const,
            title: 'Estudios curriculares',
            hint: 'Primaria, secundaria, UTU, terciarios, universitarios.',
            items: curricular,
          },
          {
            tipo: 'NO_CURRICULAR' as const,
            title: 'Estudios no curriculares',
            hint: 'Cursos, talleres, idiomas, capacitaciones.',
            items: nonCurricular,
          },
        ]"
        :key="group.tipo"
        :class="card"
      >
        <div :class="cardHeader">
          <div>
            <h2 :class="cardTitle">{{ group.title }}</h2>
            <p class="text-sm text-slate-600">{{ group.hint }}</p>
          </div>

          <button
            type="button"
            :class="addButton"
            @click="addEducation(group.tipo)"
          >
            <Plus class="h-3.5 w-3.5" /> Agregar
          </button>
        </div>

        <div class="space-y-3 p-5">
          <p v-if="group.items.length === 0" :class="empty">
            Todavía no agregaste ninguno.
          </p>

          <div
            v-for="{ item: study, index } in group.items"
            :key="index"
            :class="item"
          >
            <!-- Resumida -->
            <div
              v-if="!isOpen(study)"
              class="flex items-center justify-between gap-3"
            >
              <div class="min-w-0">
                <p class="font-semibold text-slate-900">
                  {{ studySummary(study).title }}
                </p>
                <p
                  v-if="studySummary(study).detail"
                  class="text-base text-slate-600"
                >
                  {{ studySummary(study).detail }}
                </p>
              </div>

              <div class="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  :class="iconButton"
                  :aria-label="`Editar ${studySummary(study).title}`"
                  @click="toggle(study)"
                >
                  <Pencil class="h-4 w-4" />
                </button>

                <button
                  type="button"
                  :class="[iconButton, 'hover:bg-red-50 hover:text-red-700']"
                  :aria-label="`Quitar ${studySummary(study).title}`"
                  @click="remove(form.estudios, index)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- Abierta para editar -->
            <button
              v-if="isOpen(study)"
              type="button"
              :class="doneButton"
              @click="toggle(study)"
            >
              <Check class="h-4 w-4" />
              Listo
            </button>

            <button
              v-if="isOpen(study)"
              type="button"
              :class="removeButton"
              aria-label="Quitar"
              @click="remove(form.estudios, index)"
            >
              <Trash2 class="h-4 w-4" />
            </button>

            <div v-if="isOpen(study)" class="grid gap-3 pt-6 sm:grid-cols-2">
              <div>
                <label :for="`estudio-${index}-institucion`" :class="label"
                  >Institución</label
                >
                <input
                  :id="`estudio-${index}-institucion`"
                  v-model="study.institucion"
                  maxlength="150"
                  placeholder="Ej. Liceo N°1, UTEC, INEFOP"
                  :class="input"
                />
              </div>

              <div>
                <label :for="`estudio-${index}-titulo`" :class="label"
                  >Título o curso</label
                >
                <input
                  :id="`estudio-${index}-titulo`"
                  v-model="study.titulo"
                  maxlength="150"
                  :class="input"
                />
              </div>

              <div>
                <label :for="`estudio-${index}-fechaInicio`" :class="label"
                  >Desde</label
                >
                <input
                  :id="`estudio-${index}-fechaInicio`"
                  v-model="study.fechaInicio"
                  type="date"
                  :max="today"
                  :class="[input, 'disabled:bg-slate-50 disabled:opacity-60']"
                />
              </div>

              <div>
                <label :for="`estudio-${index}-fechaFin`" :class="label"
                  >Hasta</label
                >
                <input
                  :id="`estudio-${index}-fechaFin`"
                  v-model="study.fechaFin"
                  type="date"
                  :max="today"
                  :disabled="study.enCurso"
                  :class="[input, 'disabled:bg-slate-50 disabled:opacity-60']"
                />
              </div>

              <label
                class="inline-flex w-fit cursor-pointer items-center gap-2 self-center text-base text-slate-600"
              >
                <input v-model="study.enCurso" type="checkbox" />
                En curso
              </label>

              <div class="sm:col-span-2">
                <label :for="`estudio-${index}-descripcion`" :class="label"
                  >Detalle (opcional)</label
                >
                <textarea
                  :id="`estudio-${index}-descripcion`"
                  v-model="study.descripcion"
                  rows="2"
                  maxlength="2000"
                  :class="input"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Experiencia laboral -->
      <section :class="card">
        <div :class="cardHeader">
          <h2 :class="cardTitle">Experiencia laboral</h2>

          <button type="button" :class="addButton" @click="addExperience">
            <Plus class="h-3.5 w-3.5" /> Agregar
          </button>
        </div>

        <div class="space-y-3 p-5">
          <p v-if="form.experiencias.length === 0" :class="empty">
            Todavía no agregaste ninguna.
          </p>

          <div
            v-for="(job, index) in form.experiencias"
            :key="index"
            :class="item"
          >
            <!-- Resumida -->
            <div
              v-if="!isOpen(job)"
              class="flex items-center justify-between gap-3"
            >
              <div class="min-w-0">
                <p class="font-semibold text-slate-900">
                  {{ jobSummary(job).title }}
                </p>
                <p
                  v-if="jobSummary(job).detail"
                  class="text-base text-slate-600"
                >
                  {{ jobSummary(job).detail }}
                </p>
              </div>

              <div class="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  :class="iconButton"
                  :aria-label="`Editar ${jobSummary(job).title}`"
                  @click="toggle(job)"
                >
                  <Pencil class="h-4 w-4" />
                </button>

                <button
                  type="button"
                  :class="[iconButton, 'hover:bg-red-50 hover:text-red-700']"
                  :aria-label="`Quitar ${jobSummary(job).title}`"
                  @click="remove(form.experiencias, index)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- Abierta para editar -->
            <button
              v-if="isOpen(job)"
              type="button"
              :class="doneButton"
              @click="toggle(job)"
            >
              <Check class="h-4 w-4" />
              Listo
            </button>

            <button
              v-if="isOpen(job)"
              type="button"
              :class="removeButton"
              aria-label="Quitar"
              @click="remove(form.experiencias, index)"
            >
              <Trash2 class="h-4 w-4" />
            </button>

            <div v-if="isOpen(job)" class="grid gap-3 pt-6 sm:grid-cols-2">
              <div>
                <label :for="`experiencia-${index}-empresa`" :class="label"
                  >Empresa</label
                >
                <input
                  :id="`experiencia-${index}-empresa`"
                  v-model="job.empresa"
                  maxlength="150"
                  :class="input"
                />
              </div>

              <div>
                <label :for="`experiencia-${index}-cargo`" :class="label"
                  >Cargo</label
                >
                <input
                  :id="`experiencia-${index}-cargo`"
                  v-model="job.cargo"
                  maxlength="150"
                  :class="input"
                />
              </div>

              <div>
                <label :for="`experiencia-${index}-fechaInicio`" :class="label"
                  >Desde</label
                >
                <input
                  :id="`experiencia-${index}-fechaInicio`"
                  v-model="job.fechaInicio"
                  type="date"
                  :max="today"
                  :class="[input, 'disabled:bg-slate-50 disabled:opacity-60']"
                />
              </div>

              <div>
                <label :for="`experiencia-${index}-fechaFin`" :class="label"
                  >Hasta</label
                >
                <input
                  :id="`experiencia-${index}-fechaFin`"
                  v-model="job.fechaFin"
                  type="date"
                  :max="today"
                  :disabled="job.actual"
                  :class="[input, 'disabled:bg-slate-50 disabled:opacity-60']"
                />
              </div>

              <label
                class="inline-flex w-fit cursor-pointer items-center gap-2 self-center text-base text-slate-600"
              >
                <input v-model="job.actual" type="checkbox" />
                Trabajo actual
              </label>

              <div class="sm:col-span-2">
                <label :for="`experiencia-${index}-tareas`" :class="label"
                  >Tareas</label
                >
                <textarea
                  :id="`experiencia-${index}-tareas`"
                  v-model="job.tareas"
                  rows="2"
                  maxlength="2000"
                  :class="input"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Referencias -->
      <section
        v-for="group in [
          {
            tipo: 'LABORAL' as const,
            title: 'Referencias laborales',
            relation: 'Empresa y cargo',
            items: workReferences,
          },
          {
            tipo: 'PERSONAL' as const,
            title: 'Referencias personales',
            relation: 'Vínculo',
            items: personalReferences,
          },
        ]"
        :key="group.tipo"
        :class="card"
      >
        <div :class="cardHeader">
          <h2 :class="cardTitle">{{ group.title }}</h2>

          <button
            type="button"
            :class="addButton"
            @click="addReference(group.tipo)"
          >
            <Plus class="h-3.5 w-3.5" /> Agregar
          </button>
        </div>

        <div class="space-y-3 p-5">
          <p v-if="group.items.length === 0" :class="empty">
            Todavía no agregaste ninguna.
          </p>

          <div
            v-for="{ item: reference, index } in group.items"
            :key="index"
            :class="item"
          >
            <!-- Resumida -->
            <div
              v-if="!isOpen(reference)"
              class="flex items-center justify-between gap-3"
            >
              <div class="min-w-0">
                <p class="font-semibold text-slate-900">
                  {{ referenceSummary(reference).title }}
                </p>
                <p
                  v-if="referenceSummary(reference).detail"
                  class="text-base text-slate-600"
                >
                  {{ referenceSummary(reference).detail }}
                </p>
              </div>

              <div class="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  :class="iconButton"
                  :aria-label="`Editar ${referenceSummary(reference).title}`"
                  @click="toggle(reference)"
                >
                  <Pencil class="h-4 w-4" />
                </button>

                <button
                  type="button"
                  :class="[iconButton, 'hover:bg-red-50 hover:text-red-700']"
                  :aria-label="`Quitar ${referenceSummary(reference).title}`"
                  @click="remove(form.referencias, index)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </div>

            <!-- Abierta para editar -->
            <button
              v-if="isOpen(reference)"
              type="button"
              :class="doneButton"
              @click="toggle(reference)"
            >
              <Check class="h-4 w-4" />
              Listo
            </button>

            <button
              v-if="isOpen(reference)"
              type="button"
              :class="removeButton"
              aria-label="Quitar"
              @click="remove(form.referencias, index)"
            >
              <Trash2 class="h-4 w-4" />
            </button>

            <div
              v-if="isOpen(reference)"
              class="grid gap-3 pt-6 sm:grid-cols-2"
            >
              <div>
                <label :for="`referencia-${index}-nombre`" :class="label"
                  >Nombre</label
                >
                <input
                  :id="`referencia-${index}-nombre`"
                  v-model="reference.nombre"
                  maxlength="150"
                  :class="input"
                />
              </div>

              <div>
                <label :for="`referencia-${index}-relacion`" :class="label">{{
                  group.relation
                }}</label>
                <input
                  :id="`referencia-${index}-relacion`"
                  v-model="reference.relacion"
                  maxlength="150"
                  :class="input"
                />
              </div>

              <div>
                <label :for="`referencia-${index}-telefono`" :class="label"
                  >Teléfono</label
                >
                <input
                  :id="`referencia-${index}-telefono`"
                  v-model="reference.telefono"
                  type="tel"
                  maxlength="50"
                  :class="input"
                />
              </div>

              <div>
                <label :for="`referencia-${index}-email`" :class="label"
                  >Email</label
                >
                <input
                  :id="`referencia-${index}-email`"
                  v-model="reference.email"
                  type="email"
                  maxlength="255"
                  :class="input"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Otros -->
      <section :class="card">
        <div :class="cardHeader">
          <div>
            <h2 :class="cardTitle">Otros</h2>
            <p class="text-sm text-slate-600">
              Libreta de conducir, disponibilidad horaria, intereses, lo que
              quieras agregar.
            </p>
          </div>
        </div>

        <div class="p-5">
          <label for="cv-otros" class="sr-only">Otros</label>
          <textarea
            id="cv-otros"
            v-model="form.otros"
            rows="4"
            maxlength="2000"
            :class="input"
          />
        </div>
      </section>

      <div class="flex justify-end">
        <button
          type="button"
          :disabled="saving"
          class="flex items-center gap-2 rounded-xl bg-ccisj px-4 py-2.5 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          @click="save"
        >
          <LoaderCircle v-if="saving" class="h-4 w-4 animate-spin" />
          <Save v-else class="h-4 w-4" />
          {{ saving ? 'Guardando...' : 'Guardar CV' }}
        </button>
      </div>

      <!-- PDF -->
      <section :class="card">
        <div :class="cardHeader">
          <div>
            <h2 :class="cardTitle">Mis CV en PDF</h2>
            <p class="text-sm text-slate-600">
              Opcional. Podés tener varios (por ejemplo, uno por rubro) y elegir
              cuál mandar en cada postulación. Hasta
              {{ CV_MAX_FILE_MB }} MB cada uno.
            </p>
          </div>

          <button
            type="button"
            :disabled="uploading"
            class="flex items-center gap-1.5 rounded-lg bg-ccisj px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            @click="fileInput?.click()"
          >
            <LoaderCircle v-if="uploading" class="h-3.5 w-3.5 animate-spin" />
            <Upload v-else class="h-3.5 w-3.5" />
            {{ uploading ? 'Subiendo...' : 'Subir PDF' }}
          </button>

          <label for="cv-archivos" class="sr-only">Subir CV en PDF</label>
          <input
            id="cv-archivos"
            ref="fileInput"
            type="file"
            accept="application/pdf"
            multiple
            class="hidden"
            @change="onFilesSelected"
          />
        </div>

        <p
          v-if="files.length === 0"
          class="px-5 py-6 text-center"
          :class="empty"
        >
          Todavía no subiste ningún PDF.
        </p>

        <ul v-else class="divide-y divide-slate-100">
          <li
            v-for="file in files"
            :key="file.id"
            class="flex items-center gap-3 px-5 py-3"
          >
            <FileText class="h-4 w-4 shrink-0 text-slate-600" />

            <div class="min-w-0 flex-1">
              <p class="truncate text-base font-medium text-slate-800">
                {{ file.nombreArchivo ?? 'CV' }}
              </p>
              <p class="text-sm text-slate-600">
                Subido el {{ formatDate(file.fechaActualizacion) }}
              </p>
            </div>

            <button
              type="button"
              class="flex items-center gap-1 text-sm font-medium text-ccisj hover:underline"
              @click="openFile(file)"
            >
              Ver <ExternalLink class="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              class="rounded-md p-1 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Eliminar"
              @click="removeFile(file)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
