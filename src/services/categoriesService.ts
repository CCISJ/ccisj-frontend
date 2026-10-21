import type { Category } from '@/types/offer.type';

import { apiFetch } from './api';

export type ActiveCategory = { id: number; nombre: string };

/** Las categorías activas, sin sesión (las usa el registro). */
export function getActiveCategories() {
  return apiFetch<ActiveCategory[]>('/categorias/activas');
}

export function getCategories() {
  return apiFetch<Category[]>('/categorias');
}
