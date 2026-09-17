export type FeeStatus = 'PENDIENTE' | 'PAGADA' | 'ANULADA';

export type MemberFeeStatus = 'AL_DIA' | 'PENDIENTE' | 'DEUDOR';

export type MemberFeeSummary = {
  socioId: number;
  razonSocial: string;
  rut: string;

  cuotaActual: number;
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
};

// Configuración general de la cuota
export type FeeConfiguration = {
  importeBase: number;
  vigenciaDesde: string;
};

// Resumen general del módulo de cuotas
export type FeesDashboardSummary = {
  cobradoMes: number;
  pendiente: number;
  deudaTotal: number;

  sociosAlDia: number;
  sociosPendientes: number;
  sociosDeudores: number;
};

// Últimos pagos registrados
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

export type PayableFee = {
  id: number;
  periodoDesde: string;
  periodoHasta: string;
  fechaVencimiento: string;
  importeTotal: number;
  estado: 'PENDIENTE';
};

export type RegisterFeePaymentData = {
  socioId: number;
  cuotaIds: number[];
  fechaPago: string;
};
