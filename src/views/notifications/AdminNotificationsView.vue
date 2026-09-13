<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { Bell, Send } from 'lucide-vue-next';

import { useToastStore } from '@/stores/toast';
import { useNotificationsStore } from '@/stores/notifications';
import { formatDate } from '@/utils/format';

import type {
  CreateNotificationData,
  Notification,
  NotificationRecipientType,
  NotificationType,
} from '@/types/notification.type';

const toast = useToastStore();
const notificationsStore = useNotificationsStore();

const { sentNotifications: notifications, loadingSent: loading } =
  storeToRefs(notificationsStore);

const sending = ref(false);

const titulo = ref('');
const mensaje = ref('');
const tipo = ref<NotificationType>('NORMAL');
const destinatarioTipo = ref<NotificationRecipientType>('TODOS');

const search = ref('');
const filterType = ref<'TODOS' | NotificationType>('TODOS');
const filterRecipient = ref<'TODOS' | 'SOCIOS' | 'POSTULANTES'>('TODOS');

const hasActiveFilters = computed(() => {
  return (
    search.value.trim() !== '' ||
    filterType.value !== 'TODOS' ||
    filterRecipient.value !== 'TODOS'
  );
});

const filteredNotifications = computed(() => {
  const query = search.value.trim().toLowerCase();

  return notifications.value.filter((notification) => {
    const matchesSearch =
      !query ||
      notification.titulo.toLowerCase().includes(query) ||
      notification.mensaje.toLowerCase().includes(query);

    const matchesType =
      filterType.value === 'TODOS' || notification.tipo === filterType.value;

    const recipient = recipientLabel(notification);

    const matchesRecipient =
      filterRecipient.value === 'TODOS' ||
      recipient ===
        (filterRecipient.value === 'SOCIOS' ? 'Socios' : 'Postulantes');

    return matchesSearch && matchesType && matchesRecipient;
  });
});

async function sendNotification() {
  if (!titulo.value.trim() || !mensaje.value.trim()) {
    toast.error('El título y el mensaje son obligatorios');
    return;
  }

  const data: CreateNotificationData = {
    titulo: titulo.value.trim(),
    mensaje: mensaje.value.trim(),
    tipo: tipo.value,
    destinatarioTipo: destinatarioTipo.value,
  };

  sending.value = true;

  try {
    await notificationsStore.createNotification(data);

    titulo.value = '';
    mensaje.value = '';
    tipo.value = 'NORMAL';
    destinatarioTipo.value = 'TODOS';

    toast.success('Notificación enviada correctamente');
  } catch (err) {
    toast.error(
      err instanceof Error ? err.message : 'No se pudo enviar la notificación',
    );
  } finally {
    sending.value = false;
  }
}

function recipientLabel(notification: Notification) {
  const tipos = new Set(
    notification.destinatarios.map((destinatario) => destinatario.usuario.tipo),
  );

  if (tipos.has('SOCIO') && tipos.has('POSTULANTE')) {
    return 'Todos';
  }

  if (tipos.size === 1 && tipos.has('SOCIO')) {
    return 'Socios';
  }

  if (tipos.size === 1 && tipos.has('POSTULANTE')) {
    return 'Postulantes';
  }

  return `${notification.destinatarios.length} usuario(s)`;
}

