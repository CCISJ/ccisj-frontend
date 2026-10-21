<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import {
  ExternalLink,
  FileText,
  LoaderCircle,
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

const progress = computed(() =>
  cvProgress({
    id: 0,
    usuario: { email: email.value },
    cvs: files.value,
    categorias: [],
    ...form,
  }),
);

// Listas

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
}

function addReference(tipo: ReferenceType) {
  form.referencias.push({
    tipo,
    nombre: '',
    relacion: '',
    telefono: '',
    email: '',
  } satisfies CvReference);
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
const cardTitle = 'text-sm font-semibold text-slate-800';
const label = 'mb-1.5 block text-xs font-medium text-slate-600';
const input =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-ccisj focus:ring-2 focus:ring-emerald-100';
const item = 'relative rounded-lg border border-slate-200 p-4';
const addButton =
  'flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-ccisj transition hover:bg-slate-50';
const removeButton =
  'absolute right-3 top-3 rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600';
const empty = 'text-sm text-slate-400';
</script>

<template>
  <div class="space-y-5">
    <!-- Encabezado -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-bold text-slate-900">Mi CV</h1>

        <p class="mt-1 text-sm text-slate-500">
          Completá tus datos o subí tu CV en PDF. Las empresas lo ven cuando te
          postulás a sus ofertas.
        </p>
      </div>

      <button
        v-if="!loading && !loadError"
        type="button"
        :disabled="saving"
        class="flex items-center gap-2 rounded-xl bg-ccisj px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        @click="save"
      >
        <LoaderCircle v-if="saving" class="h-4 w-4 animate-spin" />
        <Save v-else class="h-4 w-4" />
        {{ saving ? 'Guardando...' : 'Guardar CV' }}
      </button>
    </div>

    <p v-if="loading" class="py-10 text-center text-sm text-slate-400">
      Cargando...
    </p>

    <div
      v-else-if="loadError"
      class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
    >
      {{ loadError }}
      <button type="button" class="ml-2 font-medium underline" @click="load">
        Reintentar
      </button>
    </div>

    <template v-else>
      <!-- Progreso -->
      <div :class="[card, 'px-5 py-4']">
        <div class="flex items-center justify-between text-sm">
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

          <p class="text-xs text-slate-400 sm:col-span-2">
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
            <p class="text-xs text-slate-400">{{ group.hint }}</p>
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
            <button
              type="button"
              :class="removeButton"
              aria-label="Quitar"
              @click="remove(form.estudios, index)"
            >
              <Trash2 class="h-4 w-4" />
            </button>

            <div class="grid gap-3 pr-8 sm:grid-cols-2">
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
                class="inline-flex w-fit cursor-pointer items-center gap-2 self-center text-sm text-slate-600"
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
            <button
              type="button"
              :class="removeButton"
              aria-label="Quitar"
              @click="remove(form.experiencias, index)"
            >
              <Trash2 class="h-4 w-4" />
            </button>

            <div class="grid gap-3 pr-8 sm:grid-cols-2">
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
                class="inline-flex w-fit cursor-pointer items-center gap-2 self-center text-sm text-slate-600"
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
            <button
              type="button"
              :class="removeButton"
              aria-label="Quitar"
              @click="remove(form.referencias, index)"
            >
              <Trash2 class="h-4 w-4" />
            </button>

            <div class="grid gap-3 pr-8 sm:grid-cols-2">
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
            <p class="text-xs text-slate-400">
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
          class="flex items-center gap-2 rounded-xl bg-ccisj px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
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
            <p class="text-xs text-slate-400">
              Podés tener varios (por ejemplo, uno por rubro). Hasta
              {{ CV_MAX_FILE_MB }} MB cada uno.
            </p>
          </div>

          <button
            type="button"
            :disabled="uploading"
            class="flex items-center gap-1.5 rounded-lg bg-ccisj px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
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
            <FileText class="h-4 w-4 shrink-0 text-slate-400" />

            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-slate-800">
                {{ file.nombreArchivo ?? 'CV' }}
              </p>
              <p class="text-xs text-slate-400">
                Subido el {{ formatDate(file.fechaActualizacion) }}
              </p>
            </div>

            <button
              type="button"
              class="flex items-center gap-1 text-xs font-medium text-ccisj hover:underline"
              @click="openFile(file)"
            >
              Ver <ExternalLink class="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              class="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
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
