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
        { label: 'Inicio', icon: LayoutDashboard },
        { label: 'Socios', icon: Users },
        { label: 'Ofertas laborales', icon: Briefcase },
        { label: 'Buscar candidatos', icon: UserRoundSearch },
        { label: 'Postulantes', icon: UserRound },
        { label: 'Notificaciones', icon: Bell },
        { label: 'Caja', icon: Wallet },
        { label: 'Comprobantes', icon: FileText },
        { label: 'Configuración', icon: Settings },
      ];

    case 'SOCIO':
      return [
        { label: 'Inicio', icon: LayoutDashboard },
        { label: 'Mis ofertas', icon: Briefcase },
        { label: 'Postulantes', icon: UserRoundSearch },
        { label: 'Notificaciones', icon: Bell },
        { label: 'Mi empresa', icon: Building2 },
      ];

    case 'POSTULANTE':
      return [
        { label: 'Inicio', icon: LayoutDashboard },
        { label: 'Ofertas laborales', icon: Briefcase },
        { label: 'Mis postulaciones', icon: ClipboardList },
        { label: 'Mi CV', icon: FileUser },
        { label: 'Notificaciones', icon: Bell },
        { label: 'Mi perfil', icon: UserRound },
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
        <button
          v-for="(item, index) in items"
          :key="item.label"
          class="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
          :class="
            index === 0
              ? 'bg-ccisj-light text-ccisj ring-1 ring-emerald-100'
              : 'text-slate-500 hover:bg-ccisj-light hover:text-ccisj'
          "
        >
          <component :is="item.icon" class="h-4.5 w-4.5 shrink-0" />

          <span class="text-left">
            {{ item.label }}
          </span>
        </button>
      </div>
    </nav>
  </aside>
</template>
