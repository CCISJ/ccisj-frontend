<script setup lang="ts">
import { computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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
  X,
} from 'lucide-vue-next';

import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';

import logoVerde from '@/assets/CCISJ logo sin fondo - Letras verdes.png';

const auth = useAuthStore();
const ui = useUiStore();
const route = useRoute();
const router = useRouter();

type NavItem = {
  label: string;
  icon: typeof Users;
  to: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

/**
 * Una sección solo es navegable si su ruta existe en el router. Las que
 * todavía no se construyeron se muestran deshabilitadas en vez de llevar a
 * una pantalla en blanco: en cuanto alguien agrega la ruta, se activan solas.
 */
function isAvailable(path: string) {
  const resolved = router.resolve(path);

  return resolved.matched.length > 0 && resolved.name !== 'not-found';
}

const groups = computed<NavGroup[]>(() => {
  switch (auth.role) {
    case 'ADMIN':
      return [
        {
          title: 'General',
          items: [
            { label: 'Inicio', icon: LayoutDashboard, to: '/' },
            { label: 'Notificaciones', icon: Bell, to: '/notificaciones' },
          ],
        },
        {
          title: 'Socios',
          items: [
            { label: 'Socios', icon: Users, to: '/socios' },
            { label: 'Caja', icon: Wallet, to: '/caja' },
            { label: 'Comprobantes', icon: FileText, to: '/comprobantes' },
          ],
        },
        {
          title: 'Empleo',
          items: [
            { label: 'Ofertas laborales', icon: Briefcase, to: '/ofertas' },
            {
              label: 'Buscar candidatos',
              icon: UserRoundSearch,
              to: '/candidatos',
            },
            { label: 'Postulantes', icon: UserRound, to: '/postulantes' },
          ],
        },
        {
          title: 'Sistema',
          items: [
            { label: 'Configuración', icon: Settings, to: '/configuracion' },
          ],
        },
      ];

    case 'SOCIO': {
      const empresaItems: NavItem[] = [
        { label: 'Mi empresa', icon: Building2, to: '/mi-empresa' },
      ];

      if (auth.user?.memberType === 'DIRECTIVO') {
        empresaItems.unshift({ label: 'Socios', icon: Users, to: '/socios' });
      }

      return [
        {
          title: 'General',
          items: [
            { label: 'Inicio', icon: LayoutDashboard, to: '/' },
            { label: 'Notificaciones', icon: Bell, to: '/notificaciones' },
          ],
        },
        { title: 'Mi empresa', items: empresaItems },
        {
          title: 'Empleo',
          items: [
            { label: 'Mis ofertas', icon: Briefcase, to: '/mis-ofertas' },
            {
              label: 'Postulantes',
              icon: UserRoundSearch,
              to: '/postulantes',
            },
          ],
        },
      ];
    }

    case 'POSTULANTE':
      return [
        {
          title: 'General',
          items: [
            { label: 'Inicio', icon: LayoutDashboard, to: '/' },
            { label: 'Notificaciones', icon: Bell, to: '/notificaciones' },
          ],
        },
        {
          title: 'Empleo',
          items: [
            { label: 'Ofertas laborales', icon: Briefcase, to: '/ofertas' },
            {
              label: 'Mis postulaciones',
              icon: ClipboardList,
              to: '/mis-postulaciones',
            },
          ],
        },
        {
          title: 'Mi cuenta',
          items: [
            { label: 'Mi CV', icon: FileUser, to: '/mi-cv' },
            { label: 'Mi perfil', icon: UserRound, to: '/mi-perfil' },
          ],
        },
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

// En pantallas chicas el panel se cierra al navegar.
watch(() => route.fullPath, ui.closeSidebar);
</script>

<template>
  <!-- Fondo oscuro detrás del panel, solo mientras está abierto en mobile -->
  <div
    v-if="ui.sidebarOpen"
    class="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
    @click="ui.closeSidebar"
  />

  <aside
    class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0"
    :class="ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div
      class="flex h-20 shrink-0 items-center justify-between border-b border-slate-100 px-5"
    >
      <img
        :src="logoVerde"
        alt="Centro Comercial e Industrial de San José"
        class="h-14 max-w-47.5 object-contain object-left"
      />

      <button
        type="button"
        class="-mr-2 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 lg:hidden"
        aria-label="Cerrar menú"
        @click="ui.closeSidebar"
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <nav class="flex-1 overflow-y-auto px-3 py-4">
      <p
        class="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400"
      >
        {{ sectionTitle }}
      </p>

      <div
        v-for="group in groups"
        :key="group.title"
        class="mb-4 last:mb-0"
      >
        <p class="mb-1 px-3 text-[11px] font-medium text-slate-400">
          {{ group.title }}
        </p>

        <div class="space-y-0.5">
          <template v-for="item in group.items" :key="item.to">
            <RouterLink
              v-if="isAvailable(item.to)"
              :to="item.to"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-ccisj-light hover:text-ccisj"
              exact-active-class="bg-ccisj-light text-ccisj ring-1 ring-emerald-100"
            >
              <component :is="item.icon" class="h-5 w-5 shrink-0" />

              {{ item.label }}
            </RouterLink>

            <!-- Pantalla todavía no construida: se muestra, pero no navega -->
            <span
              v-else
              aria-disabled="true"
              title="Todavía no disponible"
              class="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400"
            >
              <component :is="item.icon" class="h-5 w-5 shrink-0" />

              <span class="flex-1">{{ item.label }}</span>

              <span
                class="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400"
              >
                Pronto
              </span>
            </span>
          </template>
        </div>
      </div>
    </nav>
  </aside>
</template>
