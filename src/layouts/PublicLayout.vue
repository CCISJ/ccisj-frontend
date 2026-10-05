<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router';

import logoVerde from '@/assets/CCISJ logo sin fondo - Letras verdes.png';
import { LogIn, UserPlus } from 'lucide-vue-next';

const route = useRoute();
</script>

<template>
  <!--
    Lo que ve alguien sin cuenta. No lleva barra lateral ni campana de
    notificaciones: no hay nada personal que mostrar. Las dos acciones son
    ingresar y registrarse, y las dos vuelven a donde estaba (`volver`) para
    que no pierda la oferta que estaba mirando.
  -->
  <div class="flex min-h-screen flex-col bg-slate-50">
    <header class="border-b border-slate-200 bg-white">
      <div
        class="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6"
      >
        <RouterLink
          :to="{ name: 'ofertas' }"
          class="flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
        >
          <img
            :src="logoVerde"
            alt="Centro Comercial e Industrial de San José"
            class="h-10 w-auto"
          />

          <span class="sr-only">Inicio de la bolsa de trabajo</span>
        </RouterLink>

        <div class="flex items-center gap-2">
          <RouterLink
            :to="{ name: 'registro', query: { volver: route.fullPath } }"
            class="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <UserPlus class="h-4 w-4" />
            Crear cuenta
          </RouterLink>

          <RouterLink
            :to="{ name: 'login', query: { volver: route.fullPath } }"
            class="flex items-center gap-1.5 rounded-xl bg-ccisj px-4 py-2 text-sm font-semibold text-white transition hover:bg-ccisj-dark"
          >
            <LogIn class="h-4 w-4" />
            Ingresar
          </RouterLink>
        </div>
      </div>
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
      <RouterView />
    </main>

    <footer class="border-t border-slate-200 bg-white">
      <div
        class="mx-auto w-full max-w-7xl px-4 py-4 text-xs text-slate-400 md:px-6"
      >
        Bolsa de trabajo del Centro Comercial e Industrial de San José.
      </div>
    </footer>
  </div>
</template>
