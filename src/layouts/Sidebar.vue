<script setup lang="ts">
import { computed } from 'vue';

import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  UserRoundSearch,
  UserRound,
  Bell,
  Wallet,
  FileText,
  Settings,
  FileUser,
  ClipboardList,
} from 'lucide-vue-next';

import { useAuthStore } from '@/stores/auth';

import logoVerde from '@/assets/CCISJ logo sin fondo - Letras verdes.png';

const auth = useAuthStore();

const items = computed(() => {
  switch (auth.role) {
    case 'ADMIN':
      return [
        { label: 'Inicio', icon: LayoutDashboard, to: '/' },
        { label: 'Socios', icon: Users, to: '/socios' },
        { label: 'Ofertas laborales', icon: Briefcase, to: '/ofertas' },
        {
          label: 'Buscar candidatos',
          icon: UserRoundSearch,
          to: '/candidatos',
        },
        { label: 'Postulantes', icon: UserRound, to: '/postulantes' },
        { label: 'Notificaciones', icon: Bell, to: '/notificaciones' },
        { label: 'Caja', icon: Wallet, to: '/caja' },
        { label: 'Comprobantes', icon: FileText, to: '/comprobantes' },
        { label: 'Configuración', icon: Settings, to: '/configuracion' },
      ];

    case 'SOCIO': {
      const socioItems = [
        { label: 'Inicio', icon: LayoutDashboard, to: '/' },
        { label: 'Mis ofertas', icon: Briefcase, to: '/mis-ofertas' },
        { label: 'Postulantes', icon: UserRoundSearch, to: '/postulantes' },
        { label: 'Notificaciones', icon: Bell, to: '/notificaciones' },
        { label: 'Mi empresa', icon: Building2, to: '/mi-empresa' },
      ];

      if (auth.user?.memberType === 'DIRECTIVO') {
        socioItems.splice(1, 0, {
          label: 'Socios',
          icon: Users,
          to: '/socios',
        });
      }

      return socioItems;
    }

    case 'POSTULANTE':
      return [
        { label: 'Inicio', icon: LayoutDashboard, to: '/' },
        { label: 'Ofertas laborales', icon: Briefcase, to: '/ofertas' },
        {
          label: 'Mis postulaciones',
          icon: ClipboardList,
          to: '/mis-postulaciones',
        },
        { label: 'Mi CV', icon: FileUser, to: '/mi-cv' },
        { label: 'Notificaciones', icon: Bell, to: '/notificaciones' },
        { label: 'Mi perfil', icon: UserRound, to: '/mi-perfil' },
      ];

    default:
      return [];
  }
});

const sectionTitle = computed(() => {
  switch (auth.role) {
    case 'ADMIN':
      return 'Administración';

    case 'SOCIO':
      return 'Portal de socios';

    case 'POSTULANTE':
      return 'Postulante';

    default:
      return '';
  }
});
</script>

<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white"
  >
    <div class="flex h-20 items-center border-b border-slate-100 px-5">
      <img
        :src="logoVerde"
        alt="Centro Comercial e Industrial de San José"
        class="h-14 max-w-47.5 object-contain object-left"
      />
    </div>

    <nav class="flex-1 overflow-y-auto px-3 py-4">
      <p
        class="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400"
      >
        {{ sectionTitle }}
      </p>

      <div class="space-y-1">
        <RouterLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-ccisj-light hover:text-ccisj"
          exact-active-class="bg-ccisj-light text-ccisj ring-1 ring-emerald-100"
        >
          <component :is="item.icon" class="h-5 w-5" />

          {{ item.label }}
        </RouterLink>
      </div>
    </nav>
  </aside>
</template>
