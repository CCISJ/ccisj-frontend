<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';

import { ArrowLeft, Building2, Info, RefreshCw, Save } from 'lucide-vue-next';

import { getCategories } from '@/services/categoriesService';
import { getMembers, isFullMember } from '@/services/membersService';
import {
  createOffer,
  getMyOffer,
  getOffer,
  updateOffer,
} from '@/services/offersService';

import { useToastStore } from '@/stores/toast';

import {
  type Category,
  OFFER_MODALITY_LABELS,
  type Offer,
  type OfferFormData,
  type OfferModality,
  type OwnOffer,
  type UpdateOfferData,
} from '@/types/offer.type';

import { formatDate, uruguayDay } from '@/utils/date';

const route = useRoute();
const router = useRouter();
const toast = useToastStore();

// Mismos límites que aplica el backend.
const TITLE_MAX = 150;
const LOCATION_MAX = 150;
const DESCRIPTION_MAX = 5000;
const VACANCIES_MAX = 999;

/*
 * El mismo formulario sirve a la empresa (`/mis-ofertas/...`) y a la
 * administración (`/ofertas/...`), que publica en nombre de una empresa
 * socia (lo pidió el cliente). El postulante no nota la diferencia: la oferta
 * sale con el nombre de la empresa.
 */
const isAdminForm = computed(
  () => route.name === 'oferta-nueva' || route.name === 'oferta-editar',
);

const offerId = computed(() =>
  route.name === 'mis-ofertas-editar' || route.name === 'oferta-editar'
    ? Number(route.params.id)
    : null,
);
const isEdit = computed(() => offerId.value !== null);

type CompanyOption = { id: number; razonSocial: string };

// Solo para la administración: a qué empresa va la oferta.
const companies = ref<CompanyOption[]>([]);
const socioId = ref<number | ''>('');
const companyName = ref('');

// Se llega desde "Reabrir" en la lista cuando la fecha de cierre ya pasó.
const reopening = route.query.reabrir === '1';

const offer = ref<OwnOffer | Offer | null>(null);
const categories = ref<Category[]>([]);
const loading = ref(true);
const loadError = ref('');
const saving = ref(false);

type Form = {
  titulo: string;
  descripcion: string;
  ubicacion: string;
  modalidad: OfferModality | '';
  cantidadVacantes: number | string;
  fechaCierre: string;
  estado: OfferFormData['estado'];
  categoriaIds: number[];
};

type Field = keyof Form;

const form = reactive<Form>({
  titulo: '',
  descripcion: '',
  ubicacion: '',
  modalidad: '',
  cantidadVacantes: 1,
  fechaCierre: '',
  estado: 'ACTIVA',
  categoriaIds: [],
});

const touched = reactive<Partial<Record<Field | 'socioId', boolean>>>({});
const submitted = ref(false);

// Lo guardado, en el formato del formulario, para saber qué cambió.
const initial = ref<Form | null>(null);

function toForm(data: OwnOffer | Offer): Form {
  return {
    titulo: data.titulo,
    descripcion: data.descripcion,
    ubicacion: data.ubicacion ?? '',
    modalidad: data.modalidad ?? '',
    cantidadVacantes: data.cantidadVacantes,
    fechaCierre: data.fechaCierre ? uruguayDay(data.fechaCierre) : '',
    estado: data.estado,
    categoriaIds: data.categorias.map(({ categoriaId }) => categoriaId),
  };
}

function fillForm(values: Form) {
  Object.assign(form, { ...values, categoriaIds: [...values.categoriaIds] });

  for (const key of Object.keys(touched) as Field[]) touched[key] = false;

  submitted.value = false;
}

async function load() {
  try {
    loading.value = true;
    loadError.value = '';

    if (
      isEdit.value &&
      !(Number.isInteger(offerId.value) && offerId.value! > 0)
    ) {
      throw new Error('Oferta no encontrada');
    }

    const [allCategories, existing] = await Promise.all([
      getCategories(),
      loadExisting(),
      isAdminForm.value && !isEdit.value ? loadCompanies() : null,
    ]);

    categories.value = allCategories;
    offer.value = existing;

    if (existing && 'socio' in existing) {
      companyName.value = existing.socio.razonSocial;
    }

    if (existing) {
      initial.value = toForm(existing);
      fillForm(initial.value);

      if (reopening && existing.estado === 'CERRADA') {
        form.estado = 'ACTIVA';
        touched.fechaCierre = true;
      }
    } else {
      initial.value = null;
    }
  } catch (err) {
    loadError.value =
      err instanceof Error ? err.message : 'No se pudo cargar la oferta';
  } finally {
    loading.value = false;
  }
}

