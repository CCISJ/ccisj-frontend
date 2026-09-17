<script setup lang="ts">
import { reactive, ref } from 'vue';

import { useRouter } from 'vue-router';

import { ArrowLeft } from 'lucide-vue-next';

import { createMember } from '@/services/membersService';

import { useToastStore } from '@/stores/toast';

import type { CreateMemberData } from '@/types/member.type';

import { uruguayDay } from '@/utils/format';

import MemberForm from './MemberForm.vue';

const router = useRouter();
const toast = useToastStore();

const loading = ref(false);
const passwordInicial = ref('');
const socioCreadoId = ref<number | null>(null);

const form = reactive<CreateMemberData>({
  razonSocial: '',
  titular: '',
  giroComercial: '',
  tipo: 'COMUN',
  rut: '',
  numeroBps: '',
  fechaInicioEmpresa: '',
  // Hoy en Uruguay: con `toISOString()` después de las 21 h ya era mañana.
  fechaAfiliacion: uruguayDay(),
  direccion: '',
  ciudad: '',
  celular: '',
  telefono: '',
  email: '',
  observaciones: '',
});

async function handleSubmit() {
  // Ya creado: un segundo envío chocaría con el RUT recién registrado.
  if (loading.value || socioCreadoId.value !== null) return;

  try {
    loading.value = true;

    const response = await createMember(form);

    passwordInicial.value = response.passwordInicial;
    socioCreadoId.value = response.socioId;

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
  router.push({ name: 'socios' });
}

function verSocio() {
  if (socioCreadoId.value === null) return;

  router.push({ name: 'socio-detalle', params: { id: socioCreadoId.value } });
}
</script>

<template>
  <div class="space-y-5">
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
        Registrá los datos comerciales y de contacto del nuevo socio. Todos los
        campos son obligatorios salvo las observaciones.
      </p>
    </div>

    <div
      v-if="passwordInicial"
      class="rounded-xl border border-emerald-200 bg-emerald-50 p-5"
    >
      <p class="font-semibold text-emerald-800">Socio creado correctamente</p>

      <p class="mt-2 text-sm text-emerald-700">
        Contraseña inicial:
        <span class="select-all font-mono font-semibold">
          {{ passwordInicial }}
        </span>
      </p>

      <p class="mt-1 text-xs text-emerald-600">
        Guardá esta contraseña para entregársela al socio: no se vuelve a
        mostrar.
      </p>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg bg-ccisj px-3.5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          @click="verSocio"
        >
          Ver ficha del socio
        </button>

        <button
          type="button"
          class="rounded-lg border border-emerald-200 bg-white px-3.5 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          @click="goBack"
        >
          Volver a la lista
        </button>
      </div>
    </div>

    <MemberForm
      v-else
      v-model="form"
      mode="create"
      :loading="loading"
      @submit="handleSubmit"
      @cancel="goBack"
    />
  </div>
</template>
