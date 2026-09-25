<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import { onBeforeRouteLeave } from 'vue-router';

import { Lock, RefreshCw, Save } from 'lucide-vue-next';

import { getMyCompany, updateMyCompany } from '@/services/membersService';

import { useToastStore } from '@/stores/toast';

import type {
  OwnMember,
  OwnMemberEditableField,
  UpdateOwnMemberData,
} from '@/types/member.type';

import { formatDate } from '@/utils/money';

const toast = useToastStore();

const socio = ref<OwnMember | null>(null);
const loading = ref(true);
const loadError = ref('');
const saving = ref(false);

type Form = Record<OwnMemberEditableField, string>;

const FIELDS: OwnMemberEditableField[] = [
  'telefono',
  'celular',
  'email',
  'direccion',
  'ciudad',
  'numeroBps',
];

const form = reactive<Form>({
  telefono: '',
  celular: '',
  email: '',
  direccion: '',
  ciudad: '',
  numeroBps: '',
});

// Los errores se muestran recién cuando el campo se tocó o se intentó
// guardar, para no marcar en rojo lo que el socio todavía no escribió.
const touched = reactive<Partial<Record<OwnMemberEditableField, boolean>>>({});
const submitted = ref(false);

function fillForm(data: OwnMember) {
  for (const field of FIELDS) {
    form[field] = data[field];
    touched[field] = false;
  }

  submitted.value = false;
}

async function loadCompany() {
  try {
    loading.value = true;
    loadError.value = '';

    socio.value = await getMyCompany();
    fillForm(socio.value);
  } catch (err) {
    loadError.value =
      err instanceof Error
        ? err.message
        : 'No se pudieron cargar los datos de tu empresa';
  } finally {
    loading.value = false;
  }
}

onMounted(loadCompany);

/*
 * Las mismas reglas que aplica el backend: validarlas acá solo evita el viaje
 * de ida y vuelta, la última palabra la tiene la API.
 */
const PHONE_PATTERN = /^\+?[\d\s()-]{6,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(field: OwnMemberEditableField, raw: string) {
  const value = raw.trim();

  switch (field) {
    case 'telefono':
    case 'celular': {
      const label = field === 'telefono' ? 'El teléfono' : 'El celular';

      if (!value) return `${label} es obligatorio`;
      if (value.length > 20)
        return `${label} no puede superar los 20 caracteres`;
      if (!PHONE_PATTERN.test(value)) {
        return `${label} solo puede tener números, espacios, +, - y paréntesis`;
      }

      return '';
    }

    case 'email':
      if (!value) return 'El email de contacto es obligatorio';
      if (value.length > 255) return 'El email es demasiado largo';
      if (!EMAIL_PATTERN.test(value))
        return 'El email de contacto no es válido';

      return '';

    case 'direccion':
      if (!value) return 'La dirección es obligatoria';
      if (value.length > 150) {
        return 'La dirección no puede superar los 150 caracteres';
      }

      return '';

    case 'ciudad':
      if (!value) return 'La ciudad es obligatoria';
      if (value.length > 80)
        return 'La ciudad no puede superar los 80 caracteres';

      return '';

    case 'numeroBps':
      if (!value) return 'El número de BPS es obligatorio';
      if (!/^\d{7,12}$/.test(value)) {
        return 'El número de BPS debe tener entre 7 y 12 números';
      }

      return '';
  }
}

/** Solo los campos que cambiaron respecto de lo guardado. */
const changes = computed<UpdateOwnMemberData>(() => {
  const data = socio.value;
  const result: UpdateOwnMemberData = {};

  if (!data) return result;

  for (const field of FIELDS) {
    const value = form[field].trim();

    if (value !== data[field]) {
      result[field] = value;
    }
  }

  return result;
});

const isDirty = computed(() => Object.keys(changes.value).length > 0);

// Se validan solo los campos modificados: si un dato ya guardado no cumple
// el formato (cargado antes de estas reglas), no impide cambiar los demás.
const errors = computed(() => {
  const result: Partial<Record<OwnMemberEditableField, string>> = {};

  for (const field of Object.keys(changes.value) as OwnMemberEditableField[]) {
    const message = validate(field, form[field]);

    if (message) result[field] = message;
  }

  return result;
});

const hasErrors = computed(() => Object.keys(errors.value).length > 0);

function visibleError(field: OwnMemberEditableField) {
  return touched[field] || submitted.value ? errors.value[field] : '';
}

function discardChanges() {
  if (socio.value) fillForm(socio.value);
}

async function handleSubmit() {
  submitted.value = true;

  if (!isDirty.value || hasErrors.value || saving.value) return;

  try {
    saving.value = true;

    socio.value = await updateMyCompany(changes.value);
    fillForm(socio.value);

    toast.success('Datos de la empresa actualizados');
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudieron guardar los cambios. Intentá nuevamente.',
    );
  } finally {
    saving.value = false;
  }
}

