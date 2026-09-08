<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, Save } from 'lucide-vue-next';

import { createMember } from '@/services/membersService';
import type { CreateMemberData } from '@/types/member.type';
import { useToastStore } from '@/stores/toast';

const router = useRouter();
const toast = useToastStore();

const loading = ref(false);
const passwordInicial = ref('');

const form = reactive<CreateMemberData>({
  razonSocial: '',
  titular: '',
  giroComercial: '',
  tipo: 'COMUN',
  rut: '',
  numeroBps: '',
  fechaInicioEmpresa: '',
  fechaAfiliacion: new Date().toISOString().slice(0, 10),
  direccion: '',
  ciudad: '',
  celular: '',
  telefono: '',
  email: '',
  observaciones: '',
});

async function handleSubmit() {
  try {
    loading.value = true;

    const response = await createMember(form);

    passwordInicial.value = response.email;

    toast.success('Socio creado correctamente');
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'No se pudo crear el socio';

    toast.error(message);
  } finally {
    loading.value = false;
  }
}

function goBack() {
  router.push({ name: 'socio-nuevo' });
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <button
          class="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-ccisj"
          @click="goBack"
        >
          <ArrowLeft class="h-4 w-4" />
          Volver a socios
        </button>

        <h1 class="text-2xl font-bold text-slate-900">Agregar socio</h1>

        <p class="mt-1 text-sm text-slate-500">
          Registrá los datos comerciales y de contacto del nuevo socio.
        </p>
      </div>
    </div>

    <div
      v-if="passwordInicial"
      class="rounded-xl border border-emerald-200 bg-emerald-50 p-5"
    >
      <p class="font-semibold text-emerald-800">Socio creado correctamente</p>

      <p class="mt-2 text-sm text-emerald-700">
        Contraseña inicial:
        <span class="font-semibold">
          {{ passwordInicial }}
        </span>
      </p>

      <p class="mt-1 text-xs text-emerald-600">
        Guardá esta contraseña para entregársela al socio.
      </p>
    </div>

    <form
      class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="handleSubmit"
    >
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">
            Razón social
          </label>

          <input
            v-model="form.razonSocial"
            required
            type="text"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">
            Nombre del titular
          </label>

          <input
            v-model="form.titular"
            required
            type="text"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">
            Giro comercial
          </label>

          <input
            v-model="form.giroComercial"
            required
            type="text"
            placeholder="Ej. Supermercado, ferretería, servicios..."
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">
            Tipo de socio
          </label>

          <select
            v-model="form.tipo"
            required
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
          >
            <option value="COMUN">Común</option>
            <option value="DIRECTIVO">Directivo</option>
          </select>
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">
            RUT
          </label>

          <input
            v-model="form.rut"
            required
            type="text"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">
            Nº BPS
          </label>

          <input
            v-model="form.numeroBps"
            required
            type="text"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">
            Fecha de inicio de la empresa
          </label>

          <input
            v-model="form.fechaInicioEmpresa"
            required
            type="date"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">
            Fecha de afiliación
          </label>

          <input
            v-model="form.fechaAfiliacion"
            required
            type="date"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">
            Dirección
          </label>

          <input
            v-model="form.direccion"
            required
            type="text"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">
            Ciudad / Localidad
          </label>

          <input
            v-model="form.ciudad"
            required
            type="text"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">
            Celular
          </label>

          <input
            v-model="form.celular"
            required
            type="text"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div>
          <label class="mb-2 block text-sm font-medium text-slate-700">
            Teléfono
          </label>

          <input
            v-model="form.telefono"
            required
            type="text"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div class="md:col-span-2">
          <label class="mb-2 block text-sm font-medium text-slate-700">
            Email
          </label>

          <input
            v-model="form.email"
            required
            type="email"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
          />

          <p class="mt-1 text-xs text-slate-400">
            Este email será utilizado también para crear la cuenta del socio.
          </p>
        </div>

        <div class="md:col-span-2">
          <label class="mb-2 block text-sm font-medium text-slate-700">
            Observaciones
          </label>

          <textarea
            v-model="form.observaciones"
            rows="4"
            class="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      <div class="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
        <button
          type="button"
          class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          @click="goBack"
        >
          Cancelar
        </button>

        <button
          type="submit"
          :disabled="loading || !!passwordInicial"
          class="flex items-center gap-2 rounded-xl bg-ccisj px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save class="h-4 w-4" />

          {{ loading ? 'Guardando...' : 'Crear socio' }}
        </button>
      </div>
    </form>
  </div>
</template>
