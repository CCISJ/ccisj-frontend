<script setup lang="ts">
import { onMounted } from 'vue';

import { storeToRefs } from 'pinia';

import { Bell, Mail, MailOpen, TriangleAlert } from 'lucide-vue-next';

import { useNotificationsStore } from '@/stores/notifications';
import { useToastStore } from '@/stores/toast';

import { formatDate } from '@/utils/money';

const toast = useToastStore();

const notificationsStore = useNotificationsStore();

const { notifications, loading, unreadCount } = storeToRefs(notificationsStore);

async function markAsRead(item: (typeof notifications.value)[number]) {
  if (item.leida) return;

  try {
    await notificationsStore.markAsRead(item);
  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : 'No se pudo marcar la notificación como leída',
    );
  }
}

onMounted(async () => {
  try {
    await notificationsStore.fetchMine();
  } catch (error) {
    toast.error(
      error instanceof Error
        ? error.message
        : 'No se pudieron cargar las notificaciones',
    );
  }
});
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Notificaciones</h1>

        <p class="mt-1 text-sm text-slate-500">
          Notificaciones y avisos del Centro Comercial.
        </p>
      </div>

      <div
        v-if="!loading && unreadCount > 0"
        class="flex min-h-8 items-center justify-center rounded-full bg-green-50 px-3 text-sm font-medium text-ccisj"
      >
        {{ unreadCount }} sin leer
      </div>
    </div>

    <section
      class="overflow-hidden rounded-xl border border-slate-200 bg-white"
    >
      <div v-if="loading" class="p-10 text-center text-sm text-slate-500">
        Cargando notificaciones...
      </div>

      <div
        v-else-if="notifications.length === 0"
        class="flex flex-col items-center justify-center px-6 py-14 text-center"
      >
        <div
          class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400"
        >
          <Bell :size="22" />
        </div>

        <h2 class="font-medium text-slate-800">No tenés notificaciones</h2>

        <p class="mt-1 text-sm text-slate-500">
          Cuando recibas una notificación aparecerá acá.
        </p>
      </div>

      <div v-else>
        <button
          v-for="item in notifications"
          :key="item.id"
          type="button"
          class="group flex w-full cursor-pointer items-start gap-4 border-b border-slate-200 p-5 text-left transition last:border-b-0 hover:bg-slate-50"
          :class="{
            'bg-green-50/40': !item.leida,
          }"
          @click="markAsRead(item)"
        >
          <div
            class="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            :class="
              item.notificacion.tipo === 'EMERGENTE'
                ? 'bg-amber-100 text-amber-700'
                : item.leida
                  ? 'bg-slate-100 text-slate-500'
                  : 'bg-green-100 text-ccisj'
            "
          >
            <TriangleAlert
              v-if="item.notificacion.tipo === 'EMERGENTE'"
              :size="19"
            />

            <MailOpen v-else-if="item.leida" :size="19" />

            <Mail v-else :size="19" />
          </div>

          <div class="min-w-0 flex-1">
            <div
              class="flex flex-wrap items-start justify-between gap-x-4 gap-y-1"
            >
              <div class="flex flex-wrap items-center gap-2">
                <h2
                  class="text-sm text-slate-900"
                  :class="item.leida ? 'font-medium' : 'font-semibold'"
                >
                  {{ item.notificacion.titulo }}
                </h2>

                <span
                  v-if="item.notificacion.tipo === 'EMERGENTE'"
                  class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
                >
                  Importante
                </span>
              </div>

              <div
                class="ml-auto flex min-w-32.5 shrink-0 items-center justify-end gap-2"
              >
                <span
                  class="whitespace-nowrap text-right text-xs text-slate-400"
                >
                  {{ formatDate(item.notificacion.fechaCreacion) }}
                </span>

                <div class="flex h-5 w-5 items-center justify-center">
                  <MailOpen
                    v-if="!item.leida"
                    :size="16"
                    class="text-slate-400 opacity-0 transition group-hover:text-ccisj group-hover:opacity-100"
                    title="Marcar como leída"
                  />
                </div>
              </div>
            </div>

            <p
              class="mt-2 whitespace-pre-line text-sm leading-6"
              :class="item.leida ? 'text-slate-500' : 'text-slate-700'"
            >
              {{ item.notificacion.mensaje }}
            </p>
          </div>
        </button>
      </div>
    </section>
  </div>
</template>
