import type { OfferStatus } from './offer.type';

export type ApplicationStatus =
  'ENVIADA' | 'EN_REVISION' | 'SELECCIONADO' | 'NO_SELECCIONADO' | 'FINALIZADA';

/** Cómo ve la empresa cada estado. ENVIADA es una postulación que nadie miró. */
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  ENVIADA: 'Nueva',
  EN_REVISION: 'En revisión',
  SELECCIONADO: 'Seleccionado',
  NO_SELECCIONADO: 'No seleccionado',
  FINALIZADA: 'Finalizada',
};

/**
 * Estados a los que la empresa puede pasar una postulación. ENVIADA la pone
 * el sistema y FINALIZADA no la marca la empresa (el backend valida lo mismo).
 */
export const MEMBER_APPLICATION_STATES = [
  'EN_REVISION',
  'SELECCIONADO',
  'NO_SELECCIONADO',
] as const satisfies readonly ApplicationStatus[];

export type MemberApplicationStatus =
  (typeof MEMBER_APPLICATION_STATES)[number];

export type ApplicantCv = {
  id: number;
  // Hoy es una ruta o URL sin validar: se enlaza solo si es https.
  archivoUrl: string | null;
  descripcion: string | null;
  fechaActualizacion: string;
};

/**
 * Una postulación a una oferta de la empresa del socio
 * (`GET /postulaciones/recibidas`).
 */
export type ReceivedApplication = {
  id: number;
  fechaPostulacion: string;
  estado: ApplicationStatus;
  // Mensaje que escribió el postulante al postularse.
  observaciones: string | null;
  oferta: {
    id: number;
    titulo: string;
    estado: OfferStatus;
  };
  postulante: {
    id: number;
    nombre: string;
    apellido: string;
    telefono: string | null;
    usuario: { email: string };
    // El más reciente primero.
    cvs: ApplicantCv[];
  };
};
