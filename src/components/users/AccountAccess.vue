<script setup lang="ts">
import { ref } from 'vue';

import { KeyRound } from 'lucide-vue-next';

import BaseModal from '@/components/BaseModal.vue';

import { resetPassword } from '@/services/usersService';

/**
 * La cuenta con la que entra un socio o un postulante, y la forma de darle
 * una contraseña nueva si se olvidó la suya. Solo la ve la administración: el
 * backend es el que no le da estos datos a nadie más.
 */
const props = defineProps<{
  usuarioId: number;
  email: string;
  nombre: string;
}>();

const open = ref(false);
const loading = ref(false);
const error = ref('');
const password = ref('');
const copied = ref(false);

function start() {
  password.value = '';
  error.value = '';
  copied.value = false;
  open.value = true;
}

function close() {
  if (loading.value) return;

  open.value = false;
  // No queda en la pantalla después de cerrar.
  password.value = '';
}

async function generate() {
  loading.value = true;
  error.value = '';

  try {
    password.value = (await resetPassword(props.usuarioId)).password;
  } catch (err) {
    error.value =
      err instanceof Error
        ? err.message
        : 'No se pudo generar la contraseña nueva';
  } finally {
    loading.value = false;
  }
}

async function copy() {
  try {
    await navigator.clipboard.writeText(password.value);
    copied.value = true;
  } catch {
    // Sin permiso para el portapapeles: queda seleccionable a mano.
    copied.value = false;
  }
}
</script>

<template>
  <section
    class="rounded-xl border border-slate-200 bg-white p-5"
    aria-labelledby="cuenta-acceso"
  >
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div class="min-w-0">
        <h2 id="cuenta-acceso" class="text-base font-semibold text-slate-900">
          Cuenta de acceso
        </h2>

        <p class="mt-1 text-base text-slate-600">
          Entra al sistema con
          <span class="font-medium text-slate-800">{{ email }}</span
          >.
        </p>

        <p class="mt-1 text-base text-slate-600">
          Si se olvidó la contraseña, generale una nueva y entregásela.
        </p>
      </div>

      <button
        type="button"
        class="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base font-semibold text-slate-700 transition hover:border-ccisj hover:text-ccisj"
        @click="start"
      >
        <KeyRound class="h-4 w-4" />
        Generar contraseña nueva
      </button>
    </div>

    <BaseModal
      :open="open"
      title="Contraseña nueva"
      :close-on-backdrop="!password && !loading"
      @close="close"
    >
      <div class="space-y-3 px-6 py-5 text-base leading-6 text-slate-600">
        <template v-if="!password">
          <p>
            Se va a generar una contraseña nueva para
            <strong class="text-slate-900">{{ nombre }}</strong
            >.
          </p>

          <p>
            La que tiene ahora deja de servir y se cierran las sesiones que
            tenga abiertas.
          </p>

          <p v-if="error" role="alert" class="font-medium text-red-700">
            {{ error }}
          </p>
        </template>

        <template v-else>
          <p>
            Entregale esta contraseña a
            <strong class="text-slate-900">{{ nombre }}</strong
            >. <strong class="text-slate-900">No se vuelve a mostrar.</strong>
          </p>

          <p
            data-test="password"
            class="select-all rounded-lg bg-slate-100 px-4 py-3 text-center font-mono text-lg font-semibold text-slate-900"
          >
            {{ password }}
          </p>

          <p class="text-slate-600">
            Entra con {{ email }}. Conviene que la cambie desde Mi cuenta apenas
            entre.
          </p>
        </template>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <template v-if="!password">
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-600 transition hover:bg-slate-50"
              :disabled="loading"
              @click="close"
            >
              Cancelar
            </button>

            <button
              type="button"
              class="rounded-lg bg-ccisj px-4 py-2 text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="loading"
              @click="generate"
            >
              {{ loading ? 'Generando...' : 'Generar contraseña nueva' }}
            </button>
          </template>

          <template v-else>
            <button
              type="button"
              class="rounded-lg border border-slate-200 bg-white px-4 py-2 text-base font-medium text-slate-600 transition hover:bg-slate-50"
              @click="copy"
            >
              {{ copied ? 'Copiada' : 'Copiar' }}
            </button>

            <button
              type="button"
              class="rounded-lg bg-ccisj px-4 py-2 text-base font-semibold text-white transition hover:opacity-90"
              @click="close"
            >
              Listo, ya la anoté
            </button>
          </template>
        </div>
      </template>
    </BaseModal>
  </section>
</template>
