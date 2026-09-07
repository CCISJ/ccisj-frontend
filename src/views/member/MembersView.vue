<script setup lang="ts">
import { ChevronRight, MoreHorizontal } from 'lucide-vue-next';

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
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Socios</h1>

      <p class="mt-1 text-sm text-slate-500">
        Empresas socias del Centro Comercial e Industrial de San José
      </p>
    </div>

    <div class="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div class="overflow-x-auto">
        <table class="w-full min-w-225">
          <thead class="bg-slate-50">
            <tr>
              <th class="table-th">Empresa</th>

              <th class="table-th">RUT</th>

              <th class="table-th">Tipo</th>

              <th class="table-th">Contacto</th>

              <th class="table-th">Estado</th>

              <th class="table-th">Pago</th>

              <th class="table-th">Último pago</th>

              <th class="table-th text-right">Acciones</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="socio in socios"
              :key="socio.id"
              class="border-t border-slate-100 transition hover:bg-slate-50/70"
            >
              <td class="px-5 py-4 text-sm">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ccisj-light text-xs font-bold text-ccisj"
                  >
                    {{ socio.empresa.slice(0, 2).toUpperCase() }}
                  </div>

                  <div>
                    <p class="font-semibold text-slate-900">
                      {{ socio.empresa }}
                    </p>

                    <p class="text-xs text-slate-400">
                      {{ socio.categoria }}
                    </p>
                  </div>
                </div>
              </td>

              <td class="px-5 py-4 text-sm font-mono text-slate-500">
                {{ socio.rut }}
              </td>

              <td class="px-5 py-4 text-sm">
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

              <td class="px-5 py-4 text-sm">
                <p class="font-medium text-slate-800">
                  {{ socio.contacto }}
                </p>

                <p class="text-xs text-slate-400">
                  {{ socio.email }}
                </p>
              </td>

              <td class="px-5 py-4 text-sm">
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

              <td class="px-5 py-4 text-sm">
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

              <td class="px-5 py-4 text-sm text-slate-500">
                {{ socio.ultimoPago }}
              </td>

              <td class="px-5 py-4 text-sm">
                <div class="flex items-center justify-end gap-1">
                  <button
                    class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-ccisj"
                    aria-label="Ver detalle"
                  >
                    <ChevronRight class="h-4 w-4" />
                  </button>

                  <button
                    class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-ccisj"
                    aria-label="Más opciones"
                  >
                    <MoreHorizontal class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        class="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500"
      >
        <span> Mostrando {{ socios.length }} socios </span>

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
