<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';

import { RouterLink, useRoute, useRouter } from 'vue-router';

import { storeToRefs } from 'pinia';

import logoBlanco from '@/assets/CCISJ logo sin fondo - Letras blancas.png';
import {
  Bell,
  Briefcase,
  Building2,
  ClipboardList,
  FileUser,
  LayoutDashboard,
  ReceiptText,
  UserRound,
  UserRoundSearch,
  Users,
  Wallet,
  X,
} from 'lucide-vue-next';

import { useAuthStore } from '@/stores/auth';
import { useNotificationsStore } from '@/stores/notifications';
import { useUiStore } from '@/stores/ui';

const auth = useAuthStore();
const ui = useUiStore();
const notificationsStore = useNotificationsStore();
const route = useRoute();
const router = useRouter();

const { unreadCount } = storeToRefs(notificationsStore);

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
 * Una sección solo es navegable si su ruta existe en el router y es para este
 * rol. Las que todavía no se construyeron se muestran deshabilitadas en vez de
 * llevar a una pantalla en blanco: en cuanto alguien agrega la ruta, se
 * activan solas.
 */
function isAvailable(path: string) {
  const resolved = router.resolve(path);

  if (resolved.matched.length === 0 || resolved.name === 'not-found') {
    return false;
  }

  const roles = resolved.meta.roles as string[] | undefined;

  if (roles && (!auth.role || !roles.includes(auth.role))) {
    return false;
  }

  if (
    resolved.meta.directivoOnly &&
    auth.role === 'SOCIO' &&
    auth.user?.memberType !== 'DIRECTIVO'
  ) {
    return false;
  }

  return true;
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
          title: 'Gestión',
          items: [
            { label: 'Socios', icon: Users, to: '/socios' },
            { label: 'Cuotas', icon: ReceiptText, to: '/cuotas' },
            { label: 'Caja', icon: Wallet, to: '/caja' },
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
          ],
        },
      ];

    case 'SOCIO': {
      const empresaItems: NavItem[] = [
        { label: 'Mi empresa', icon: Building2, to: '/mi-empresa' },
      ];

      if (auth.user?.memberType === 'DIRECTIVO') {
        empresaItems.unshift(
          { label: 'Socios', icon: Users, to: '/socios' },
          {
            label: 'Buscar candidatos',
            icon: UserRoundSearch,
            to: '/candidatos',
          },
        );
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
              to: '/postulaciones-recibidas',
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
      return auth.user?.memberType === 'DIRECTIVO'
        ? 'Socio directivo'
        : 'Portal de socios';
    case 'POSTULANTE':
      return 'Postulante';
    default:
      return '';
  }
});

const initials = computed(() => {
  const words = (auth.user?.displayName ?? '').trim().split(/\s+/);
  const first = words.at(0) ?? '';
  const last = words.at(-1) ?? '';

  if (!first) return '';
  if (!last || first === last) return first.slice(0, 2).toUpperCase();

  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
});

/**
 * Activa también en las pantallas de adentro (la ficha de un socio deja
 * marcado "Socios"), salvo Inicio, que si no estaría siempre marcado.
 */
function isCurrent(item: NavItem) {
  if (item.to === '/') return route.path === '/';

  return route.path === item.to || route.path.startsWith(`${item.to}/`);
}

function badgeFor(item: NavItem) {
  return item.to === '/notificaciones' && !auth.isAdmin ? unreadCount.value : 0;
}

async function handleLogout() {
  notificationsStore.clear();
  await auth.logout();
  await router.replace('/login');
}

// En pantallas chicas el panel se cierra al navegar.
watch(() => route.fullPath, ui.closeSidebar);

onMounted(async () => {
  // El contador de avisos sin leer, para el menú. A la administración no le
  // llegan avisos: los manda.
  if (!auth.isAdmin) {
    try {
      await notificationsStore.fetchMine();
    } catch {
      // Sin el contador, el menú igual funciona.
    }
  }
});
</script>