onMounted(async () => {
  try {
    await notificationsStore.fetchAll();
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : 'No se pudieron cargar las notificaciones',
    );
  }
});
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold text-slate-900">Notificaciones</h1>

      <p class="mt-1 text-sm text-slate-500">
        Enviá comunicaciones y avisos a los usuarios del sistema.
      </p>
    </div>

    <div class="grid gap-6 xl:grid-cols-[420px_1fr] xl:items-start">
      <section class="rounded-xl border border-slate-200 bg-white p-6">
        <div class="mb-5 flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-ccisj"
          >
            <Send :size="20" />
          </div>

          <div>
            <h2 class="font-semibold text-slate-900">Nueva notificación</h2>

            <p class="text-sm text-slate-500">Crear una comunicación.</p>
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="sendNotification">
          <div>
            <label
              for="titulo"
              class="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Título
            </label>

            <input
              id="titulo"
              v-model="titulo"
              type="text"
              maxlength="150"
              placeholder="Título de la notificación"
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-ccisj"
            />
          </div>

          <div>
            <label
              for="mensaje"
              class="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Mensaje
            </label>

            <textarea
              id="mensaje"
              v-model="mensaje"
              rows="5"
              placeholder="Escribí el mensaje..."
              class="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-ccisj"
            />
          </div>

          <div>
            <label
              for="destinatarios"
              class="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Destinatarios
            </label>

            <select
              id="destinatarios"
              v-model="destinatarioTipo"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-ccisj"
            >
              <option value="TODOS">Todos</option>

              <option value="SOCIOS">Socios</option>

              <option value="POSTULANTES">Postulantes</option>
            </select>
          </div>

          <div>
            <label
              for="tipo"
              class="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Tipo
            </label>

            <select
              id="tipo"
              v-model="tipo"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-ccisj"
            >
              <option value="NORMAL">Normal</option>

              <option value="EMERGENTE">Emergente</option>
            </select>

            <p v-if="tipo === 'EMERGENTE'" class="mt-2 text-xs text-amber-600">
              Las notificaciones emergentes se mostrarán al usuario al ingresar
              al sistema.
            </p>
          </div>

          <button
            type="submit"
            :disabled="sending"
            class="flex w-full items-center justify-center gap-2 rounded-lg bg-ccisj px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send :size="17" />

            {{ sending ? 'Enviando...' : 'Enviar notificación' }}
          </button>
        </form>
      </section>

      <section
        class="flex h-162.5 min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
      >
        <div class="shrink-0 border-b border-slate-200 p-6">
          <div class="flex items-center gap-3">
            <Bell :size="20" class="text-ccisj" />

            <div>
              <h2 class="font-semibold text-slate-900">Historial</h2>

              <p class="text-sm text-slate-500">
                <template v-if="hasActiveFilters">
                  Mostrando {{ filteredNotifications.length }} de
                  {{ notifications.length }} notificaciones enviadas
                </template>

                <template v-else>
                  {{ notifications.length }}
                  {{
                    notifications.length === 1
                      ? 'notificación enviada'
                      : 'notificaciones enviadas'
                  }}
                </template>
              </p>
            </div>
          </div>
        </div>

        <div class="shrink-0 border-b border-slate-200 p-4">
          <div class="grid gap-3 md:grid-cols-[1fr_160px_170px]">
            <input
              v-model="search"
              type="text"
              placeholder="Buscar por título o mensaje..."
              class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-ccisj"
            />

            <select
              v-model="filterType"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-ccisj"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="NORMAL">Normal</option>
              <option value="EMERGENTE">Emergente</option>
            </select>

            <select
              v-model="filterRecipient"
              class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-ccisj"
            >
              <option value="TODOS">Todos los destinatarios</option>
              <option value="SOCIOS">Socios</option>
              <option value="POSTULANTES">Postulantes</option>
            </select>
          </div>
        </div>

        <div
          v-if="loading"
          class="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500"
        >
          Cargando notificaciones...
        </div>

        <div
          v-else-if="filteredNotifications.length === 0"
          class="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500"
        >
          No se encontraron notificaciones.
        </div>

        <div
          v-else
          class="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto"
        >
          <article
            v-for="notification in filteredNotifications"
            :key="notification.id"
            class="p-5"
          >
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="font-medium text-slate-900">
                    {{ notification.titulo }}
                  </h3>

                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-medium"
                    :class="
                      notification.tipo === 'EMERGENTE'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    "
                  >
                    {{
                      notification.tipo === 'EMERGENTE' ? 'Emergente' : 'Normal'
                    }}
                  </span>
                </div>

                <p class="mt-2 whitespace-pre-line text-sm text-slate-600">
                  {{ notification.mensaje }}
                </p>

                <div
                  class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400"
                >
                  <span>
                    {{ recipientLabel(notification) }}
                  </span>

                  <span>
                    {{ notification.destinatarios.length }}
                    destinatario(s)
                  </span>

                  <span>
                    {{ formatDate(notification.fechaCreacion) }}
                  </span>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>
