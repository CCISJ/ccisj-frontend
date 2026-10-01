export type OfferStatus = 'ACTIVA' | 'CERRADA';

export type OfferModality = 'PRESENCIAL' | 'REMOTO' | 'HIBRIDO';

export const OFFER_MODALITY_LABELS: Record<OfferModality, string> = {
  PRESENCIAL: 'Presencial',
  REMOTO: 'Remoto',
  HIBRIDO: 'Híbrido',
};

export type Category = {
  id: number;
  nombre: string;
  descripcion: string | null;
  activa: boolean;
};

/**
 * Una oferta tal como la ve cualquier usuario (`GET /ofertas`): de la empresa
 * llegan solo los datos públicos. Al postulante el backend le manda solo las
 * activas.
 */
export type Offer = {
  id: number;
  socioId: number;
  titulo: string;
  descripcion: string;
  ubicacion: string | null;
  modalidad: OfferModality | null;
  cantidadVacantes: number;
  fechaPublicacion: string;
  // Último instante del día de cierre en hora de Uruguay, o null si no tiene.
  fechaCierre: string | null;
  estado: OfferStatus;
  socio: {
    id: number;
    razonSocial: string;
    giroComercial: string;
    ciudad: string;
  };
  categorias: { categoriaId: number; categoria: Category }[];
};

/**
 * Una oferta de la empresa del socio de la sesión (`GET /ofertas/mias`), con
 * la cantidad de postulaciones recibidas.
 */
export type OwnOffer = {
  id: number;
  socioId: number;
  creadaPor: number;
  titulo: string;
  descripcion: string;
  ubicacion: string | null;
  modalidad: OfferModality | null;
  cantidadVacantes: number;
  fechaPublicacion: string;
  // Último instante del día de cierre en hora de Uruguay, o null si no tiene.
  fechaCierre: string | null;
  estado: OfferStatus;
  categorias: { categoriaId: number; categoria: Category }[];
  _count: { postulaciones: number };
};

export type OfferFormData = {
  titulo: string;
  descripcion: string;
  ubicacion: string | null;
  modalidad: OfferModality | null;
  cantidadVacantes: number;
  // "AAAA-MM-DD", o null para que quede abierta hasta cerrarla a mano.
  fechaCierre: string | null;
  estado: OfferStatus;
  categoriaIds: number[];
};

export type CreateOfferData = Omit<OfferFormData, 'estado'>;

export type UpdateOfferData = Partial<OfferFormData>;