function loadExisting() {
  if (!isEdit.value) return Promise.resolve(null);

  return isAdminForm.value
    ? getOffer(offerId.value!)
    : getMyOffer(offerId.value!);
}

/** Las empresas activas, para elegir a cuál va la oferta. */
async function loadCompanies() {
  const members = await getMembers();

  companies.value = members
    .filter((member) => isFullMember(member) && member.usuario.activo)
    .map(({ id, razonSocial }) => ({ id, razonSocial }))
    .sort((a, b) => a.razonSocial.localeCompare(b.razonSocial, 'es'));

  // Desde la ficha de un socio se llega con la empresa ya elegida.
  const preset = Number(route.query.socio);

  if (companies.value.some((company) => company.id === preset)) {
    socioId.value = preset;
  }
}

onMounted(load);

/**
 * Categorías que se pueden elegir: las activas, más las desactivadas que la
 * oferta ya tenía (el backend las conserva, pero no deja agregarlas).
 */
const selectableCategories = computed(() => {
  const current = initial.value?.categoriaIds ?? [];

  return categories.value.filter(
    (category) => category.activa || current.includes(category.id),
  );
});

function toggleCategory(id: number) {
  const index = form.categoriaIds.indexOf(id);

  if (index === -1) form.categoriaIds.push(id);
  else form.categoriaIds.splice(index, 1);

  touched.categoriaIds = true;
}

const today = computed(() => uruguayDay());

/** Datos del formulario ya normalizados, como los recibe la API. */
const normalized = computed<OfferFormData>(() => ({
  titulo: form.titulo.trim(),
  descripcion: form.descripcion.trim(),
  ubicacion: form.ubicacion.trim() || null,
  modalidad: form.modalidad || null,
  cantidadVacantes: Number(form.cantidadVacantes),
  fechaCierre: form.fechaCierre || null,
  estado: form.estado,
  categoriaIds: [...form.categoriaIds].sort((a, b) => a - b),
}));

const initialNormalized = computed<OfferFormData | null>(() => {
  const values = initial.value;

  if (!values) return null;

  return {
    titulo: values.titulo,
    descripcion: values.descripcion,
    ubicacion: values.ubicacion || null,
    modalidad: values.modalidad || null,
    cantidadVacantes: Number(values.cantidadVacantes),
    fechaCierre: values.fechaCierre || null,
    estado: values.estado,
    categoriaIds: [...values.categoriaIds].sort((a, b) => a - b),
  };
});

/** En edición, solo lo que cambió respecto de lo guardado. */
const changes = computed<UpdateOfferData>(() => {
  const before = initialNormalized.value;
  const after = normalized.value;

  if (!before) return after;

  const result: Record<string, unknown> = {};

  for (const key of Object.keys(after) as (keyof OfferFormData)[]) {
    if (JSON.stringify(after[key]) !== JSON.stringify(before[key])) {
      result[key] = after[key];
    }
  }

  return result as UpdateOfferData;
});

const isDirty = computed(() => {
  if (isEdit.value) return Object.keys(changes.value).length > 0;

  // Una oferta nueva está "sucia" si se escribió algo.
  return (
    (isAdminForm.value && socioId.value !== '' && !route.query.socio) ||
    form.titulo.trim() !== '' ||
    form.descripcion.trim() !== '' ||
    form.ubicacion.trim() !== '' ||
    form.categoriaIds.length > 0 ||
    form.fechaCierre !== ''
  );
});

/*
 * Las mismas reglas que aplica el backend: validarlas acá evita el viaje de
 * ida y vuelta, pero la última palabra la tiene la API.
 */
