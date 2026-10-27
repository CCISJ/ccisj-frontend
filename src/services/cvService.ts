import type { Cv, CvData, CvFile, ProfileData } from '@/types/cv.type';

import { apiFetch } from './api';

export const CV_MAX_FILE_MB = 5;
export const CV_MAX_FILES_PER_UPLOAD = 5;

export function getMyCv() {
  return apiFetch<Cv>('/postulantes/me/cv');
}

export function saveMyCv(data: CvData) {
  return apiFetch<Cv>('/postulantes/me/cv', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function saveMyProfile(data: ProfileData) {
  return apiFetch<Cv>('/postulantes/me/perfil', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** Sube uno o varios PDF de una vez. */
export function uploadMyCvFiles(files: File[]) {
  const body = new FormData();

  for (const file of files) body.append('archivos', file);

  return apiFetch<CvFile[]>('/postulantes/me/cv/archivos', {
    method: 'POST',
    body,
  });
}

export function deleteMyCvFile(id: number) {
  return apiFetch<void>(`/postulantes/me/cv/archivos/${id}`, {
    method: 'DELETE',
  });
}

export function getMyCvFileUrl(id: number) {
  return apiFetch<{ url: string }>(`/postulantes/me/cv/archivos/${id}`);
}

/** Un PDF del postulante de una postulación recibida (para la empresa). */
export function getReceivedCvFileUrl(applicationId: number, cvId: number) {
  return apiFetch<{ url: string }>(
    `/postulaciones/recibidas/${applicationId}/cv/${cvId}`,
  );
}

/**
 * Abre un enlace firmado en una pestaña nueva. La pestaña se abre antes del
 * pedido para que el navegador no la bloquee (ver `useReceiptViewer`).
 */
export async function openSignedFile(getUrl: () => Promise<{ url: string }>) {
  const tab = window.open('', '_blank');

  if (tab) {
    tab.opener = null;
    tab.document.title = 'Cargando CV...';
    tab.document.body.textContent = 'Cargando CV...';
  }

  try {
    const { url } = await getUrl();

    if (tab && !tab.closed) tab.location.replace(url);
    else window.location.href = url;
  } catch (error) {
    tab?.close();
    throw error;
  }
}

/**
 * Cuánto del CV del formulario está completo (4 partes de 25%). Los PDF no
 * cuentan: son opcionales y se eligen al postularse.
 */
export function cvProgress(
  cv: Pick<
    Cv,
    | 'telefono'
    | 'direccion'
    | 'fechaNacimiento'
    | 'estudios'
    | 'experiencias'
    | 'referencias'
  >,
) {
  const steps = [
    Boolean(cv.telefono && cv.direccion && cv.fechaNacimiento),
    cv.estudios.length > 0,
    cv.experiencias.length > 0,
    cv.referencias.length > 0,
  ];

  return Math.round((steps.filter(Boolean).length / steps.length) * 100);
}
