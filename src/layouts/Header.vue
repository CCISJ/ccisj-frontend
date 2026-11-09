<script setup lang="ts">
import { RouterLink } from 'vue-router';

import { storeToRefs } from 'pinia';

import logoVerde from '@/assets/CCISJ logo sin fondo - Letras verdes.png';
import { Bell, Menu } from 'lucide-vue-next';

import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { useUiStore } from '@/stores/ui';

/**
 * Solo en pantallas chicas: el botón que abre el menú, el logo y los avisos.
 * En una pantalla grande el menú está siempre a la vista y tiene todo esto
 * (el usuario y "Cerrar sesión" van al pie), así que la barra no se muestra:
 * antes ocupaba 80 px casi vacíos arriba de cada pantalla.
 */
const auth = useAuthStore();
const ui = useUiStore();
const { unreadCount } = storeToRefs(useNotificationsStore());
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden"
  >
    <button
      type="button"
      class="rounded-xl p-2 text-slate-700 transition hover:bg-slate-100"
      aria-label="Abrir menú"
      @click="ui.toggleSidebar"
    >
      <Menu class="h-6 w-6" />
    </button>

    <img
      :src="logoVerde"
      alt="Centro Comercial e Industrial de San José"
      class="h-10 w-auto"
    />

    <RouterLink
      v-if="!auth.isAdmin"
      to="/notificaciones"
      class="relative ml-auto flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:text-ccisj"
      :aria-label="
        unreadCount > 0
          ? `Notificaciones, ${unreadCount} sin leer`
          : 'Notificaciones'
      "
    >
      <Bell class="h-5 w-5" />

      <span
        v-if="unreadCount > 0"
        aria-hidden="true"
        class="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-700 px-1 text-sm font-bold text-white"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </RouterLink>
  </header>
</template>
