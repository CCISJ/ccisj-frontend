<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Search, X, RefreshCw } from 'lucide-vue-next';

import { useAuthStore } from '@/stores/auth';
import { getMembers } from '@/services/membersService';
import type { Member } from '@/types/member.type';

const auth = useAuthStore();
const router = useRouter();

const socios = ref<Member[]>([]);
const loading = ref(true);
const error = ref('');

const search = ref('');
const typeFilter = ref('TODOS');
const statusFilter = ref('TODOS');

const PAGE_SIZE = 10;
const page = ref(1);

async function loadMembers() {
  try {
    loading.value = true;
    error.value = '';

    socios.value = await getMembers();
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'No se pudieron cargar los socios';
  } finally {
    loading.value = false;
  }
}

onMounted(loadMembers);

const hasFilters = computed(
  () =>
    search.value.trim() !== '' ||
    typeFilter.value !== 'TODOS' ||
    statusFilter.value !== 'TODOS',
);

function clearFilters() {
  search.value = '';
  typeFilter.value = 'TODOS';
  statusFilter.value = 'TODOS';
}

const filteredSocios = computed(() => {
  const query = search.value.trim().toLowerCase();

  return socios.value.filter((socio) => {
    const matchesSearch =
      !query ||
      socio.razonSocial.toLowerCase().includes(query) ||
      socio.rut.toLowerCase().includes(query) ||
      socio.giroComercial?.toLowerCase().includes(query) ||
      socio.titular?.toLowerCase().includes(query) ||
      socio.email?.toLowerCase().includes(query) ||
      socio.telefono?.toLowerCase().includes(query);

    const matchesType =
      typeFilter.value === 'TODOS' || socio.tipo === typeFilter.value;

    const matchesStatus =
      statusFilter.value === 'TODOS' ||
      (statusFilter.value === 'ACTIVO' ? socio.activo : !socio.activo);

    return matchesSearch && matchesType && matchesStatus;
  });
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredSocios.value.length / PAGE_SIZE)),
);

const visibleSocios = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;

  return filteredSocios.value.slice(start, start + PAGE_SIZE);
});

const rangeStart = computed(() =>
  filteredSocios.value.length === 0 ? 0 : (page.value - 1) * PAGE_SIZE + 1,
);

const rangeEnd = computed(() =>
  Math.min(page.value * PAGE_SIZE, filteredSocios.value.length),
);

// Al cambiar los filtros el resultado se acorta: volver siempre a la pagina 1.
watch([search, typeFilter, statusFilter], () => {
  page.value = 1;
});

function goToPage(next: number) {
  page.value = Math.min(Math.max(next, 1), totalPages.value);
}

function openMember(id: number) {
  router.push({ name: 'socio-detalle', params: { id } });
}

function handleAddMember() {
  router.push({ name: 'socio-nuevo' });
}
</script>

