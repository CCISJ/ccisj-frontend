import type {
  MemberApplicationStatus,
  OwnApplication,
  ReceivedApplication,
} from '@/types/application.type';

import { apiFetch } from './api';

/** Las postulaciones del postulante de la sesión, la más reciente primero. */
export function getMyApplications() {
  return apiFetch<OwnApplication[]>('/postulaciones/mias');
}

/** Se postula a una oferta, con el PDF que eligió (o ninguno). */
export function applyToOffer(data: {
  ofertaId: number;
  observaciones?: string;
  cvId: number | null;
}) {
  return apiFetch<{ id: number }>('/postulaciones', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Retira (borra) una postulación propia. */
export function withdrawApplication(id: number) {
  return apiFetch<void>(`/postulaciones/${id}`, {
    method: 'DELETE',
  });
}

export function getReceivedApplications() {
  return apiFetch<ReceivedApplication[]>('/postulaciones/recibidas');
}

export function getReceivedApplication(id: number) {
  return apiFetch<ReceivedApplication>(`/postulaciones/recibidas/${id}`);
}

/** Cambia el estado; el backend le avisa al postulante con una notificación. */
export function updateApplicationStatus(
  id: number,
  estado: MemberApplicationStatus,
) {
  return apiFetch<ReceivedApplication>(`/postulaciones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
}
