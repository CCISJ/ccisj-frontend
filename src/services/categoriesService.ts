import type { Category } from '@/types/offer.type';

import { apiFetch } from './api';

export function getCategories() {
  return apiFetch<Category[]>('/categorias');
}
