<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import { useRouter } from 'vue-router';

import logoVerde from '@/assets/CCISJ logo sin fondo - Letras verdes.png';
import {
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  Phone,
  UserRound,
} from 'lucide-vue-next';

import { PASSWORD_MAX, PASSWORD_MIN } from '@/services/accountService';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const form = reactive({
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  password: '',
  confirmPassword: '',
});

const error = ref('');
const showPassword = ref(false);
const loading = ref(false);

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-ccisj focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70';

// Las mismas reglas que valida el backend; acá solo para avisar antes de enviar.
const passwordChecks = computed(() => [
  {
    label: `Al menos ${PASSWORD_MIN} caracteres`,
    ok: form.password.length >= PASSWORD_MIN,
  },
  {
    label: 'Al menos una letra y un número',
    ok: /\p{L}/u.test(form.password) && /\p{Nd}/u.test(form.password),
  },
]);

function validate() {
  if (!form.nombre.trim() || !form.apellido.trim() || !form.email.trim()) {
    return 'Completá nombre, apellido y correo electrónico.';
  }

  if (passwordChecks.value.some((check) => !check.ok)) {
    return 'La contraseña no cumple los requisitos.';
  }

  if (form.password.length > PASSWORD_MAX) {
    return `La contraseña no puede superar los ${PASSWORD_MAX} caracteres.`;
  }

  if (form.password !== form.confirmPassword) {
    return 'Las contraseñas no coinciden.';
  }

  return '';
}

async function handleRegister() {
  if (loading.value) return;

  error.value = validate();

  if (error.value) return;

  loading.value = true;

  try {
    await auth.register({
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim() || undefined,
      password: form.password,
    });

    await router.replace('/');
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Error al crear la cuenta';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen bg-slate-50">
    <!-- Panel izquierdo -->
    <section
      class="hidden w-1/2 flex-col justify-between bg-ccisj p-12 text-white lg:flex"
    >
      <div>
        <img
          :src="logoVerde"
          alt="Centro Comercial e Industrial de San José"
          class="w-56 brightness-0 invert"
        />
      </div>

      <div class="max-w-lg">
        <h1 class="text-4xl font-bold leading-tight">Bolsa de trabajo</h1>

        <p class="mt-5 text-base leading-relaxed text-white/75">
          Creá tu cuenta para postularte a las ofertas laborales de las
          empresas socias del Centro Comercial e Industrial de San José.
        </p>
      </div>

      <p class="text-xs text-white">
        © 2026 Centro Comercial e Industrial de San José
      </p>
    </section>

    <!-- Registro -->
    <section class="flex flex-1 items-center justify-center px-6 py-12">
      <div class="w-full max-w-md">
        <!-- Logo mobile -->
        <div class="mb-10 lg:hidden">
          <img
            :src="logoVerde"
            alt="Centro Comercial e Industrial de San José"
            class="mx-auto w-52"
          />
        </div>

        <div class="mb-8">
          <h2 class="text-3xl font-bold tracking-tight text-slate-900">
            Crear cuenta
          </h2>

          <p class="mt-2 text-sm text-slate-500">
            Registrate como postulante para buscar trabajo.
          </p>
        </div>

        <form class="space-y-5" novalidate @submit.prevent="handleRegister">
          <!-- Nombre y apellido -->
          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                for="nombre"
                class="mb-2 block text-sm font-medium text-slate-700"
              >
                Nombre
              </label>

              <div class="relative">
                <UserRound
                  class="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="nombre"
                  v-model="form.nombre"
                  type="text"
                  placeholder="Juan"
                  autocomplete="given-name"
                  maxlength="100"
                  :disabled="loading"
                  :class="inputClass"
                  @input="error = ''"
                />
              </div>
            </div>

            <div>
              <label
                for="apellido"
                class="mb-2 block text-sm font-medium text-slate-700"
              >
                Apellido
              </label>

              <div class="relative">
                <UserRound
                  class="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="apellido"
                  v-model="form.apellido"
                  type="text"
                  placeholder="Pérez"
                  autocomplete="family-name"
                  maxlength="100"
                  :disabled="loading"
                  :class="inputClass"
                  @input="error = ''"
                />
              </div>
            </div>
          </div>

          <!-- Email -->
          <div>
            <label
              for="email"
              class="mb-2 block text-sm font-medium text-slate-700"
            >
              Correo electrónico
            </label>

            <div class="relative">
              <Mail
                class="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
              />

              <input
                id="email"
                v-model="form.email"
                type="email"
                placeholder="correo@ejemplo.com"
                autocomplete="email"
                autocapitalize="none"
                maxlength="255"
                :disabled="loading"
                :class="inputClass"
                @input="error = ''"
              />
            </div>
          </div>

          <!-- Teléfono -->
          <div>
            <label
              for="telefono"
              class="mb-2 block text-sm font-medium text-slate-700"
            >
              Teléfono
              <span class="font-normal text-slate-400">(opcional)</span>
            </label>

            <div class="relative">
              <Phone
                class="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
              />

              <input
                id="telefono"
                v-model="form.telefono"
                type="tel"
                placeholder="099 123 456"
                autocomplete="tel"
                maxlength="50"
                :disabled="loading"
                :class="inputClass"
                @input="error = ''"
              />
            </div>
          </div>

          <!-- Contraseña -->
          <div>
            <label
              for="password"
              class="mb-2 block text-sm font-medium text-slate-700"
            >
              Contraseña
            </label>

            <div class="relative">
              <Lock
                class="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
              />

              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••••"
                autocomplete="new-password"
                :maxlength="PASSWORD_MAX"
                :disabled="loading"
                :class="[inputClass, 'pr-11']"
                aria-describedby="password-rules"
                @input="error = ''"
              />

              <button
                type="button"
                :disabled="loading"
                :aria-label="
                  showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                "
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="h-4.5 w-4.5" />
                <Eye v-else class="h-4.5 w-4.5" />
              </button>
            </div>

            <ul id="password-rules" class="mt-2 space-y-1 text-xs">
              <li
                v-for="check in passwordChecks"
                :key="check.label"
                :class="check.ok ? 'text-ccisj' : 'text-slate-400'"
              >
                {{ check.ok ? '✓' : '•' }} {{ check.label }}
              </li>
            </ul>
          </div>

          <!-- Confirmar contraseña -->
          <div>
            <label
              for="confirmPassword"
              class="mb-2 block text-sm font-medium text-slate-700"
            >
              Repetir contraseña
            </label>

            <div class="relative">
              <Lock
                class="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
              />

              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••••"
                autocomplete="new-password"
                :maxlength="PASSWORD_MAX"
                :disabled="loading"
                :class="inputClass"
                @input="error = ''"
              />
            </div>
          </div>

          <!-- Error -->
          <p
            v-if="error"
            role="alert"
            class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {{ error }}
          </p>

          <button
            type="submit"
            :disabled="loading"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-ccisj px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" />

            {{ loading ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
        </form>

        <p class="mt-8 text-center text-sm text-slate-500">
          ¿Ya tenés cuenta?
          <RouterLink to="/login" class="font-semibold text-ccisj hover:underline">
            Iniciá sesión
          </RouterLink>
        </p>
      </div>
    </section>
  </div>
</template>