const errors = computed(() => {
  const data = normalized.value;
  const result: Partial<Record<Field | 'socioId', string>> = {};

  if (isAdminForm.value && !isEdit.value && socioId.value === '') {
    result.socioId = 'Elegí la empresa que publica la oferta';
  }

  if (!data.titulo) result.titulo = 'El título es obligatorio';
  else if (data.titulo.length > TITLE_MAX) {
    result.titulo = `El título no puede superar los ${TITLE_MAX} caracteres`;
  }

  if (data.categoriaIds.length === 0) {
    result.categoriaIds = 'Elegí al menos una categoría';
  }

  if (!data.modalidad) result.modalidad = 'Elegí la modalidad de trabajo';

  if (data.ubicacion && data.ubicacion.length > LOCATION_MAX) {
    result.ubicacion = `La ubicación no puede superar los ${LOCATION_MAX} caracteres`;
  }

  if (
    !Number.isInteger(data.cantidadVacantes) ||
    data.cantidadVacantes < 1 ||
    data.cantidadVacantes > VACANCIES_MAX
  ) {
    result.cantidadVacantes = `Ingresá un número entre 1 y ${VACANCIES_MAX}`;
  }

  // Una fecha vencida que ya estaba guardada no impide editar otros datos de
  // una oferta cerrada; sí impide elegirla de nuevo o reabrir con ella.
  const dateChanged = !isEdit.value || 'fechaCierre' in changes.value;
  const reopeningNow =
    data.estado === 'ACTIVA' && initialNormalized.value?.estado === 'CERRADA';

  if (
    data.fechaCierre &&
    data.fechaCierre < today.value &&
    (dateChanged || reopeningNow)
  ) {
    result.fechaCierre = reopeningNow
      ? 'Para reabrir la oferta, elegí una fecha a partir de hoy o quitala'
      : 'La fecha de cierre no puede ser anterior a hoy';
  }

  if (!data.descripcion) result.descripcion = 'La descripción es obligatoria';
  else if (data.descripcion.length > DESCRIPTION_MAX) {
    result.descripcion = `La descripción no puede superar los ${DESCRIPTION_MAX} caracteres`;
  }

  return result;
});

const hasErrors = computed(() => Object.keys(errors.value).length > 0);

function visibleError(field: Field | 'socioId') {
  return touched[field] || submitted.value ? errors.value[field] : '';
}

function fieldClass(field: Field | 'socioId') {
  return visibleError(field)
    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
    : 'border-slate-200 focus:border-ccisj focus:ring-emerald-100';
}

let leaving = false;

async function handleSubmit() {
  submitted.value = true;

  if (saving.value || hasErrors.value) return;
  if (isEdit.value && !isDirty.value) return;

  try {
    saving.value = true;

    let savedId = offerId.value;

    if (isEdit.value) {
      await updateOffer(offerId.value!, changes.value);
      toast.success('Oferta actualizada');
    } else {
      const { estado: _estado, ...data } = normalized.value;

      const created = await createOffer(
        isAdminForm.value ? { ...data, socioId: Number(socioId.value) } : data,
      );
      savedId = created.id;
      toast.success('Oferta publicada');
    }

    leaving = true;

    if (isAdminForm.value) {
      router.push({ name: 'oferta-detalle', params: { id: savedId } });
    } else {
      router.push({ name: 'mis-ofertas' });
    }
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudo guardar la oferta. Intentá nuevamente.',
    );
  } finally {
    saving.value = false;
  }
}

function discardChanges() {
  if (initial.value) fillForm(initial.value);
}

const backLabel = computed(() => {
  if (!isAdminForm.value) return 'Volver a mis ofertas';

  return isEdit.value ? 'Volver a la oferta' : 'Volver a ofertas laborales';
});

function goBack() {
  if (!isAdminForm.value) {
    router.push({ name: 'mis-ofertas' });
  } else if (isEdit.value) {
    router.push({ name: 'oferta-detalle', params: { id: offerId.value } });
  } else {
    router.push({ name: 'ofertas' });
  }
}

// No perder lo escrito al navegar dentro del sistema o al cerrar la pestaña.
onBeforeRouteLeave(() => {
  if (leaving || !isDirty.value) return true;

  return window.confirm(
    'Tenés cambios sin guardar en la oferta. ¿Salir igual?',
  );
});

function warnBeforeUnload(event: BeforeUnloadEvent) {
  if (isDirty.value) event.preventDefault();
}

onMounted(() => window.addEventListener('beforeunload', warnBeforeUnload));
onBeforeUnmount(() =>
  window.removeEventListener('beforeunload', warnBeforeUnload),
);

const inputClass =
  'w-full rounded-xl border px-3 py-2.5 text-base outline-none transition focus:ring-2';

const labelClass = 'mb-2 block text-base font-medium text-slate-700';
</script>

