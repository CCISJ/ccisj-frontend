<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { RouterLink } from 'vue-router';

import { FolderOpen, Paperclip, Plus, Search } from 'lucide-vue-next';

import {
  getCategoriasGestion,
  getGestiones,
} from '@/services/gestionesService';

import { useAuthStore } from '@/stores/auth';

import type { CategoriaGestion, GestionResumen } from '@/types/gestion.type';

import { formatDate } from '@/utils/date';

const auth = useAuthStore();

const gestiones = ref<GestionResumen[]>([]);
const categorias = ref<CategoriaGestion[]>([]);
const search = ref('');
const categoria = ref('');
const loading = ref(true);
const error = ref('');

let requestId = 0;
let debounce: ReturnType<typeof setTimeout> | undefined;

const hasFilters = computed(
  () => search.value.trim() !== '' || !!categoria.value,
);

async function load() {
  const current = ++requestId;

  loading.value = true;
  error.value = '';

  try {
    const result = await getGestiones({
      search: search.value,
      categoria: categoria.value,
    });

    // Una respuesta vieja no pisa una búsqueda más nueva.
    if (current === requestId) gestiones.value = result;
  } catch (err) {
    if (current === requestId) {
      error.value =
        err instanceof Error ? err.message : 'No se pudo cargar la Gestoría';
    }
  } finally {
    if (current === requestId) loading.value = false;
  }
}

/** La descripción en un solo párrafo: en la lista es un adelanto. */
function resumen(texto: string) {
  return texto.replace(/\s+/g, ' ').trim();
}

function clearFilters() {
  search.value = '';
  categoria.value = '';
}

watch(categoria, load);

watch(search, () => {
  clearTimeout(debounce);
  debounce = setTimeout(load, 300);
});

onMounted(async () => {
  await load();

  try {
    categorias.value = await getCategoriasGestion();
  } catch {
    // Sin la lista de categorías, igual se puede buscar por texto.
  }
});
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-slate-900">Gestoría</h1>
        <p class="mt-2 max-w-3xl text-slate-600">
          Informes y trámites que la Cámara deja asentados para la directiva,
          con sus documentos.
        </p>
      </div>

      <RouterLink
        v-if="auth.isAdmin"
        :to="{ name: 'gestion-nueva' }"
        class="inline-flex min-h-12 items-center gap-2 rounded-xl bg-ccisj px-5 font-semibold text-white transition hover:bg-ccisj-dark"
      >
        <Plus class="h-5 w-5" />
        Nueva gestión
      </RouterLink>
    </header>

    <form
      role="search"
      class="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-5"
      @submit.prevent="load"
    >
      <div class="min-w-64 flex-[3]">
        <label for="gestion-search" class="font-semibold text-slate-900">
          Buscar
        </label>
        <div class="relative mt-1">
          <Search
            class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
          />
          <input
            id="gestion-search"
            v-model="search"
            type="search"
            maxlength="100"
            placeholder="Título, texto o categoría"
            class="min-h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-slate-900 outline-none focus:border-ccisj focus:ring-2 focus:ring-ccisj-light"
          />
        </div>
      </div>

      <div class="min-w-52 flex-1">
        <label for="gestion-categoria" class="font-semibold text-slate-900">
          Categoría
        </label>
        <select
          id="gestion-categoria"
          v-model="categoria"
          class="mt-1 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-ccisj"
        >
          <option value="">Todas</option>
          <option v-for="c in categorias" :key="c.nombre" :value="c.nombre">
            {{ c.nombre }} ({{ c.cantidad }})
          </option>
        </select>
      </div>

      <button
        v-if="hasFilters"
        type="button"
        class="min-h-12 rounded-xl px-4 font-semibold text-slate-700 transition hover:bg-slate-100"
        @click="clearFilters"
      >
        Limpiar
      </button>
    </form>

    <p v-if="error" role="alert" class="rounded-xl bg-red-50 p-4 text-red-700">
      {{ error }}
      <button type="button" class="ml-2 font-semibold underline" @click="load">
        Reintentar
      </button>
    </p>

    <p
      v-else-if="loading && gestiones.length === 0"
      role="status"
      class="text-slate-600"
    >
      Cargando...
    </p>

    <div
      v-else-if="gestiones.length === 0"
      class="rounded-2xl border border-slate-200 bg-white p-10 text-center"
    >
      <FolderOpen class="mx-auto h-10 w-10 text-slate-500" />
      <p class="mt-3 text-lg font-semibold text-slate-900">
        {{
          hasFilters
            ? 'Ninguna gestión coincide con la búsqueda.'
            : 'Todavía no hay gestiones.'
        }}
      </p>
      <p v-if="!hasFilters && auth.isAdmin" class="mt-1 text-slate-600">
        Con "Nueva gestión" se deja asentado un trámite o un informe.
      </p>
    </div>

    <template v-else>
      <p class="font-semibold text-slate-900" aria-live="polite">
        {{ gestiones.length }}
        {{ gestiones.length === 1 ? 'gestión' : 'gestiones' }}
      </p>

      <ul
        class="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white"
      >
        <li v-for="gestion in gestiones" :key="gestion.id">
          <RouterLink
            :to="{ name: 'gestion-detalle', params: { id: gestion.id } }"
            class="block px-6 py-5 transition hover:bg-slate-50"
          >
            <div class="flex flex-wrap items-baseline justify-between gap-x-4">
              <h2 class="text-xl font-bold text-slate-900">
                {{ gestion.titulo }}
              </h2>
              <span class="text-sm text-slate-600">
                Actualizada el {{ formatDate(gestion.fechaActualizacion) }}
              </span>
            </div>

            <p class="mt-1 font-semibold text-ccisj">
              {{ gestion.categoria }}
            </p>

            <p class="mt-2 line-clamp-2 text-slate-700">
              {{ resumen(gestion.descripcion) }}
            </p>

            <p
              v-if="gestion.cantidadArchivos > 0"
              class="mt-2 inline-flex items-center gap-1.5 text-sm text-slate-600"
            >
              <Paperclip class="h-4 w-4" />
              {{ gestion.cantidadArchivos }}
              {{ gestion.cantidadArchivos === 1 ? 'archivo' : 'archivos' }}
            </p>
          </RouterLink>
        </li>
      </ul>
    </template>
  </div>
</template>
