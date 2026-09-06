<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import { Search, Bell, ChevronDown, LogOut } from 'lucide-vue-next';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { useRouter } from 'vue-router';

const userMenuOpen = ref(false);
const userMenuRef = ref<HTMLElement | null>(null);

const auth = useAuthStore();
const user = computed(() => auth.user);
const router = useRouter();

const initials = computed(() => {
  const name = user.value?.name;

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

function handleLogout() {
  userMenuOpen.value = false;

  auth.logout();
  router.push('/login');
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

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-20 items-center border-b border-slate-200 bg-white px-6"
  >
    <div class="relative w-full max-w-xl">
      <Search
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      />

      <input
        type="text"
        placeholder="Buscar socios, ofertas, postulantes..."
        class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-ccisj focus:ring-2 focus:ring-emerald-100"
      />
    </div>

    <div class="ml-auto flex h-full items-center gap-3">
      <button
        class="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-ccisj-light hover:text-ccisj"
      >
        <Bell class="h-5 w-5" />

        <span class="absolute right-2 top-2 h-2 w-2 rounded-full bg-ccisj" />
      </button>

      <!-- Usuario + dropdown -->
      <div ref="userMenuRef" class="relative">
        <button
          class="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 transition hover:bg-slate-50"
          @click="userMenuOpen = !userMenuOpen"
        >
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-ccisj text-xs font-bold text-white"
          >
            {{ initials }}
          </div>

          <div class="hidden text-left md:block">
            <p
              class="max-w-40 truncate text-xs font-semibold leading-tight text-slate-800"
            >
              {{ user?.name }}
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
          class="absolute right-0 top-[calc(100%+6px)] z-50 min-w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md"
        >
          <button
            class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-600 transition hover:bg-red-50 hover:text-red-600"
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
