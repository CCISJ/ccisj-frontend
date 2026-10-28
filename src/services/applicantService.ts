import { apiFetch } from '@/services/api';

import type {
  Candidate,
  CandidateDetail,
  CandidateFilters,
  CandidateResponse,
} from '@/types/applicants.type';

export function searchCandidates(filters: CandidateFilters = {}) {
  const params = new URLSearchParams({
    page: String(filters.page ?? 1),
    limit: String(filters.limit ?? 10),
  });

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim());
  }

  if (filters.categoriaId) {
    params.set('categoriaId', filters.categoriaId);
  }

  if (filters.conEstudios) {
    params.set('conEstudios', 'true');
  }

  if (filters.conExperiencia) {
    params.set('conExperiencia', 'true');
  }

  return apiFetch<CandidateResponse>(
    `/postulantes/candidatos?${params.toString()}`,
  );
}

export function getCandidateById(id: number) {
  return apiFetch<CandidateDetail>(`/postulantes/candidatos/${id}`);
}

export function getCandidateCvFileUrl(candidateId: number, cvId: number) {
  return apiFetch<{ url: string }>(
    `/postulantes/candidatos/${candidateId}/cvs/${cvId}/archivo`,
  );
}
