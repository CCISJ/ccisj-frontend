<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { Check, Eye, EyeOff, KeyRound, Lock, X } from 'lucide-vue-next';

import {
  changePassword,
  PASSWORD_MAX,
  PASSWORD_MIN,
} from '@/services/accountService';
import { useAuthStore } from '@/stores/auth';
import { useToastStore } from '@/stores/toast';

const auth = useAuthStore();
const toast = useToastStore();

const roleLabel = computed(() => {
  switch (auth.user?.role) {
    case 'ADMIN':
      return 'Administración';

    case 'SOCIO':
      return auth.user.memberType === 'DIRECTIVO' ? 'Socio directivo' : 'Socio';

    case 'POSTULANTE':
      return 'Postulante';

    default:
      return '';
  }
});

type Field = 'actual' | 'nueva' | 'repetir';

const form = reactive<Record<Field, string>>({
  actual: '',
  nueva: '',
  repetir: '',
});

const visible = reactive<Record<Field, boolean>>({
  actual: false,
  nueva: false,
  repetir: false,
});

const saving = ref(false);
const submitted = ref(false);
const serverError = ref('');
const changed = ref(false);

// Las contraseñas no se recortan: cuenta exactamente lo que se escribió.
const rules = computed(() => [
  {
    label: `Al menos ${PASSWORD_MIN} caracteres`,
    ok: form.nueva.length >= PASSWORD_MIN,
  },
  { label: 'Al menos una letra', ok: /\p{L}/u.test(form.nueva) },
  { label: 'Al menos un número', ok: /\p{Nd}/u.test(form.nueva) },
  {
    label: 'Distinta de la actual',
    ok: form.nueva !== '' && form.nueva !== form.actual,
  },
]);

const errors = computed(() => ({
  actual: form.actual ? '' : 'Ingresá tu contraseña actual',
  nueva: !form.nueva
    ? 'Ingresá la nueva contraseña'
    : rules.value.every((rule) => rule.ok)
      ? ''
      : 'La nueva contraseña no cumple los requisitos',
  repetir: !form.repetir
    ? 'Repetí la nueva contraseña'
    : form.repetir === form.nueva
      ? ''
      : 'Las contraseñas no coinciden',
}));

const isValid = computed(() => Object.values(errors.value).every((e) => !e));

function onInput() {
  serverError.value = '';
  changed.value = false;
}

async function submit() {
  submitted.value = true;
  serverError.value = '';

  if (!isValid.value || saving.value) return;

  try {
    saving.value = true;

    await changePassword({
      passwordActual: form.actual,
      passwordNueva: form.nueva,
    });

    form.actual = '';
    form.nueva = '';
    form.repetir = '';
    visible.actual = visible.nueva = visible.repetir = false;
    submitted.value = false;
    changed.value = true;

    toast.success('Contraseña actualizada');
  } catch (err) {
    serverError.value =
      err instanceof Error
        ? err.message
        : 'No se pudo cambiar la contraseña. Intentá nuevamente.';
  } finally {
    saving.value = false;
  }
}

const FIELDS: {
  field: Field;
  label: string;
  autocomplete: 'current-password' | 'new-password';
}[] = [
  {
    field: 'actual',
    label: 'Contraseña actual',
    autocomplete: 'current-password',
  },
  { field: 'nueva', label: 'Nueva contraseña', autocomplete: 'new-password' },
  {
    field: 'repetir',
    label: 'Repetir nueva contraseña',
    autocomplete: 'new-password',
  },
];

