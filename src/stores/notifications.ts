import { computed, ref } from 'vue';

import { defineStore } from 'pinia';

import * as notificationsService from '@/services/notificationsService';

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

  function clear() {
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
  };
});
