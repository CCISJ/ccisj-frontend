import { apiFetch } from './api';
import type {
  MemberApplicationStatus,
  ReceivedApplication,
} from '@/types/application.type';

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