const inputClass =
  'h-11 w-full rounded-lg border bg-white pl-3 pr-11 text-sm text-slate-800 outline-none transition focus:ring-2';
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Mi cuenta</h1>

      <p class="mt-1 text-sm text-slate-500">
        Datos de acceso y contraseña de tu cuenta.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-5 lg:grid-cols-5">
      <!-- Acceso -->
      <section
        class="h-fit rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2"
      >
        <div class="mb-4 flex items-center gap-2">
          <Lock class="h-3.5 w-3.5 text-slate-400" />

          <h2
            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            Acceso
          </h2>
        </div>

        <dl class="space-y-4">
          <div>
            <dt class="text-xs text-slate-400">Email de acceso</dt>
            <dd class="mt-0.5 break-all text-sm text-slate-800">
              {{ auth.user?.email }}
            </dd>
          </div>

          <div>
            <dt class="text-xs text-slate-400">Tipo de cuenta</dt>
            <dd class="mt-0.5 text-sm text-slate-800">{{ roleLabel }}</dd>
          </div>
        </dl>

        <p class="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
          El email de acceso no se cambia desde el portal. Si necesitás
          cambiarlo, comunicate con la administración del CCISJ.
        </p>
      </section>

      <!-- Cambiar contraseña -->
      <section
        class="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-3"
      >
        <div class="mb-4 flex items-center gap-2">
          <KeyRound class="h-3.5 w-3.5 text-slate-400" />

          <h2
            class="text-xs font-semibold uppercase tracking-wide text-slate-400"
          >
            Cambiar contraseña
          </h2>
        </div>

        <form class="space-y-4" novalidate @submit.prevent="submit">
          <div v-for="item in FIELDS" :key="item.field">
            <label
              :for="`mi-cuenta-${item.field}`"
              class="mb-1.5 block text-sm font-medium text-slate-700"
            >
              {{ item.label }}
            </label>

            <div class="relative">
              <input
                :id="`mi-cuenta-${item.field}`"
                v-model="form[item.field]"
                :type="visible[item.field] ? 'text' : 'password'"
                :autocomplete="item.autocomplete"
                :maxlength="PASSWORD_MAX"
                spellcheck="false"
                autocapitalize="off"
                :aria-invalid="submitted && !!errors[item.field]"
                :aria-describedby="
                  submitted && errors[item.field]
                    ? `mi-cuenta-${item.field}-error`
                    : undefined
                "
                :class="[
                  inputClass,
                  submitted && errors[item.field]
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-slate-200 focus:border-ccisj focus:ring-emerald-100',
                ]"
                :disabled="saving"
                @input="onInput"
              />

              <button
                type="button"
                class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                :aria-label="
                  visible[item.field]
                    ? 'Ocultar contraseña'
                    : 'Mostrar contraseña'
                "
                :aria-pressed="visible[item.field]"
                @click="visible[item.field] = !visible[item.field]"
              >
                <EyeOff v-if="visible[item.field]" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>

            <p
              v-if="submitted && errors[item.field]"
              :id="`mi-cuenta-${item.field}-error`"
              class="mt-1 text-xs text-red-600"
            >
              {{ errors[item.field] }}
            </p>

            <!-- Requisitos de la nueva, a la vista mientras se escribe -->
            <ul
              v-if="item.field === 'nueva'"
              class="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2"
            >
              <li
                v-for="rule in rules"
                :key="rule.label"
                class="flex items-center gap-1.5 text-xs"
                :class="rule.ok ? 'text-emerald-700' : 'text-slate-400'"
              >
                <Check v-if="rule.ok" class="h-3.5 w-3.5" />
                <X v-else class="h-3.5 w-3.5" />
                {{ rule.label }}
              </li>
            </ul>
          </div>

          <p
            v-if="serverError"
            role="alert"
            class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {{ serverError }}
          </p>

          <p
            v-if="changed"
            role="status"
            class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
          >
            Contraseña actualizada. Por seguridad, se cerraron las sesiones
            abiertas en otros dispositivos.
          </p>

          <div
            class="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4"
          >
            <p class="text-xs text-slate-500">
              Al cambiarla se cierran tus sesiones en otros dispositivos.
            </p>

            <button
              type="submit"
              class="rounded-xl bg-ccisj px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="saving"
            >
              {{ saving ? 'Guardando...' : 'Cambiar contraseña' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>
