<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { Users, Plus } from 'lucide-vue-next';

import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const areaLabel = computed(() => {
  switch (auth.role) {
    case 'ADMIN':
      return 'Backoffice CCISJ';

    case 'SOCIO':
      return 'Portal de socios';

    case 'POSTULANTE':
      return 'Portal de postulantes';

    default:
      return 'CCISJ';
  }
});

/**
 * Accesos directos a las pantallas que ya existen. El resto del menú queda
 * marcado como pendiente en el Sidebar, así que acá no se ofrece.
 */
const shortcuts = computed(() => {
  const items: { label: string; description: string; icon: typeof Users; to: string }[] =
    [];

  const puedeVerSocios =
    auth.role === 'ADMIN' ||
    (auth.role === 'SOCIO' && auth.user?.memberType === 'DIRECTIVO');

  if (puedeVerSocios) {
    items.push({
      label: 'Socios',
      description: 'Buscar y consultar las empresas socias',
      icon: Users,
      to: '/socios',
    });
  }

  if (auth.role === 'ADMIN') {
    items.push({
      label: 'Agregar socio',
      description: 'Registrar una empresa nueva',
      icon: Plus,
      to: '/socios/nuevo',
    });
  }

  return items;
});
</script>

<template>
  <div>
    <span
      class="inline-flex rounded-full bg-ccisj-light px-3 py-1 text-xs font-semibold text-ccisj ring-1 ring-emerald-100"
    >
      {{ areaLabel }}
    </span>

    <h1 class="mt-4 text-2xl font-bold text-slate-900">
      Hola, {{ auth.user?.name }}
    </h1>

    <p class="mt-1 text-sm text-slate-500">
      Bienvenido al sistema de gestión del CCISJ.
    </p>

    <div
      v-if="shortcuts.length > 0"
      class="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      <button
        v-for="shortcut in shortcuts"
        :key="shortcut.to"
        type="button"
        class="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-ccisj hover:bg-ccisj-light/40"
        @click="router.push(shortcut.to)"
      >
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ccisj-light text-ccisj"
        >
          <component :is="shortcut.icon" class="h-5 w-5" />
        </span>

        <span class="min-w-0">
          <span class="block text-sm font-semibold text-slate-800">
            {{ shortcut.label }}
          </span>

          <span class="mt-0.5 block text-xs text-slate-500">
            {{ shortcut.description }}
          </span>
        </span>
      </button>
    </div>
  </div>
</template>
