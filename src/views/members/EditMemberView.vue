<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { useRoute, useRouter } from 'vue-router';

import { ArrowLeft, RefreshCw } from 'lucide-vue-next';

import {
  getMember,
  isFullMember,
  updateMember,
} from '@/services/membersService';

import { useToastStore } from '@/stores/toast';

import type { CreateMemberData, Member } from '@/types/member.type';

import MemberForm from '../../components/members/MemberForm.vue';

const route = useRoute();
const router = useRouter();
const toast = useToastStore();

const memberId = Number(route.params.id);

const loading = ref(true);
const saving = ref(false);
const razonSocial = ref('');

const form = reactive<CreateMemberData>({
  razonSocial: '',
  titular: '',
  giroComercial: '',
  tipo: 'COMUN',
  rut: '',
  numeroBps: '',
  fechaInicioEmpresa: '',
  fechaAfiliacion: '',
  direccion: '',
  ciudad: '',
  celular: '',
  telefono: '',
  email: '',
  observaciones: '',
});

// Los datos como estaban al cargar, para mandar solo lo que cambió.
const original = ref<CreateMemberData | null>(null);

// Las fechas sin hora llegan como medianoche UTC: el día es la parte de fecha.
function toFormData(member: Member): CreateMemberData {
  return {
    razonSocial: member.razonSocial,
    titular: member.titular,
    giroComercial: member.giroComercial,
    tipo: member.tipo,
    rut: member.rut,
    numeroBps: member.numeroBps,
    fechaInicioEmpresa: member.fechaInicioEmpresa.slice(0, 10),
    fechaAfiliacion: member.fechaAfiliacion.slice(0, 10),
    direccion: member.direccion,
    ciudad: member.ciudad,
    celular: member.celular,
    telefono: member.telefono,
    email: member.email,
    observaciones: member.observaciones ?? '',
  };
}

const changes = computed(() => {
  const before = original.value;

  if (!before) return {};

  const result: Partial<CreateMemberData> = {};

  for (const key of Object.keys(form) as (keyof CreateMemberData)[]) {
    const value = typeof form[key] === 'string' ? form[key].trim() : form[key];

    if (value !== before[key]) {
      Object.assign(result, { [key]: value });
    }
  }

  return result;
});

const hasChanges = computed(() => Object.keys(changes.value).length > 0);

async function loadMember() {
  if (!Number.isInteger(memberId) || memberId <= 0) {
    toast.error('El identificador del socio no es válido');
    loading.value = false;
    return;
  }

  try {
    loading.value = true;

    const member = await getMember(memberId);

    if (!isFullMember(member)) {
      toast.error('No tenés permiso para editar este socio');
      return;
    }

    razonSocial.value = member.razonSocial;
    original.value = toFormData(member);
    Object.assign(form, original.value);
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'No se pudo cargar el socio',
    );
  } finally {
    loading.value = false;
  }
}

onMounted(loadMember);

async function handleSubmit() {
  if (saving.value || !hasChanges.value) return;

  try {
    saving.value = true;

    await updateMember(memberId, changes.value);

    toast.success('Socio actualizado correctamente');

    await router.push({ name: 'socio-detalle', params: { id: memberId } });
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'No se pudo actualizar el socio',
    );
  } finally {
    saving.value = false;
  }
}

function goBack() {
  router.push({ name: 'socio-detalle', params: { id: memberId } });
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <button
        type="button"
        class="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-ccisj"
        @click="router.push({ name: 'socios' })"
      >
        <ArrowLeft class="h-4 w-4" />
        Volver a socios
      </button>

      <h1 class="text-2xl font-bold text-slate-900">Editar socio</h1>

      <p v-if="razonSocial" class="mt-1 text-sm text-slate-500">
        {{ razonSocial }}
      </p>
    </div>

    <div
      v-if="loading"
      class="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500"
    >
      Cargando socio...
    </div>

    <MemberForm
      v-else
      v-model="form"
      mode="edit"
      :loading="saving"
      :disabled="!hasChanges"
      @submit="handleSubmit"
      @cancel="goBack"
    />
  </div>
</template>
