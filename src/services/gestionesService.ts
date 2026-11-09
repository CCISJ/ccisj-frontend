import type {
  ArchivoGestion,
  CategoriaGestion,
  Gestion,
  GestionData,
  GestionResumen,
} from '@/types/gestion.type';

import { apiFetch } from './api';

export const GESTION_ACCEPT = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.docx',
  '.xlsx',
].join(',');

/** Lo mismo que limita el backend: avisar antes evita una subida en vano. */
export const GESTION_MAX_FILE_MB = 10;
export const GESTION_MAX_FILES_PER_UPLOAD = 5;

export function getGestiones(filters: { search?: string; categoria?: string }) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.categoria) params.set('categoria', filters.categoria);

  const query = params.toString();

  return apiFetch<GestionResumen[]>(`/gestiones${query ? `?${query}` : ''}`);
}

export function getCategoriasGestion() {
  return apiFetch<CategoriaGestion[]>('/gestiones/categorias');
}

export function getGestion(id: number) {
  return apiFetch<Gestion>(`/gestiones/${id}`);
}

export function createGestion(data: GestionData) {
  return apiFetch<Gestion>('/gestiones', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateGestion(id: number, data: Partial<GestionData>) {
  return apiFetch<Gestion>(`/gestiones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteGestion(id: number) {
  return apiFetch<{ message: string }>(`/gestiones/${id}`, {
    method: 'DELETE',
  });
}

export function uploadArchivosGestion(id: number, files: File[]) {
  const body = new FormData();

  for (const file of files) body.append('archivos', file);

  return apiFetch<ArchivoGestion[]>(`/gestiones/${id}/archivos`, {
    method: 'POST',
    body,
  });
}

export function getArchivoGestionUrl(id: number, archivoId: number) {
  return apiFetch<{ url: string }>(`/gestiones/${id}/archivos/${archivoId}`);
}

export function deleteArchivoGestion(id: number, archivoId: number) {
  return apiFetch<{ message: string }>(
    `/gestiones/${id}/archivos/${archivoId}`,
    { method: 'DELETE' },
  );
}

/** "PDF", "Word"…: lo que la persona reconoce, no el tipo MIME. */
export function tipoLegible(tipo: string) {
  if (tipo === 'application/pdf') return 'PDF';
  if (tipo.startsWith('image/')) return 'Imagen';
  if (tipo.includes('wordprocessingml')) return 'Word';
  if (tipo.includes('spreadsheetml')) return 'Excel';

  return 'Archivo';
}

export function tamanoLegible(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  const mb = (bytes / (1024 * 1024)).toLocaleString('es-UY', {
    maximumFractionDigits: 1,
  });

  return `${mb} MB`;
}

/** Los archivos que no pasarían los límites del backend, con el motivo. */
export function problemasDeArchivos(files: File[]) {
  const problemas: string[] = [];

  if (files.length > GESTION_MAX_FILES_PER_UPLOAD) {
    problemas.push(
      `Se pueden subir hasta ${GESTION_MAX_FILES_PER_UPLOAD} archivos a la vez.`,
    );
  }

  for (const file of files) {
    if (file.size > GESTION_MAX_FILE_MB * 1024 * 1024) {
      problemas.push(`"${file.name}" pesa más de ${GESTION_MAX_FILE_MB} MB.`);
    }
  }

  return problemas;
}