<template>
  <!-- Fondo oscuro detrás del panel, solo mientras está abierto en mobile -->
  <div
    v-if="ui.sidebarOpen"
    class="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
    @click="ui.closeSidebar"
  />

  <aside
    class="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-ccisj-deep text-white transition-transform lg:translate-x-0"
    :class="ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
  >
    <div class="flex shrink-0 items-start justify-between gap-2 px-6 pb-4 pt-6">
      <RouterLink to="/" aria-label="Ir al inicio" class="rounded-lg">
        <img
          :src="logoBlanco"
          alt="Centro Comercial e Industrial de San José"
          class="h-16 w-auto"
        />
      </RouterLink>

      <button
        type="button"
        class="-mr-2 rounded-lg p-2 text-white/80 transition hover:bg-white/10 hover:text-white lg:hidden"
        aria-label="Cerrar menú"
        @click="ui.closeSidebar"
      >
        <X class="h-6 w-6" />
      </button>
    </div>

    <nav aria-label="Menú principal" class="flex-1 overflow-y-auto px-4 pb-4">
      <p class="mb-3 px-3 text-sm font-semibold text-ccisj-mist">
        {{ sectionTitle }}
      </p>

      <div v-for="group in groups" :key="group.title" class="mb-5 last:mb-0">
        <p
          v-if="group.title !== 'General'"
          class="mb-1 px-3 text-sm text-ccisj-mist"
        >
          {{ group.title }}
        </p>

        <div class="space-y-1">
          <template v-for="item in group.items" :key="item.to">
            <RouterLink
              v-if="isAvailable(item.to)"
              :to="item.to"
              class="flex min-h-12 items-center gap-3 rounded-xl px-3 text-base transition"
              :class="
                isCurrent(item)
                  ? 'bg-white font-bold text-ccisj-deep'
                  : 'font-medium text-white/90 hover:bg-white/10 hover:text-white'
              "
              :aria-current="isCurrent(item) ? 'page' : undefined"
            >
              <component :is="item.icon" class="h-5 w-5 shrink-0" />
              <span class="flex-1">{{ item.label }}</span>
              <span
                v-if="badgeFor(item) > 0"
                class="flex min-h-6 min-w-6 items-center justify-center rounded-full px-2 text-sm font-bold"
                :class="
                  isCurrent(item)
                    ? 'bg-ccisj-deep text-white'
                    : 'bg-white text-ccisj-deep'
                "
                :aria-label="`${badgeFor(item)} sin leer`"
              >
                {{ badgeFor(item) > 99 ? '99+' : badgeFor(item) }}
              </span>
            </RouterLink>

            <!-- Pantalla todavía no construida: se muestra, pero no navega -->
            <span
              v-else
              aria-disabled="true"
              title="Todavía no disponible"
              class="flex min-h-12 cursor-not-allowed items-center gap-3 rounded-xl px-3 text-base font-medium text-white/50"
            >
              <component :is="item.icon" class="h-5 w-5 shrink-0" />
              <span class="flex-1">{{ item.label }}</span>
              <span class="rounded-full bg-white/10 px-2 py-0.5 text-sm">
                Pronto
              </span>
            </span>
          </template>
        </div>
      </div>
    </nav>

    <!-- Quién está usando el sistema, y salir -->
    <div class="shrink-0 border-t border-white/15 px-5 py-4">
      <div class="flex items-center gap-3">
        <span
          aria-hidden="true"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ccisj-light font-bold text-ccisj-deep"
        >
          {{ initials }}
        </span>

        <div class="min-w-0">
          <p class="truncate font-bold">{{ auth.user?.displayName }}</p>
          <p class="truncate text-sm text-ccisj-mist">
            {{ auth.user?.email }}
          </p>
        </div>
      </div>

      <div class="mt-3 flex gap-2">
        <RouterLink
          :to="{ name: 'mi-cuenta' }"
          class="flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/30 text-base text-white transition hover:bg-white/10"
          active-class="bg-white/15"
        >
          Mi cuenta
        </RouterLink>

        <button
          type="button"
          class="min-h-11 flex-1 rounded-xl border border-white/30 text-base text-white transition hover:bg-white/10"
          @click="handleLogout"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  </aside>
</template>
