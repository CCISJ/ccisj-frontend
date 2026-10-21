import type { Cv } from './cv.type';
import type { OfferModality, OfferStatus } from './offer.type';

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

/** Cómo ve el postulante cada estado de sus propias postulaciones. */
export const APPLICANT_STATUS_LABELS: Record<ApplicationStatus, string> = {
  ENVIADA: 'Enviada',
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

// El CV completo del postulante, como lo ve la empresa.
export type ApplicantCv = Cv;

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
  // Datos de contacto y CV (formulario y PDF, el más reciente primero).
  postulante: ApplicantCv;
};

/** Una postulación del postulante de la sesión (`GET /postulaciones/mias`). */
export type OwnApplication = {
  id: number;
  fechaPostulacion: string;
  estado: ApplicationStatus;
  // El mensaje que dejó al postularse.
  observaciones: string | null;
  oferta: {
    id: number;
    titulo: string;
    estado: OfferStatus;
    ubicacion: string | null;
    modalidad: OfferModality | null;
    fechaCierre: string | null;
    socio: { razonSocial: string };
  };
};
