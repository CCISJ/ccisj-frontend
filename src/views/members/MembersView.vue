<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Plus, Search } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';
import { getMembers } from '@/services/membersService';
import type { Member } from '@/types/member.type';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();

const socios = ref<Member[]>([]);
const loading = ref(true);
const error = ref('');

const search = ref('');
const typeFilter = ref('TODOS');
const statusFilter = ref('TODOS');
const paymentFilter = ref('TODOS');

const fakeExtraData: Record<
  number,
  {
    categoria: string;
    pago: 'AL_DIA' | 'DEUDOR';
    ultimoPago: string;
  }
> = {
  1: {
    categoria: 'Distribución',
    pago: 'AL_DIA',
    ultimoPago: '02/09/2026',
  },
  2: {
    categoria: 'Comercio',
    pago: 'AL_DIA',
    ultimoPago: '01/09/2026',
  },
  3: {
    categoria: 'Supermercado',
    pago: 'DEUDOR',
    ultimoPago: '15/07/2026',
  },
};

function getExtraData(id: number) {
  return (
    fakeExtraData[id] ?? {
      categoria: 'Comercio',
      pago: 'AL_DIA' as const,
      ultimoPago: '-',
    }
  );
}

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

const filteredSocios = computed(() => {
  const query = search.value.trim().toLowerCase();

  return socios.value.filter((socio) => {
    const extra = getExtraData(socio.id);

    const matchesSearch =
      !query ||
      socio.razonSocial.toLowerCase().includes(query) ||
      socio.rut.toLowerCase().includes(query) ||
      socio.email?.toLowerCase().includes(query) ||
      socio.telefono?.toLowerCase().includes(query) ||
      extra.categoria.toLowerCase().includes(query);

    const matchesType =
      typeFilter.value === 'TODOS' || socio.tipo === typeFilter.value;

    const matchesStatus =
      statusFilter.value === 'TODOS' ||
      (statusFilter.value === 'ACTIVO' ? socio.activo : !socio.activo);

    const matchesPayment =
      paymentFilter.value === 'TODOS' || extra.pago === paymentFilter.value;

    return matchesSearch && matchesType && matchesStatus && matchesPayment;
  });
});

function handleAddMember() {
  router.push('/socios/nuevo');
}
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex items-start justify-between gap-4">
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
          type="text"
          placeholder="Buscar por empresa, RUT, email..."
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

      <select
        v-model="paymentFilter"
        class="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-ccisj"
      >
        <option value="TODOS">Todos los pagos</option>

        <option value="AL_DIA">Al día</option>

        <option value="DEUDOR">Deudor</option>
      </select>
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
      class="rounded-xl border border-red-200 bg-red-50 p-5 text-center text-sm text-red-600"
    >
      {{ error }}
    </div>

    <!-- Tabla -->
    <div
      v-else
      class="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px]">
          <thead class="bg-slate-50">
            <tr>
              <th
                class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Empresa
              </th>

              <th
                class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                RUT
              </th>

              <th
                class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Tipo
              </th>

              <th
                class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Contacto
              </th>

              <th
                class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Estado
              </th>

              <th
                class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Pago
              </th>

              <th
                class="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Último pago
              </th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="socio in filteredSocios"
              :key="socio.id"
              class="border-t border-slate-100 transition hover:bg-slate-50/70"
            >
              <!-- Empresa -->
              <td class="px-5 py-4 text-center text-sm">
                <div class="flex items-center justify-center gap-3">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ccisj-light text-xs font-bold text-ccisj"
                  >
                    {{ socio.razonSocial.slice(0, 2).toUpperCase() }}
                  </div>

                  <div class="text-left">
                    <p class="font-semibold text-slate-900">
                      {{ socio.razonSocial }}
                    </p>

                    <p class="text-xs text-slate-400">
                      {{ getExtraData(socio.id).categoria }}
                    </p>
                  </div>
                </div>
              </td>

              <!-- RUT -->
              <td
                class="px-5 py-4 text-center font-mono text-xs text-slate-500"
              >
                {{ socio.rut }}
              </td>

              <!-- Tipo -->
              <td class="px-5 py-4 text-center text-sm">
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
              <td class="px-5 py-4 text-center text-sm">
                <p class="font-medium text-slate-800">
                  {{ socio.telefono || 'Sin teléfono' }}
                </p>

                <p class="text-xs text-slate-400">
                  {{ socio.email || socio.usuario.email }}
                </p>
              </td>

              <!-- Estado -->
              <td class="px-5 py-4 text-center text-sm">
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

              <!-- Pago -->
              <td class="px-5 py-4 text-center text-sm">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="
                    getExtraData(socio.id).pago === 'AL_DIA'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-600'
                  "
                >
                  {{
                    getExtraData(socio.id).pago === 'AL_DIA'
                      ? 'Al día'
                      : 'Deudor'
                  }}
                </span>
              </td>

              <!-- Último pago -->
              <td class="px-5 py-4 text-center text-sm text-slate-500">
                {{ getExtraData(socio.id).ultimoPago }}
              </td>
            </tr>

            <!-- Sin resultados -->
            <tr v-if="filteredSocios.length === 0">
              <td
                colspan="7"
                class="px-5 py-12 text-center text-sm text-slate-400"
              >
                No se encontraron socios con esos filtros.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div
        class="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500"
      >
        <span>
          Mostrando {{ filteredSocios.length }} de {{ socios.length }} socios
        </span>

        <div class="flex items-center gap-1">
          <button class="rounded-lg px-2 py-1 transition hover:bg-slate-100">
            Anterior
          </button>

          <button
            class="rounded-lg bg-ccisj-light px-2.5 py-1 font-semibold text-ccisj"
          >
            1
          </button>

          <button class="rounded-lg px-2 py-1 transition hover:bg-slate-100">
            Siguiente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
