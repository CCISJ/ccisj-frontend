<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import { RouterLink } from 'vue-router';

import { Check, ChevronDown, Search, UserRoundSearch } from 'lucide-vue-next';

import { searchCandidates } from '@/services/applicantService';
import { getActiveCategories } from '@/services/categoriesService';

import type { CandidateResponse, Category } from '@/types/applicants.type';

const categories = ref<Category[]>([]);
const categoriesError = ref(false);
const categoriesLoading = ref(false);

const categoryDropdownOpen = ref(false);
const categorySearch = ref('');
const categoryDropdown = ref<HTMLElement | null>(null);

const search = ref('');
const categoriaId = ref('');
const conEstudios = ref(false);
const conExperiencia = ref(false);
const page = ref(1);

const result = ref<CandidateResponse | null>(null);
const loading = ref(false);
const error = ref('');
let requestId = 0;

const candidates = computed(() => result.value?.items ?? []);

const selectedCategory = computed(() =>
  categories.value.find(
    (category) => String(category.id) === categoriaId.value,
  ),
);

const filteredCategories = computed(() => {
  const term = categorySearch.value.trim().toLocaleLowerCase('es-UY');

  if (!term) return categories.value;

  return categories.value.filter((category) =>
    category.nombre.toLocaleLowerCase('es-UY').includes(term),
  );
});

async function loadCategories() {
  categoriesLoading.value = true;
  categoriesError.value = false;

  try {
    categories.value = await getActiveCategories();
  } catch {
    categoriesError.value = true;
  } finally {
    categoriesLoading.value = false;
  }
}

function toggleCategoryDropdown() {
  if (categoriesLoading.value || categoriesError.value) return;

  categoryDropdownOpen.value = !categoryDropdownOpen.value;

  if (categoryDropdownOpen.value) {
    categorySearch.value = '';
  }
}

function selectCategory(id: string) {
  categoriaId.value = id;
  categoryDropdownOpen.value = false;
  categorySearch.value = '';
}

function closeCategoryDropdown(event: MouseEvent) {
  if (
    categoryDropdownOpen.value &&
    categoryDropdown.value &&
    !categoryDropdown.value.contains(event.target as Node)
  ) {
    categoryDropdownOpen.value = false;
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    categoryDropdownOpen.value = false;
  }
}

async function loadCandidates() {
  const currentRequest = ++requestId;

  loading.value = true;
  error.value = '';

  const params = new URLSearchParams({
    page: String(page.value),
    limit: '10',
  });

  if (search.value.trim()) {
    params.set('search', search.value.trim());
  }

  if (categoriaId.value) {
    params.set('categoriaId', categoriaId.value);
  }

  if (conEstudios.value) {
    params.set('conEstudios', 'true');
  }

  if (conExperiencia.value) {
    params.set('conExperiencia', 'true');
  }

  try {
    const data = await searchCandidates({
      search: search.value,
      categoriaId: categoriaId.value,
      conEstudios: conEstudios.value,
      conExperiencia: conExperiencia.value,
      page: page.value,
      limit: 10,
    });

    if (currentRequest === requestId) {
      result.value = data;
    }
  } catch (err) {
    if (currentRequest === requestId) {
      result.value = null;
      error.value =
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los candidatos';
    }
  } finally {
    if (currentRequest === requestId) {
      loading.value = false;
    }
  }
}

function applyFilters() {
  categoryDropdownOpen.value = false;

  if (page.value !== 1) {
    page.value = 1; // El watch realiza la petición.
  } else {
    void loadCandidates();
  }
}

function clearFilters() {
  search.value = '';
  categoriaId.value = '';
  conEstudios.value = false;
  conExperiencia.value = false;
  categorySearch.value = '';
  applyFilters();
}

function changePage(nextPage: number) {
  if (
    loading.value ||
    nextPage < 1 ||
    nextPage > (result.value?.totalPages ?? 1)
  ) {
    return;
  }

  page.value = nextPage;
}

watch(page, () => {
  void loadCandidates();
});

