import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import * as notificationsService from '@/services/notificationsService';

import type {
  CreateNotificationData,
  Notification,
  ReceivedNotification,
} from '@/types/notification.type';

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<ReceivedNotification[]>([]);
  const sentNotifications = ref<Notification[]>([]);

  const loading = ref(false);
  const loadingSent = ref(false);

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

  async function createNotification(data: CreateNotificationData) {
    const notification = await notificationsService.create(data);

    sentNotifications.value.unshift(notification);

    return notification;
  }

  async function markAsRead(item: ReceivedNotification) {
    if (item.leida) return;

    await notificationsService.markAsRead(item.notificacionId);

    item.leida = true;
    item.fechaLectura = new Date().toISOString();
  }

  function clear() {
    notifications.value = [];
    sentNotifications.value = [];
  }

  return {
    notifications,
    sentNotifications,

    loading,
    loadingSent,

    unreadCount,

    fetchMine,
    fetchAll,
    createNotification,
    markAsRead,
    clear,
  };
});