<template>
  <div class="space-y-5">
    <!-- Encabezado -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Socios</h1>

        <p class="mt-1 text-sm text-slate-500">
          Empresas socias del Centro Comercial e Industrial de San José
        </p>
      </div>

      <button
        v-if="auth.role === 'ADMIN'"
        class="flex items-center gap-2 rounded-xl bg-ccisj px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        @click="handleAddMember"
      >
        <Plus class="h-4 w-4" />
        Agregar socio
      </button>
    </div>

    <!-- Filtros -->
    <div
      class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center"
    >
      <div class="relative flex-1">
        <Search
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        />

        <input
          v-model="search"
          type="search"
          placeholder="Buscar por empresa, RUT, titular, giro o contacto..."
          class="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <select
        v-model="typeFilter"
        class="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-ccisj"
      >
        <option value="TODOS">Todos los tipos</option>
        <option value="DIRECTIVO">Directivo</option>
        <option value="COMUN">Común</option>
      </select>

      <select
        v-model="statusFilter"
        class="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-ccisj"
      >
        <option value="TODOS">Todos los estados</option>
        <option value="ACTIVO">Activo</option>
        <option value="INACTIVO">Inactivo</option>
      </select>

      <button
        v-if="hasFilters"
        type="button"
        class="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
        @click="clearFilters"
      >
        <X class="h-4 w-4" />
        Limpiar
      </button>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"
    >
      Cargando socios...
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-xl border border-red-200 bg-red-50 p-6 text-center"
    >
      <p class="text-sm text-red-600">{{ error }}</p>

      <button
        type="button"
        class="mx-auto mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        @click="loadMembers"
      >
        <RefreshCw class="h-4 w-4" />
        Reintentar
      </button>
    </div>

    <!-- Sin socios cargados -->
    <div
      v-else-if="socios.length === 0"
      class="rounded-xl border border-slate-200 bg-white p-12 text-center"
    >
      <p class="text-sm font-medium text-slate-600">Todavía no hay socios</p>

      <p class="mt-1 text-sm text-slate-400">
        Los socios que registres van a aparecer en esta lista.
      </p>
    </div>

    <!-- Tabla -->
    <div
      v-else
      class="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div class="overflow-x-auto">
        <table class="w-full min-w-[720px] text-left">
          <thead class="bg-slate-50">
            <tr
              class="text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              <th class="px-5 py-3">Empresa</th>
              <th class="px-5 py-3">RUT</th>
              <th class="px-5 py-3">Tipo</th>
              <th class="px-5 py-3">Contacto</th>
              <th class="px-5 py-3">Estado</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="socio in visibleSocios"
              :key="socio.id"
              class="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50"
              @click="openMember(socio.id)"
            >
              <!-- Empresa -->
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ccisj-light text-xs font-bold text-ccisj"
                  >
                    {{ socio.razonSocial.slice(0, 2).toUpperCase() }}
                  </div>

                  <div class="min-w-0">
                    <p class="truncate font-semibold text-slate-900">
                      {{ socio.razonSocial }}
                    </p>

                    <p class="truncate text-xs text-slate-400">
                      {{ socio.giroComercial || 'Sin giro comercial' }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- RUT -->
              <td
                class="whitespace-nowrap px-5 py-3.5 font-mono text-xs text-slate-500"
              >
                {{ socio.rut }}
              </td>

              <!-- Tipo -->
              <td class="px-5 py-3.5">
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
              </td>

              <!-- Contacto -->
              <td class="px-5 py-3.5 text-sm">
                <p class="truncate text-slate-800">
                  {{ socio.telefono || socio.celular || 'Sin teléfono' }}
                </p>

                <p class="truncate text-xs text-slate-400">
                  {{ socio.email || socio.usuario.email }}
                </p>
              </td>

              <!-- Estado -->
              <td class="px-5 py-3.5">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="
                    socio.activo
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-600'
                  "
                >
                  {{ socio.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
            </tr>

            <!-- Sin resultados para los filtros actuales -->
            <tr v-if="filteredSocios.length === 0">
              <td colspan="5" class="px-5 py-12 text-center">
                <p class="text-sm text-slate-500">
                  Ningún socio coincide con esos filtros.
                </p>

                <button
                  type="button"
                  class="mt-2 text-sm font-medium text-ccisj hover:underline"
                  @click="clearFilters"
                >
                  Limpiar filtros
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div
        v-if="filteredSocios.length > 0"
        class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500"
      >
        <span>
          Mostrando {{ rangeStart }}-{{ rangeEnd }} de
          {{ filteredSocios.length }}
          {{ filteredSocios.length === 1 ? 'socio' : 'socios' }}
        </span>

        <div v-if="totalPages > 1" class="flex items-center gap-1">
          <button
            type="button"
            :disabled="page === 1"
            class="rounded-lg px-2 py-1 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            @click="goToPage(page - 1)"
          >
            Anterior
          </button>

          <button
            v-for="n in totalPages"
            :key="n"
            type="button"
            class="rounded-lg px-2.5 py-1 transition"
            :class="
              n === page
                ? 'bg-ccisj-light font-semibold text-ccisj'
                : 'hover:bg-slate-100'
            "
            @click="goToPage(n)"
          >
            {{ n }}
          </button>

          <button
            type="button"
            :disabled="page === totalPages"
            class="rounded-lg px-2 py-1 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            @click="goToPage(page + 1)"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
