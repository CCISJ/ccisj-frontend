import { apiFetch } from '@/services/api';

import type {
  CashCategory,
  CashMovement,
  CashMovementFilters,
  CashSummary,
  CreateCashCategoryData,
  CreateCashMovementData,
} from '@/types/cash.type';

export function getCashMovements(filters: CashMovementFilters = {}) {
  const params = new URLSearchParams();

  if (filters.desde) {
    params.set('desde', filters.desde);
  }

  if (filters.hasta) {
    params.set('hasta', filters.hasta);
  }

  if (filters.tipo) {
    params.set('tipo', filters.tipo);
  }

  if (filters.categoriaId) {
    params.set('categoriaId', String(filters.categoriaId));
  }

  if (filters.buscar) {
    params.set('buscar', filters.buscar);
  }

  const query = params.toString();

  return apiFetch<CashMovement[]>(
    `/caja/movimientos${query ? `?${query}` : ''}`,
  );
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

export function getSummary() {
  return apiFetch<CashSummary>('/caja/movimientos/resumen');
}