onMounted(() => {
  void loadCandidates();
  void loadCategories();

  document.addEventListener('mousedown', closeCategoryDropdown);
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  requestId++;
  document.removeEventListener('mousedown', closeCategoryDropdown);
  document.removeEventListener('keydown', handleEscape);
});
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Buscar candidatos</h1>
      <p class="mt-1 text-sm text-slate-500">
        Consultá los perfiles laborales de los postulantes registrados.
      </p>
    </div>

    <form
      class="space-y-4 rounded-2xl border border-slate-200 bg-white p-5"
      @submit.prevent="applyFilters"
    >
      <div class="flex items-center gap-2 font-semibold text-slate-800">
        <Search class="h-5 w-5" />
        Filtros de búsqueda
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700">
            Nombre o apellido
          </span>
          <input
            v-model="search"
            type="search"
            maxlength="100"
            placeholder="Buscar candidato..."
            class="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600"
          />
        </label>

        <div ref="categoryDropdown" class="relative">
          <span
            id="category-label"
            class="mb-1 block text-sm font-medium text-slate-700"
          >
            Categoría laboral
          </span>

          <button
            type="button"
            aria-labelledby="category-label"
            :aria-expanded="categoryDropdownOpen"
            :disabled="categoriesLoading || categoriesError"
            class="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-left outline-none focus:border-emerald-600 disabled:opacity-50"
            @click="toggleCategoryDropdown"
          >
            <span
              class="truncate"
              :class="selectedCategory ? 'text-slate-900' : 'text-slate-500'"
            >
              {{
                categoriesLoading
                  ? 'Cargando categorías...'
                  : selectedCategory?.nombre || 'Todas las categorías'
              }}
            </span>

            <ChevronDown
              class="h-4 w-4 shrink-0 text-slate-500 transition-transform"
              :class="{ 'rotate-180': categoryDropdownOpen }"
            />
          </button>

          <div
            v-if="categoryDropdownOpen"
            class="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            <div class="border-b border-slate-100 p-2">
              <input
                v-model="categorySearch"
                type="search"
                placeholder="Buscar categoría..."
                aria-label="Buscar categoría"
                class="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div class="max-h-60 overflow-y-auto p-1">
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
                :class="
                  !categoriaId
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-700'
                "
                @click="selectCategory('')"
              >
                Todas las categorías
                <Check v-if="!categoriaId" class="h-4 w-4" />
              </button>

              <button
                v-for="category in filteredCategories"
                :key="category.id"
                type="button"
                class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100"
                :class="
                  categoriaId === String(category.id)
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-700'
                "
                @click="selectCategory(String(category.id))"
              >
                <span>{{ category.nombre }}</span>
                <Check
                  v-if="categoriaId === String(category.id)"
                  class="h-4 w-4 shrink-0"
                />
              </button>

              <p
                v-if="filteredCategories.length === 0"
                class="px-3 py-4 text-center text-sm text-slate-500"
              >
                No se encontraron categorías.
              </p>
            </div>
          </div>

          <div
            v-if="categoriesError"
            class="mt-1 flex items-center gap-2 text-xs text-red-600"
          >
            No se pudieron cargar las categorías.
            <button
              type="button"
              class="font-semibold underline"
              @click="loadCategories"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-5">
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input
            v-model="conEstudios"
            type="checkbox"
            class="accent-emerald-700"
          />
          Con estudios
        </label>

        <label class="flex items-center gap-2 text-sm text-slate-700">
          <input
            v-model="conExperiencia"
            type="checkbox"
            class="accent-emerald-700"
          />
          Con experiencia laboral
        </label>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="submit"
          :disabled="loading"
          class="rounded-xl bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          Buscar
        </button>

        <button
          type="button"
          class="rounded-xl border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          @click="clearFilters"
        >
          Limpiar filtros
        </button>
      </div>
    </form>

    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-slate-900">Resultados</h2>

        <span
          v-if="result && !loading && !error"
          class="text-sm text-slate-500"
        >
          {{ result.total }} candidatos
        </span>
      </div>

      <p v-if="loading" role="status" class="text-sm text-slate-500">
        Cargando candidatos...
      </p>

      <div
        v-if="error"
        role="alert"
        class="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      >
        {{ error }}
        <button
          type="button"
          class="ml-2 font-semibold underline"
          @click="loadCandidates"
        >
          Reintentar
        </button>
      </div>

      <div
        v-if="!loading && !error && result && candidates.length === 0"
        class="rounded-2xl border border-slate-200 bg-white p-10 text-center"
      >
        <UserRoundSearch class="mx-auto mb-3 h-10 w-10 text-slate-400" />
        <p class="font-medium text-slate-700">No se encontraron candidatos</p>
        <p class="mt-1 text-sm text-slate-500">
          Probá con otros filtros de búsqueda.
        </p>
      </div>

      <RouterLink
        v-for="candidate in !loading && !error ? candidates : []"
        :key="candidate.id"
        :to="{
          name: 'candidato-detalle',
          params: { id: candidate.id },
        }"
        class="block rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="font-semibold text-slate-900">
              {{ candidate.nombre }} {{ candidate.apellido }}
            </h3>

            <p
              v-if="candidate.experiencias[0]"
              class="mt-1 text-sm text-slate-600"
            >
              {{ candidate.experiencias[0].cargo }}
              · {{ candidate.experiencias[0].empresa }}
            </p>

            <p v-if="candidate.estudios[0]" class="mt-1 text-sm text-slate-500">
              {{ candidate.estudios[0].titulo }}
            </p>
          </div>

          <span class="shrink-0 text-sm font-semibold text-emerald-700">
            Ver perfil
          </span>
        </div>

        <div class="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
          <span class="rounded-lg bg-slate-100 px-2 py-1">
            {{ candidate._count.estudios }} estudios
          </span>

          <span class="rounded-lg bg-slate-100 px-2 py-1">
            {{ candidate._count.experiencias }} experiencias
          </span>

          <span class="rounded-lg bg-slate-100 px-2 py-1">
            {{ candidate._count.cvs }} PDF
          </span>

          <span
            v-for="item in candidate.categorias"
            :key="item.categoria.id"
            class="rounded-lg bg-emerald-50 px-2 py-1 text-emerald-700"
          >
            {{ item.categoria.nombre }}
          </span>
        </div>
      </RouterLink>

      <div
        v-if="result && result.totalPages > 1 && !error && !loading"
        class="flex items-center justify-center gap-4 pt-4"
      >
        <button
          type="button"
          :disabled="page <= 1"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
          @click="changePage(page - 1)"
        >
          Anterior
        </button>

        <span class="text-sm text-slate-600">
          Página {{ page }} de {{ result.totalPages }}
        </span>

        <button
          type="button"
          :disabled="page >= result.totalPages"
          class="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:opacity-40"
          @click="changePage(page + 1)"
        >
          Siguiente
        </button>
      </div>
    </div>
  </div>
</template>