// No perder cambios sin guardar al navegar dentro del sistema o al cerrar
// la pestaña.
onBeforeRouteLeave(() => {
  if (!isDirty.value) return true;

  return window.confirm(
    'Tenés cambios sin guardar en los datos de tu empresa. ¿Salir igual?',
  );
});

function warnBeforeUnload(event: BeforeUnloadEvent) {
  if (isDirty.value) event.preventDefault();
}

onMounted(() => window.addEventListener('beforeunload', warnBeforeUnload));
onBeforeUnmount(() =>
  window.removeEventListener('beforeunload', warnBeforeUnload),
);

const editableFields: {
  field: OwnMemberEditableField;
  label: string;
  type: string;
  autocomplete: string;
  inputmode?: 'numeric' | 'tel' | 'email';
  maxlength?: number;
  hint?: string;
  wide?: boolean;
}[] = [
  {
    field: 'telefono',
    label: 'Teléfono',
    type: 'tel',
    autocomplete: 'tel',
    inputmode: 'tel',
  },
  {
    field: 'celular',
    label: 'Celular',
    type: 'tel',
    autocomplete: 'tel',
    inputmode: 'tel',
  },
  {
    field: 'email',
    label: 'Email de contacto',
    type: 'email',
    autocomplete: 'email',
    inputmode: 'email',
    wide: true,
  },
  {
    field: 'direccion',
    label: 'Dirección',
    type: 'text',
    autocomplete: 'street-address',
  },
  {
    field: 'ciudad',
    label: 'Ciudad / Localidad',
    type: 'text',
    autocomplete: 'address-level2',
  },
  {
    field: 'numeroBps',
    label: 'Nº BPS',
    type: 'text',
    autocomplete: 'off',
    inputmode: 'numeric',
    maxlength: 12,
    hint: 'Número de empresa en el Banco de Previsión Social, de 7 a 12 números.',
  },
];

const readOnlyFields = computed(() => {
  const data = socio.value;

  if (!data) return [];

  return [
    { label: 'Razón social', value: data.razonSocial },
    { label: 'Titular', value: data.titular },
    { label: 'Giro comercial', value: data.giroComercial },
    { label: 'RUT', value: data.rut },
    {
      label: 'Tipo de socio',
      value: data.tipo === 'DIRECTIVO' ? 'Directivo' : 'Común',
    },
    {
      label: 'Inicio de actividad',
      value: formatDate(data.fechaInicioEmpresa),
    },
    { label: 'Socio desde', value: formatDate(data.fechaAfiliacion) },
  ];
});

const inputClass =
  'w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition focus:ring-2';

