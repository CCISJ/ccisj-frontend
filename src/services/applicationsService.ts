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
