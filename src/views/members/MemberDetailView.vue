<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Pencil, RefreshCw } from 'lucide-vue-next';

import { getMember, isFullMember } from '@/services/membersService';
import type { Member, MemberDirectoryEntry } from '@/types/member.type';
import { formatDate } from '@/utils/format';

const route = useRoute();
const router = useRouter();

const socio = ref<Member | MemberDirectoryEntry | null>(null);

// Un directivo recibe solo el directorio: sin RUT, BPS, observaciones ni
// estado de la cuenta.
const fullMember = computed(() =>
  socio.value && isFullMember(socio.value) ? socio.value : null,
);

const loading = ref(true);
const error = ref('');

async function loadMember() {
  const id = Number(route.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    error.value = 'El identificador del socio no es válido';
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    error.value = '';

    socio.value = await getMember(id);
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'No se pudo cargar el socio';
  } finally {
    loading.value = false;
  }
}

onMounted(loadMember);

type Field = { label: string; value: string };

/**
 * El detalle agrupa los campos por tema en vez de listar los quince seguidos:
 * quien abre la ficha busca "los datos de contacto", no el campo 9.
 */
const sections = computed(() => {
  const data = socio.value;

  if (!data) return [];

  const full = fullMember.value;

  const empresa: Field[] = [
    { label: 'Razón social', value: data.razonSocial },
    { label: 'Titular', value: data.titular },
    { label: 'Giro comercial', value: data.giroComercial },
  ];

  const afiliacion: Field[] = [
    {
      label: 'Tipo de socio',
      value: data.tipo === 'DIRECTIVO' ? 'Directivo' : 'Común',
    },
    { label: 'Fecha de afiliación', value: formatDate(data.fechaAfiliacion) },
  ];

  if (full) {
    empresa.push(
      { label: 'RUT', value: full.rut },
      { label: 'Nº BPS', value: full.numeroBps },
      {
        label: 'Inicio de actividad',
        value: formatDate(full.fechaInicioEmpresa),
      },
    );

    // El estado de la cuenta ya lo dice la etiqueta del encabezado: desde
    // que `Member.activo` se fue, el socio está activo si su usuario lo
    // está, y repetirlo acá es decir lo mismo dos veces.
    afiliacion.push({ label: 'Email de la cuenta', value: full.usuario.email });
  }

  return [
    {
      title: 'Datos de la empresa',
      fields: empresa,
    },
    {
      title: 'Contacto',
      fields: [
        { label: 'Teléfono', value: data.telefono },
        { label: 'Celular', value: data.celular },
        { label: 'Email', value: data.email },
        { label: 'Dirección', value: data.direccion },
        { label: 'Ciudad', value: data.ciudad },
      ],
    },
    {
      title: 'Afiliación',
      fields: afiliacion,
    },
  ];
});

function goBack() {
  router.push({ name: 'socios' });
}
</script>

<template>
  <div class="space-y-5">
    <button
      type="button"
      class="flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-ccisj"
      @click="goBack"
    >
      <ArrowLeft class="h-4 w-4" />
      Volver a socios
    </button>

    <!-- Loading -->
    <div
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"
    >
      Cargando socio...
    </div>

    <!-- Error -->
    <div
      v-else-if="error || !socio"
      class="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
    >
      <p class="text-sm text-red-600">
        {{ error || 'No se encontró el socio' }}
      </p>

      <button
        type="button"
        class="mx-auto mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        @click="loadMember"
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
          <h1 class="truncate text-2xl font-bold text-slate-900">
            {{ socio.razonSocial }}
          </h1>

          <p class="mt-0.5 truncate text-sm text-slate-500">
            {{ socio.giroComercial || 'Sin giro comercial' }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
            :class="
              socio.tipo === 'DIRECTIVO'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-slate-100 text-slate-600'
            "
          >
            {{ socio.tipo === 'DIRECTIVO' ? 'Directivo' : 'Común' }}
          </span>

          <span
            v-if="fullMember"
            class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
            :class="
              fullMember.usuario.activo
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-600'
            "
          >
            {{ fullMember.usuario.activo ? 'Activo' : 'Inactivo' }}
          </span>

          <button
            v-if="fullMember"
            type="button"
            class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-ccisj hover:text-ccisj"
            @click="
              router.push({ name: 'socio-editar', params: { id: socio.id } })
            "
          >
            <Pencil class="h-4 w-4" />
            Editar
          </button>
        </div>
      </div>

      <!-- Fichas por tema -->
      <div
        v-for="section in sections"
        :key="section.title"
        class="rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2
          class="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400"
        >
          {{ section.title }}
        </h2>

        <dl
          class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div v-for="field in section.fields" :key="field.label">
            <dt class="text-xs text-slate-400">{{ field.label }}</dt>

            <dd class="mt-0.5 break-words text-sm text-slate-800">
              {{ field.value || '—' }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- Observaciones: solo si hay algo que mostrar -->
      <div
        v-if="fullMember?.observaciones"
        class="rounded-xl border border-slate-200 bg-white p-5"
      >
        <h2
          class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400"
        >
          Observaciones
        </h2>

        <p class="whitespace-pre-line text-sm text-slate-700">
          {{ fullMember.observaciones }}
        </p>
      </div>
    </template>
  </div>
</template>
