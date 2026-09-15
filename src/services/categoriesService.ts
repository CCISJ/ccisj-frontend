import { apiFetch } from './api';
import type { Category } from '@/types/offer.type';

export function getCategories() {
  return apiFetch<Category[]>('/categorias');
}