const labelClass = 'mb-2 block text-sm font-medium text-slate-700';
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Mi empresa</h1>

      <p class="mt-1 text-sm text-slate-500">
        Mantené al día los datos de contacto de tu empresa.
      </p>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"
    >
      Cargando datos de la empresa...
    </div>

    <!-- Error -->
    <div
      v-else-if="loadError || !socio"
      class="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
    >
      <p class="text-sm text-red-600">
        {{ loadError || 'No se encontraron los datos de tu empresa' }}
      </p>

      <button
        type="button"
        class="mx-auto mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        @click="loadCompany"
      >
        <RefreshCw class="h-4 w-4" />
        Reintentar
      </button>
    </div>

    <template v-else>
      <!-- Encabezado -->
      <div
        class="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-5"
      >
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ccisj-light text-sm font-bold text-ccisj"
        >
          {{ socio.razonSocial.slice(0, 2).toUpperCase() }}
        </div>

        <div class="min-w-0 flex-1">
          <p class="truncate text-lg font-semibold text-slate-900">
            {{ socio.razonSocial }}
          </p>

          <p class="mt-0.5 truncate text-sm text-slate-500">
            {{ socio.giroComercial }}
          </p>
        </div>

        <span
          class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
          :class="
            socio.tipo === 'DIRECTIVO'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-slate-100 text-slate-600'
          "
        >
          {{ socio.tipo === 'DIRECTIVO' ? 'Socio directivo' : 'Socio común' }}
        </span>
      </div>

      <!-- Datos editables -->
      <form
        class="rounded-xl border border-slate-200 bg-white p-5"
        novalidate
        @submit.prevent="handleSubmit"
      >
        <h2
          class="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400"
        >
          Contacto y BPS
        </h2>

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div
            v-for="item in editableFields"
            :key="item.field"
            :class="{ 'md:col-span-2': item.wide }"
          >
            <label :for="`mi-empresa-${item.field}`" :class="labelClass">
              {{ item.label }}
            </label>

            <input
              :id="`mi-empresa-${item.field}`"
              v-model="form[item.field]"
              :type="item.type"
              :autocomplete="item.autocomplete"
              :inputmode="item.inputmode"
              :maxlength="item.maxlength"
              :aria-invalid="!!visibleError(item.field)"
              :aria-describedby="`mi-empresa-${item.field}-ayuda`"
              :class="[
                inputClass,
                visibleError(item.field)
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-slate-200 focus:border-ccisj focus:ring-emerald-100',
              ]"
              @blur="touched[item.field] = true"
            />

            <p
              :id="`mi-empresa-${item.field}-ayuda`"
              class="mt-1 text-xs"
              :class="
                visibleError(item.field) ? 'text-red-600' : 'text-slate-400'
              "
            >
              <template v-if="visibleError(item.field)">
                {{ visibleError(item.field) }}
              </template>

              <template v-else-if="item.field === 'email'">
                Es el email donde el Centro Comercial se comunica con tu
                empresa. Para iniciar sesión seguís usando
                <span class="font-medium text-slate-500">{{
                  socio.usuario.email
                }}</span
                >.
              </template>

              <template v-else-if="item.hint">{{ item.hint }}</template>
            </p>
          </div>
        </div>

        <div
          class="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-slate-100 pt-4"
        >
          <p v-if="isDirty" class="mr-auto text-xs text-slate-500">
            Tenés cambios sin guardar.
          </p>

          <button
            type="button"
            :disabled="!isDirty || saving"
            class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            @click="discardChanges"
          >
            Descartar cambios
          </button>

          <button
            type="submit"
            :disabled="!isDirty || saving || (submitted && hasErrors)"
            class="flex items-center gap-2 rounded-xl bg-ccisj px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save class="h-4 w-4" />

            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </form>

      <!-- Datos de solo lectura -->
      <div class="rounded-xl border border-slate-200 bg-white p-5">
        <div class="mb-4 flex items-center gap-2">
          <Lock class="h-3.5 w-3.5 text-slate-400" />

          <h2
            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            Datos de la afiliación
          </h2>
        </div>

        <dl
          class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div v-for="field in readOnlyFields" :key="field.label">
            <dt class="text-xs text-slate-400">{{ field.label }}</dt>

            <dd class="mt-0.5 break-words text-sm text-slate-800">
              {{ field.value || '—' }}
            </dd>
          </div>
        </dl>

        <p class="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          Estos datos los gestiona la administración del Centro Comercial. Si
          alguno no es correcto, comunicate con la administración para
          corregirlo.
        </p>
      </div>
    </template>
  </div>
</template>
