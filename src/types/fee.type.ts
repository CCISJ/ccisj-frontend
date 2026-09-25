export type FeeStatus = 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | 'ANULADA';

export type MemberFeeStatus = 'AL_DIA' | 'PENDIENTE' | 'DEUDOR';

export type AdjustmentType = 'ADICIONAL' | 'DESCUENTO';

export type AdjustmentDuration = '1' | '2' | '3' | '6' | '12' | 'INDEFINIDO';

export type MemberFeeSummary = {
  socioId: number;
  deudaTotal: number;
  cuotasPendientes: number;
  estado: MemberFeeStatus;
};

export type Fee = {
  id: number;
  socioId: number;
  periodoDesde: string;
  periodoHasta: string;
  fechaVencimiento: string;
  importeBase: number;
  importeAjustes: number;
  importeTotal: number;
  estado: FeeStatus;
  fechaCreacion: string;
};

export type FeeConfiguration = {
  id?: number;
  importeBase: number;
  vigenciaDesde: string;
  fechaCreacion: string;
};

export type FeesDashboardSummary = {
  cobradoMes: number;
  pendiente: number;
  deudaTotal: number;
  sociosAlDia: number;
  sociosDeudores: number;
  sociosPendientes: number;
};

// Pago registrado
export type FeePayment = {
  id: number;
  socioId: number;
  importe: number;
  fechaPago: string;
  medioPago: string;
  numeroRecibo: string | null;
  observaciones: string | null;
  fechaCreacion: string;
};

// Pago utilizado en listados generales
export type RecentFeePayment = {
  id: number;
  socioId: number;
  razonSocial: string;
  importe: number;
  fechaPago: string;
};

// Historial de cambios del valor general
export type FeeConfigurationHistory = {
  id: number;
  importeBase: number;
  vigenciaDesde: string;
};

// Cuota disponible para recibir pagos
export type PayableFee = {
  id: number;
  periodoDesde: string;
  periodoHasta: string;
  fechaVencimiento: string;
  importeTotal: number;
  estado: 'PENDIENTE' | 'PARCIAL';
  fechaCreacion: string;
};

export type RegisterFeePaymentData = {
  importe: number;
  fechaPago: string;
  medioPago: string;
  numeroRecibo?: string;
  observaciones?: string;
};

export type CreateFeeAdjustmentData = {
  tipo: 'ADICIONAL' | 'DESCUENTO';
  importe: number;
  fechaDesde: string;
  fechaHasta?: string;
  motivo?: string;
};

export type FeeAdjustment = {
  id: number;
  socioId: number;
  tipo: 'ADICIONAL' | 'DESCUENTO';
  importe: number;
  fechaDesde: string;
  fechaHasta: string | null;
  motivo: string | null;
  activo: boolean;
  fechaCreacion: string;
};

export type CreateFeeConfigurationData = {
  importeBase: number;
  vigenciaDesde: string;
};

export type DeleteAdjustmentResponse = {
  id: number;
  activo: boolean;
  cuotasPagadasNoModificadas: number;
};
