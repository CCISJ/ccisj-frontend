import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

import type { Socket } from 'socket.io-client';

import * as notificationsService from '@/services/notificationsService';
import { connectSocket, disconnectSocket } from '@/services/socket';

import type {
  CreateNotificationData,
  Notification,
  NotificationAvailableRecipient,
  ReceivedNotification,
} from '@/types/notification.type';

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<ReceivedNotification[]>([]);
  const sentNotifications = ref<Notification[]>([]);
  const pendingPopups = ref<ReceivedNotification[]>([]);
  const availableRecipients = ref<NotificationAvailableRecipient[]>([]);

  const loading = ref(false);
  const loadingSent = ref(false);
  const loadingRecipients = ref(false);

  const unreadCount = computed(
    () => notifications.value.filter((item) => !item.leida).length,
  );

  async function fetchMine() {
    loading.value = true;

    try {
      notifications.value = await notificationsService.getMine();
    } finally {
      loading.value = false;
    }
  }

  async function fetchAll() {
    loadingSent.value = true;

    try {
      sentNotifications.value = await notificationsService.getAll();
    } finally {
      loadingSent.value = false;
    }
  }

  async function fetchPendingPopups() {
    pendingPopups.value = await notificationsService.getPendingPopups();
  }

  async function markPopupAsSeen(item: ReceivedNotification) {
    await notificationsService.markPopupAsSeen(item.notificacionId);

    pendingPopups.value = pendingPopups.value.filter(
      (popup) => popup.id !== item.id,
    );
  }

  async function markAsRead(item: ReceivedNotification) {
    if (item.leida) return;

    await notificationsService.markAsRead(item.notificacionId);

    item.leida = true;
    item.fechaLectura = new Date().toISOString();
  }

  async function fetchAvailableRecipients() {
    loadingRecipients.value = true;

    try {
      availableRecipients.value =
        await notificationsService.getAvailableRecipients();
    } finally {
      loadingRecipients.value = false;
    }
  }

  async function createNotification(data: CreateNotificationData) {
    const notification = await notificationsService.create(data);

    sentNotifications.value.unshift(notification);

    return notification;
  }

  let socket: Socket | null = null;

  async function refreshReceivedNotifications() {
    await Promise.all([fetchMine(), fetchPendingPopups()]);
  }

  function onNewNotification() {
    void refreshReceivedNotifications().catch((error) => {
      console.error('Error actualizando notificaciones:', error);
    });
  }

  function onSocketConnect() {
    // Recuperar notificaciones recibidas mientras estuvimos desconectados.
    onNewNotification();
  }

  /*
   * El servidor corta la conexión cuando la sesión con la que se abrió deja
   * de valer: venció, o la contraseña cambió. Si la cambió la misma persona,
   * el navegador ya tiene la cookie nueva y la reconexión entra; si no, el
   * servidor la rechaza al conectar y Socket.IO no vuelve a intentar. Socket.IO
   * no reconecta solo después de un corte del servidor, por eso se pide acá.
   */
  function onSocketDisconnect(reason: string) {
    if (reason === 'io server disconnect') socket?.connect();
  }

  function startRealtime() {
    if (socket) return;

    socket = connectSocket();

    socket.on('notificacion:nueva', onNewNotification);
    socket.on('connect', onSocketConnect);
    socket.on('disconnect', onSocketDisconnect);
  }

  function stopRealtime() {
    if (!socket) return;

    socket.off('notificacion:nueva', onNewNotification);
    socket.off('connect', onSocketConnect);
    socket.off('disconnect', onSocketDisconnect);

    disconnectSocket();
    socket = null;
  }

  function clear() {
    stopRealtime();

    notifications.value = [];
    sentNotifications.value = [];
    pendingPopups.value = [];
    availableRecipients.value = [];
  }

  return {
    notifications,
    sentNotifications,

    loading,
    loadingSent,

    unreadCount,

    pendingPopups,
    fetchPendingPopups,
    markPopupAsSeen,

    availableRecipients,
    loadingRecipients,
    fetchAvailableRecipients,

    fetchMine,
    fetchAll,
    createNotification,
    markAsRead,
    clear,

    startRealtime,
    stopRealtime,
  };
});
