import type {
  CreateNotificationData,
  Notification,
  NotificationAvailableRecipient,
  ReceivedNotification,
} from '@/types/notification.type';

import { apiFetch } from './api';

export async function getAll() {
  return apiFetch<Notification[]>('/notificaciones');
}

export async function getMine() {
  return apiFetch<ReceivedNotification[]>('/notificaciones/recibidas');
}

export async function getPendingPopups() {
  return apiFetch<ReceivedNotification[]>('/notificaciones/emergentes');
}

export function getAvailableRecipients() {
  return apiFetch<NotificationAvailableRecipient[]>(
    '/usuarios/destinatarios-notificaciones',
  );
}

export async function markAsRead(id: number) {
  return apiFetch<ReceivedNotification>(`/notificaciones/${id}/leida`, {
    method: 'PATCH',
  });
}

export async function markPopupAsSeen(id: number) {
  return apiFetch<ReceivedNotification>(
    `/notificaciones/${id}/emergente-vista`,
    {
      method: 'PATCH',
    },
  );
}

export async function create(data: CreateNotificationData) {
  return apiFetch<Notification>('/notificaciones', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
