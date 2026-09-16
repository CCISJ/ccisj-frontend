<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Bell, ChevronDown, KeyRound, LogOut, Menu } from 'lucide-vue-next';
import { storeToRefs } from 'pinia';

import { useAuthStore } from '@/stores/auth';
import { useUiStore } from '@/stores/ui';
import { useNotificationsStore } from '@/stores/notifications';

const userMenuOpen = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);

const auth = useAuthStore();
const ui = useUiStore();
const notificationsStore = useNotificationsStore();

const { unreadCount } = storeToRefs(notificationsStore);

const user = computed(() => auth.user);
const router = useRouter();

const roleLabels: Record<string, string> = {
  ADMIN: 'Administración',
  SOCIO: 'Socio',
  POSTULANTE: 'Postulante',
};

const roleLabel = computed(() => {
  if (!user.value) return '';

  if (user.value.role === 'SOCIO' && user.value.memberType === 'DIRECTIVO') {
    return 'Socio directivo';
  }

  return roleLabels[user.value.role] ?? '';
});

const initials = computed(() => {
  const name = user.value?.displayName;

  if (!name) return '';

  const words = name.trim().split(/\s+/);
  const first = words.at(0);
  const last = words.at(-1);

  if (!first) return '';

  if (!last || first === last) {
    return first.slice(0, 2).toUpperCase();
  }

  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
});

async function handleNotifications() {
  await router.push('/notificaciones');
}

async function handleAccount() {
  userMenuOpen.value = false;

  await router.push({ name: 'mi-cuenta' });
}

async function handleLogout() {
  userMenuOpen.value = false;

  notificationsStore.clear();

  await auth.logout();

  await router.replace('/login');
}

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;

  if (
    userMenuOpen.value &&
    userMenuRef.value &&
    !userMenuRef.value.contains(target)
  ) {
    userMenuOpen.value = false;
  }
}

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);

  if (!auth.isAdmin) {
    try {
      await notificationsStore.fetchMine();
    } catch {
      // No bloqueamos el header si falla la carga de notificaciones.
    }
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-20 items-center gap-3 border-b border-slate-200 bg-white px-4 md:px-6"
  >
    <button
      type="button"
      class="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
      aria-label="Abrir menú"
      @click="ui.toggleSidebar"
    >
      <Menu class="h-5 w-5" />
    </button>

    <div class="ml-auto flex items-center gap-2">
      <button
        v-if="!auth.isAdmin"
        type="button"
        class="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-ccisj"
        aria-label="Notificaciones"
        title="Notificaciones"
        @click="handleNotifications"
      >
        <Bell class="h-5 w-5" />

        <span
          v-if="unreadCount > 0"
          class="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>

      <!-- Usuario + dropdown -->
      <div ref="userMenuRef" class="relative">
        <button
          class="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 transition hover:bg-slate-50"
          @click="userMenuOpen = !userMenuOpen"
        >
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ccisj text-xs font-bold text-white"
          >
            {{ initials }}
          </div>

          <div class="hidden text-left md:block">
            <p
              class="max-w-40 truncate text-xs font-semibold leading-tight text-slate-800"
            >
              {{ user?.displayName }}
            </p>

            <p class="text-[11px] leading-tight text-slate-400">
              {{ roleLabel }}
            </p>
          </div>

          <ChevronDown
            class="h-4 w-4 text-slate-400 transition-transform"
            :class="{ 'rotate-180': userMenuOpen }"
          />
        </button>

        <!-- Dropdown -->
        <div
          v-if="userMenuOpen"
          class="absolute right-0 top-[calc(100%+6px)] z-50 min-w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md"
        >
          <div class="border-b border-slate-100 px-3 py-2.5">
            <p class="truncate text-sm font-semibold text-slate-800">
              {{ user?.displayName }}
            </p>

            <p class="truncate text-xs text-slate-400">
              {{ user?.email }}
            </p>
          </div>

          <button
            type="button"
            class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-ccisj"
            @click="handleAccount"
          >
            <KeyRound class="h-4 w-4 shrink-0" />
            Mi cuenta
          </button>

          <button
            class="flex w-full items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-red-50 hover:text-red-600"
            @click="handleLogout"
          >
            <LogOut class="h-4 w-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
