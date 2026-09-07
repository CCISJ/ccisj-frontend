<script setup lang="ts">
import { computed, ref } from 'vue';
import { Plus, Search } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();

const search = ref('');
const typeFilter = ref('TODOS');
const statusFilter = ref('TODOS');
const paymentFilter = ref('TODOS');

const socios = [
  {
    id: 1,
    empresa: 'Distribuidora San José SRL',
    categoria: 'Distribución',
    rut: '210123450018',
    tipo: 'DIRECTIVO',
    contacto: 'Marta Echevarría',
    email: 'marta@distribuidora.uy',
    estado: 'ACTIVO',
    pago: 'AL_DIA',
    ultimoPago: '02/09/2026',
  },
  {
    id: 2,
    empresa: 'Ferretería Central',
    categoria: 'Comercio',
    rut: '210987650011',
    tipo: 'COMUN',
    contacto: 'Diego Rodríguez',
    email: 'diego@ferreteria.uy',
    estado: 'ACTIVO',
    pago: 'AL_DIA',
    ultimoPago: '01/09/2026',
  },
  {
    id: 3,
    empresa: 'Supermercado del Centro',
    categoria: 'Supermercado',
    rut: '210456780019',
    tipo: 'COMUN',
    contacto: 'Laura Méndez',
    email: 'laura@supercentro.uy',
    estado: 'INACTIVO',
    pago: 'DEUDOR',
    ultimoPago: '15/07/2026',
  },
];

const filteredSocios = computed(() => {
  const query = search.value.trim().toLowerCase();

  return socios.filter((socio) => {
    const matchesSearch =
      !query ||
      socio.empresa.toLowerCase().includes(query) ||
      socio.rut.toLowerCase().includes(query) ||
      socio.contacto.toLowerCase().includes(query) ||
      socio.email.toLowerCase().includes(query);

    const matchesType =
      typeFilter.value === 'TODOS' || socio.tipo === typeFilter.value;

    const matchesStatus =
      statusFilter.value === 'TODOS' || socio.estado === statusFilter.value;

    const matchesPayment =
      paymentFilter.value === 'TODOS' || socio.pago === paymentFilter.value;

    return matchesSearch && matchesType && matchesStatus && matchesPayment;
  });
});

function handleAddMember() {
  console.log('Agregar socio');
}
</script>

<template>
  <div class="space-y-6">
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
          placeholder="Buscar por empresa, RUT, contacto o email..."
          class="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <select
        v-model="typeFilter"
        class="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-ccisj"
      >
        <option value="TODOS">Todos los tipos</option>
        <option value="DIRECTIVO">Directivo</option>
        <option value="COMUN">Común</option>
      </select>

      <select
        v-model="statusFilter"
        class="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-ccisj"
      >
        <option value="TODOS">Todos los estados</option>
        <option value="ACTIVO">Activo</option>
        <option value="INACTIVO">Inactivo</option>
      </select>

      <select
        v-model="paymentFilter"
        class="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-ccisj"
      >
        <option value="TODOS">Todos los pagos</option>
        <option value="AL_DIA">Al día</option>
        <option value="DEUDOR">Deudor</option>
      </select>
    </div>

    <!-- Tabla -->
    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div class="overflow-x-auto">
        <table class="w-full min-w-225">
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
              <td class="px-5 py-4 text-center text-sm">
                <div class="flex items-center justify-center gap-3">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ccisj-light text-xs font-bold text-ccisj"
                  >
                    {{ socio.empresa.slice(0, 2).toUpperCase() }}
                  </div>

                  <div class="text-left">
                    <p class="font-semibold text-slate-900">
                      {{ socio.empresa }}
                    </p>

                    <p class="text-xs text-slate-400">
                      {{ socio.categoria }}
                    </p>
                  </div>
                </div>
              </td>

              <td
                class="px-5 py-4 text-center font-mono text-xs text-slate-500"
              >
                {{ socio.rut }}
              </td>

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

              <td class="px-5 py-4 text-center text-sm">
                <p class="font-medium text-slate-800">
                  {{ socio.contacto }}
                </p>

                <p class="text-xs text-slate-400">
                  {{ socio.email }}
                </p>
              </td>

              <td class="px-5 py-4 text-center text-sm">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="
                    socio.estado === 'ACTIVO'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-600'
                  "
                >
                  {{ socio.estado === 'ACTIVO' ? 'Activo' : 'Inactivo' }}
                </span>
              </td>

              <td class="px-5 py-4 text-center text-sm">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="
                    socio.pago === 'AL_DIA'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-50 text-red-600'
                  "
                >
                  {{ socio.pago === 'AL_DIA' ? 'Al día' : 'Deudor' }}
                </span>
              </td>

              <td class="px-5 py-4 text-center text-sm text-slate-500">
                {{ socio.ultimoPago }}
              </td>
            </tr>

            <tr v-if="filteredSocios.length === 0">
              <td
                colspan="7"
                class="px-5 py-10 text-center text-sm text-slate-400"
              >
                No se encontraron socios con esos filtros.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

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