<template>
  <div class="space-y-5">
    <div>
      <button
        type="button"
        class="mb-3 flex items-center gap-2 text-base font-medium text-slate-600 transition hover:text-ccisj"
        @click="goBack"
      >
        <ArrowLeft class="h-4 w-4" />
        {{ backLabel }}
      </button>

      <h1 class="text-3xl font-bold text-slate-900">
        {{ isEdit ? 'Editar oferta' : 'Publicar oferta' }}
      </h1>

      <p class="mt-1 text-base text-slate-600">
        {{
          isEdit
            ? 'Los cambios se ven apenas los guardás.'
            : isAdminForm
              ? 'Se publica a nombre de la empresa que elijas: los postulantes la ven como una oferta más de esa empresa.'
              : 'La oferta queda publicada al guardarla y los postulantes pueden postularse enseguida.'
        }}
      </p>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-base text-slate-600"
    >
      Cargando...
    </div>

    <!-- Error -->
    <div
      v-else-if="loadError"
      class="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
    >
      <p class="text-base text-red-700">{{ loadError }}</p>

      <div class="mt-3 flex justify-center gap-2">
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-base font-medium text-red-700 transition hover:bg-red-50"
          @click="load"
        >
          <RefreshCw class="h-4 w-4" />
          Reintentar
        </button>

        <button
          type="button"
          class="rounded-lg border border-slate-200 bg-white px-3 py-2 text-base font-medium text-slate-600 transition hover:bg-slate-50"
          @click="goBack"
        >
          {{ backLabel }}
        </button>
      </div>
    </div>

    <form v-else class="space-y-5" novalidate @submit.prevent="handleSubmit">
      <!-- Aviso al reabrir una oferta vencida -->
      <div
        v-if="reopening && offer && initial?.estado === 'CERRADA'"
        class="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-base text-amber-800"
      >
        <Info class="mt-0.5 h-4 w-4 shrink-0" />

        <p>
          La fecha de cierre de esta oferta ({{
            formatDate(initial.fechaCierre)
          }}) ya pasó. Para reabrirla, elegí una nueva fecha o quitala y guardá.
        </p>
      </div>

      <!-- Resumen de la oferta en edición -->
      <div
        v-if="offer"
        class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-white px-5 py-4 text-base"
      >
        <span class="text-slate-600">
          Publicada el
          <span class="font-medium text-slate-700">{{
            formatDate(uruguayDay(offer.fechaPublicacion))
          }}</span>
        </span>

        <span
          v-if="companyName"
          class="flex items-center gap-1.5 font-medium text-slate-800"
        >
          <Building2 class="h-4 w-4 text-slate-600" />
          {{ companyName }}
        </span>

        <span v-if="'_count' in offer" class="text-slate-600">
          <span class="font-semibold text-slate-800">{{
            offer._count.postulaciones
          }}</span>
          {{
            offer._count.postulaciones === 1 ? 'postulación' : 'postulaciones'
          }}
        </span>
      </div>

      <!-- La empresa (solo la administración, al publicar) -->
      <div
        v-if="isAdminForm && !isEdit"
        class="rounded-xl border border-slate-200 bg-white p-5"
      >
        <label for="oferta-empresa" :class="labelClass">Empresa</label>

        <select
          id="oferta-empresa"
          v-model="socioId"
          :aria-invalid="!!visibleError('socioId')"
          aria-describedby="oferta-empresa-ayuda"
          :class="[inputClass, fieldClass('socioId'), 'bg-white']"
          @blur="touched.socioId = true"
        >
          <option value="" disabled>Elegí una empresa socia</option>
          <option
            v-for="company in companies"
            :key="company.id"
            :value="company.id"
          >
            {{ company.razonSocial }}
          </option>
        </select>

        <p
          id="oferta-empresa-ayuda"
          class="mt-1 text-sm"
          :class="visibleError('socioId') ? 'text-red-700' : 'text-slate-600'"
        >
          {{
            visibleError('socioId') ||
            'Solo las empresas activas. Escribí las primeras letras para encontrarla.'
          }}
        </p>
      </div>

      <!-- El puesto -->
      <fieldset class="rounded-xl border border-slate-200 bg-white p-5">
        <legend class="px-1 text-sm font-semibold text-slate-600">
          El puesto
        </legend>

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div class="md:col-span-2">
            <label for="oferta-titulo" :class="labelClass">Título</label>

            <input
              id="oferta-titulo"
              v-model="form.titulo"
              type="text"
              :maxlength="TITLE_MAX"
              placeholder="Ej. Auxiliar administrativo"
              :aria-invalid="!!visibleError('titulo')"
              aria-describedby="oferta-titulo-ayuda"
              :class="[inputClass, fieldClass('titulo')]"
              @blur="touched.titulo = true"
            />

            <p
              id="oferta-titulo-ayuda"
              class="mt-1 text-sm"
              :class="
                visibleError('titulo') ? 'text-red-700' : 'text-slate-600'
              "
            >
              {{
                visibleError('titulo') || 'El nombre del puesto, claro y breve.'
              }}
            </p>
          </div>

          <div class="md:col-span-2">
            <span :class="labelClass" id="oferta-categorias">Categorías</span>

            <div
              v-if="selectableCategories.length > 0"
              role="group"
              aria-labelledby="oferta-categorias"
              class="flex flex-wrap gap-2"
            >
              <button
                v-for="category in selectableCategories"
                :key="category.id"
                type="button"
                :aria-pressed="form.categoriaIds.includes(category.id)"
                class="rounded-full border px-3 py-1.5 text-base transition"
                :class="
                  form.categoriaIds.includes(category.id)
                    ? 'border-ccisj bg-ccisj-light font-medium text-ccisj'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                "
                :title="
                  category.activa
                    ? category.descripcion || undefined
                    : 'Categoría dada de baja: se puede mantener, pero no volver a elegir'
                "
                @click="toggleCategory(category.id)"
              >
                {{ category.nombre }}
                <span v-if="!category.activa" class="text-sm text-slate-600">
                  (dada de baja)
                </span>
              </button>
            </div>

            <p v-else class="text-base text-slate-600">
              No hay categorías disponibles. Pedile a la administración que las
              cargue.
            </p>

            <p
              v-if="visibleError('categoriaIds')"
              class="mt-1 text-sm text-red-700"
            >
              {{ visibleError('categoriaIds') }}
            </p>
          </div>

          <div>
            <label for="oferta-modalidad" :class="labelClass">Modalidad</label>

            <select
              id="oferta-modalidad"
              v-model="form.modalidad"
              :aria-invalid="!!visibleError('modalidad')"
              :class="[inputClass, fieldClass('modalidad'), 'bg-white']"
              @blur="touched.modalidad = true"
            >
              <option value="" disabled>Elegí una modalidad</option>

              <option
                v-for="(label, value) in OFFER_MODALITY_LABELS"
                :key="value"
                :value="value"
              >
                {{ label }}
              </option>
            </select>

            <p
              v-if="visibleError('modalidad')"
              class="mt-1 text-sm text-red-700"
            >
              {{ visibleError('modalidad') }}
            </p>
          </div>

          <div>
            <label for="oferta-ubicacion" :class="labelClass">
              Ubicación
              <span class="font-normal text-slate-600">(opcional)</span>
            </label>

            <input
              id="oferta-ubicacion"
              v-model="form.ubicacion"
              type="text"
              :maxlength="LOCATION_MAX"
              placeholder="Ej. San José de Mayo"
              :aria-invalid="!!visibleError('ubicacion')"
              :class="[inputClass, fieldClass('ubicacion')]"
              @blur="touched.ubicacion = true"
            />

            <p
              v-if="visibleError('ubicacion')"
              class="mt-1 text-sm text-red-700"
            >
              {{ visibleError('ubicacion') }}
            </p>
          </div>

          <div>
            <label for="oferta-vacantes" :class="labelClass">Vacantes</label>

            <input
              id="oferta-vacantes"
              v-model.number="form.cantidadVacantes"
              type="number"
              inputmode="numeric"
              min="1"
              :max="VACANCIES_MAX"
              step="1"
              :aria-invalid="!!visibleError('cantidadVacantes')"
              :class="[inputClass, fieldClass('cantidadVacantes')]"
              @blur="touched.cantidadVacantes = true"
            />

            <p
              v-if="visibleError('cantidadVacantes')"
              class="mt-1 text-sm text-red-700"
            >
              {{ visibleError('cantidadVacantes') }}
            </p>
          </div>

          <div>
            <label for="oferta-cierre" :class="labelClass">
              Fecha de cierre
              <span class="font-normal text-slate-600">(opcional)</span>
            </label>

            <div class="flex gap-2">
              <input
                id="oferta-cierre"
                v-model="form.fechaCierre"
                type="date"
                :min="today"
                :aria-invalid="!!visibleError('fechaCierre')"
                aria-describedby="oferta-cierre-ayuda"
                :class="[inputClass, fieldClass('fechaCierre')]"
                @blur="touched.fechaCierre = true"
              />

              <button
                v-if="form.fechaCierre"
                type="button"
                class="shrink-0 rounded-xl border border-slate-200 px-3 text-base font-medium text-slate-600 transition hover:bg-slate-50"
                @click="
                  form.fechaCierre = '';
                  touched.fechaCierre = true;
                "
              >
                Quitar
              </button>
            </div>

            <p
              id="oferta-cierre-ayuda"
              class="mt-1 text-sm"
              :class="
                visibleError('fechaCierre') ? 'text-red-700' : 'text-slate-600'
              "
            >
              {{
                visibleError('fechaCierre') ||
                (form.fechaCierre
                  ? 'Recibe postulaciones hasta ese día inclusive y después se cierra sola.'
                  : 'Sin fecha, queda abierta hasta que la cierres.')
              }}
            </p>
          </div>

          <div class="md:col-span-2">
            <label for="oferta-descripcion" :class="labelClass">
              Descripción del puesto
            </label>

            <textarea
              id="oferta-descripcion"
              v-model="form.descripcion"
              rows="8"
              :maxlength="DESCRIPTION_MAX"
              placeholder="Tareas, requisitos, horario y condiciones..."
              :aria-invalid="!!visibleError('descripcion')"
              aria-describedby="oferta-descripcion-ayuda"
              :class="[inputClass, fieldClass('descripcion'), 'resize-y']"
              @blur="touched.descripcion = true"
            />

            <p
              id="oferta-descripcion-ayuda"
              class="mt-1 flex justify-between gap-3 text-sm"
            >
              <span
                :class="
                  visibleError('descripcion')
                    ? 'text-red-700'
                    : 'text-slate-600'
                "
              >
                {{ visibleError('descripcion') }}
              </span>

              <span class="shrink-0 tabular-nums text-slate-600">
                {{ form.descripcion.trim().length }} / {{ DESCRIPTION_MAX }}
              </span>
            </p>
          </div>
        </div>
      </fieldset>

      <!-- Estado (solo al editar) -->
      <fieldset
        v-if="isEdit"
        class="rounded-xl border border-slate-200 bg-white p-5"
      >
        <legend class="px-1 text-sm font-semibold text-slate-600">
          Estado
        </legend>

        <div class="flex flex-wrap gap-3">
          <label
            v-for="option in [
              {
                value: 'ACTIVA',
                label: 'Activa',
                hint: 'Visible y recibiendo postulaciones',
              },
              {
                value: 'CERRADA',
                label: 'Cerrada',
                hint: 'No recibe postulaciones nuevas',
              },
            ] as const"
            :key="option.value"
            class="flex min-w-56 flex-1 cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition"
            :class="
              form.estado === option.value
                ? 'border-ccisj bg-ccisj-light'
                : 'border-slate-200 hover:bg-slate-50'
            "
          >
            <input
              v-model="form.estado"
              type="radio"
              name="oferta-estado"
              :value="option.value"
              class="mt-0.5 accent-ccisj"
            />

            <span>
              <span class="block text-base font-medium text-slate-800">
                {{ option.label }}
              </span>
              <span class="block text-sm text-slate-600">{{
                option.hint
              }}</span>
            </span>
          </label>
        </div>
      </fieldset>

      <div class="flex flex-wrap items-center justify-end gap-3">
        <p v-if="isEdit && isDirty" class="mr-auto text-sm text-slate-600">
          Tenés cambios sin guardar.
        </p>

        <button
          v-if="isEdit"
          type="button"
          :disabled="!isDirty || saving"
          class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          @click="discardChanges"
        >
          Descartar cambios
        </button>

        <button
          v-else
          type="button"
          class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-semibold text-slate-600 transition hover:bg-slate-50"
          @click="goBack"
        >
          Cancelar
        </button>

        <button
          type="submit"
          :disabled="saving || (isEdit && !isDirty) || (submitted && hasErrors)"
          class="flex items-center gap-2 rounded-xl bg-ccisj px-5 py-2.5 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save class="h-4 w-4" />

          {{
            saving
              ? 'Guardando...'
              : isEdit
                ? 'Guardar cambios'
                : 'Publicar oferta'
          }}
        </button>
      </div>
    </form>
  </div>
</template>
