import { apiFetch } from '@/services/api';

import type {
  CashCategory,
  CashMovement,
  CreateCashCategoryData,
  CreateCashMovementData,
} from '@/types/cash.type';

export function getCashMovements() {
  return apiFetch<CashMovement[]>('/caja/movimientos');
}

export function getCashCategories() {
  return apiFetch<CashCategory[]>('/caja/categorias');
}

export function createCashMovement(data: CreateCashMovementData) {
  return apiFetch<CashMovement>('/caja/movimientos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function createCashCategory(data: CreateCashCategoryData) {
  return apiFetch<CashCategory>('/caja/categorias', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function deactivateCashCategory(id: number) {
  return apiFetch<CashCategory>(`/caja/categorias/${id}`, {
    method: 'DELETE',
  });
}
