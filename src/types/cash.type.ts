export type CashMovementType = 'INGRESO' | 'EGRESO';

export type CashCategory = {
  id: number;
  nombre: string;
  tipo: CashMovementType;
  activa: boolean;
};

export type CashMovement = {
  id: number;
  tipo: CashMovementType;
  concepto: string;
  importe: string;
  fecha: string;
  observaciones: string | null;
  fechaCreacion: string;
  categoriaId: number;
  registradoPorId: number;
  pagoCuotaId: number | null;

  anulado: boolean;
  fechaAnulacion: string | null;
  motivoAnulacion: string | null;
  anuladoPorId: number | null;

  categoria: CashCategory;

  registradoPor: {
    id: number;
    email: string;
    tipo: string;
  };

  pagoCuota: {
    id: number;
    socio: {
      id: number;
      razonSocial: string;
    };
  } | null;
};

export type CreateCashMovementData = {
  tipo: CashMovementType;
  categoriaId: number;
  concepto: string;
  importe: number;
  fecha: string;
  observaciones?: string;
};

export type CreateCashCategoryData = {
  nombre: string;
  tipo: CashMovementType;
};

export type CashSummary = {
  ingresos: number;
  egresos: number;
  balance: number;
  cantidadMovimientos: number;
};

export type CashMovementFilters = {
  desde?: string;
  hasta?: string;
  tipo?: 'INGRESO' | 'EGRESO';
  categoriaId?: number;
  buscar?: string;
};
