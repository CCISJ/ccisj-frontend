<script setup lang="ts">
import logoVerde from '@/assets/CCISJ logo sin fondo - Letras verdes.png';

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-vue-next';

import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const error = ref('');
const showPassword = ref(false);

function handleLogin() {
  error.value = '';

  try {
    auth.login(email.value, password.value);

    router.push('/');
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : 'Error al iniciar sesión';
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
        </div>

        <form class="space-y-5" @submit.prevent>
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
                class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
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
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <div class="relative">
              <Lock
                class="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400"
              />

              <input
                v-model="password"
                id="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-11 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
              />

              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="h-4.5 w-4.5" />
                <Eye v-else class="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          <p
            v-if="error"
            class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {{ error }}
          </p>

          <!-- Login -->
          <button
            type="submit"
            class="w-full rounded-xl bg-ccisj px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ccisj focus:ring-offset-2"
            @click="handleLogin"
          >
            Iniciar sesión
          </button>
        </form>

        <div class="mt-8 border-t border-slate-200 pt-6 text-center">
          <p class="text-sm text-slate-500">
            ¿Todavía no tenés una cuenta?

            <button class="font-semibold text-ccisj hover:underline">
              Registrarse
            </button>
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
