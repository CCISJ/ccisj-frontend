import { apiFetch } from './api';
import type {
  CreateOfferData,
  OwnOffer,
  UpdateOfferData,
} from '@/types/offer.type';

// Las respuestas de crear y editar traen la oferta sin el conteo de
// postulaciones: después de guardar se vuelve a pedir con getMyOffer.

export function getMyOffers() {
  return apiFetch<OwnOffer[]>('/ofertas/mias');
}

export function getMyOffer(id: number) {
  return apiFetch<OwnOffer>(`/ofertas/mias/${id}`);
}

export function createOffer(data: CreateOfferData) {
  return apiFetch<{ id: number }>('/ofertas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateOffer(id: number, data: UpdateOfferData) {
  return apiFetch<{ id: number }>(`/ofertas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteOffer(id: number) {
  return apiFetch<void>(`/ofertas/${id}`, {
    method: 'DELETE',
  });
}
