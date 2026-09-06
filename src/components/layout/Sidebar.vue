<script setup lang="ts">
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
  LogOut,
} from 'lucide-vue-next';

import logoVerde from '@/assets/CCISJ logo sin fondo - Letras verdes.png';

const items = [
  { label: 'Inicio', icon: LayoutDashboard },
  { label: 'Socios', icon: Users },
  { label: 'Empresas', icon: Building2 },
  { label: 'Ofertas laborales', icon: Briefcase },
  { label: 'Buscar candidatos', icon: UserRoundSearch },
  { label: 'Postulantes', icon: UserRound },
  { label: 'Notificaciones', icon: Bell },
  { label: 'Caja', icon: Wallet },
  { label: 'Comprobantes', icon: FileText },
  { label: 'Configuración', icon: Settings },
];
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
        Backoffice
      </p>

      <div class="space-y-1">
        <button
          v-for="(item, index) in items"
          :key="item.label"
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
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

    <div class="border-t border-slate-100 p-3">
      <button
        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <LogOut class="h-4.5 w-4.5" />
        Cerrar sesión
      </button>
    </div>
  </aside>
</template>
