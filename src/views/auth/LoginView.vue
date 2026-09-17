<script setup lang="ts">
import logoVerde from '@/assets/CCISJ logo sin fondo - Letras verdes.png';

import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Mail, Lock, Eye, EyeOff, LoaderCircle } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

// Llegó acá porque la sesión dejó de valer mientras usaba el sistema.
const sessionExpired = computed(() => route.query.sesion === 'vencida');

// A dónde volver después de entrar. Solo rutas internas: `//otro-sitio.com`
// también empieza con "/" y llevaría afuera.
function redirectTarget() {
  const target = route.query.volver;

  return typeof target === 'string' &&
    target.startsWith('/') &&
    !target.startsWith('//') &&
    !target.startsWith('/login')
    ? target
    : '/';
}

const email = ref('');
const password = ref('');
const error = ref('');
const showPassword = ref(false);
const showForgotHelp = ref(false);
const loading = ref(false);

async function handleLogin() {
  if (loading.value) return;

  error.value = '';
  loading.value = true;

  try {
    await auth.login(email.value.trim(), password.value);
    await router.replace(redirectTarget());
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Error al iniciar sesión';
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
        <h1 class="text-4xl font-bold leading-tight">
          Centro Comercial e Industrial de San José
        </h1>

        <p class="mt-5 text-base leading-relaxed text-white/75">
          Plataforma de gestión para socios, empresas y postulantes.
        </p>
      </div>

      <p class="text-xs text-white">
        © 2026 Centro Comercial e Industrial de San José
      </p>
    </section>

    <!-- Login -->
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
            Iniciar sesión
          </h2>

          <p class="mt-2 text-sm text-slate-500">
            Ingresá tus datos para acceder al sistema.
          </p>

          <p
            v-if="sessionExpired && !error"
            role="status"
            class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            Tu sesión se cerró. Volvé a iniciar sesión para continuar.
          </p>
        </div>

        <form class="space-y-5" @submit.prevent="handleLogin">
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
                v-model="email"
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                autocomplete="email"
                autocapitalize="none"
                :disabled="loading"
                @input="error = ''"
                class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-ccisj focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <div class="mb-2 flex items-center justify-between">
              <label for="password" class="text-sm font-medium text-slate-700">
                Contraseña
              </label>

              <button
                type="button"
                class="text-xs font-medium text-ccisj hover:underline"
                :aria-expanded="showForgotHelp"
                aria-controls="forgot-help"
                @click="showForgotHelp = !showForgotHelp"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <!-- No hay recuperación por email: la administración asigna una
                 contraseña nueva (definido por el cliente). -->
            <p
              v-if="showForgotHelp"
              id="forgot-help"
              class="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
            >
              Comunicate con la administración del Centro Comercial: te van a
              asignar una contraseña nueva.
            </p>

            <div class="relative">
              <Lock
                class="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
              />

              <input
                v-model="password"
                id="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="current-password"
                :disabled="loading"
                @input="error = ''"
                class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-ccisj focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
              />

              <button
                type="button"
                :disabled="loading"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="h-4.5 w-4.5" />
                <Eye v-else class="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          <!-- Error -->
          <p
            v-if="error"
            class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {{ error }}
          </p>

          <!-- Login -->
          <button
            type="submit"
            :disabled="loading"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-ccisj px-4 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" />

            {{ loading ? 'Iniciando sesión...' : 'Iniciar sesión' }}
          </button>
        </form>

        <!-- "Registrarse" no hacía nada: el registro de postulantes todavía no
             existe (falta que el cliente lo defina). Se vuelve a agregar con
             la pantalla de registro. -->
      </div>
    </section>
  </div>
</template>
