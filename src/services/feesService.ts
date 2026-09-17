import type {
  Fee,
  FeeConfiguration,
  FeeConfigurationHistory,
  FeesDashboardSummary,
  MemberFeeSummary,
  PayableFee,
  RecentFeePayment,
} from '@/types/fee.type';

// TODO: reemplazar estos mocks por apiFetch cuando esté listo el backend.

const membersFees: MemberFeeSummary[] = [
  {
    socioId: 1,
    razonSocial: 'Supermercado Central',
    rut: '210123450018',
    cuotaActual: 535,
    deudaTotal: 0,
    cuotasPendientes: 0,
    estado: 'AL_DIA',
  },
  {
    socioId: 2,
    razonSocial: 'Ferretería San José',
    rut: '210987650019',
    cuotaActual: 635,
    deudaTotal: 635,
    cuotasPendientes: 1,
    estado: 'PENDIENTE',
  },
  {
    socioId: 3,
    razonSocial: 'Distribuidora del Sur',
    rut: '211234560017',
    cuotaActual: 435,
    deudaTotal: 1305,
    cuotasPendientes: 3,
    estado: 'DEUDOR',
  },
];

const fees: Fee[] = [
  {
    id: 1,
    socioId: 3,
    periodoDesde: '2026-06-20',
    periodoHasta: '2026-07-20',
    fechaVencimiento: '2026-08-20',
    importeBase: 535,
    importeAjustes: -100,
    importeTotal: 435,
    estado: 'PENDIENTE',
  },
  {
    id: 2,
    socioId: 3,
    periodoDesde: '2026-07-20',
    periodoHasta: '2026-08-20',
    fechaVencimiento: '2026-09-20',
    importeBase: 535,
    importeAjustes: -100,
    importeTotal: 435,
    estado: 'PENDIENTE',
  },
  {
    id: 3,
    socioId: 3,
    periodoDesde: '2026-08-20',
    periodoHasta: '2026-09-20',
    fechaVencimiento: '2026-10-20',
    importeBase: 535,
    importeAjustes: -100,
    importeTotal: 435,
    estado: 'PENDIENTE',
  },
];

const configuration: FeeConfiguration = {
  importeBase: 535,
  vigenciaDesde: '2026-01-01',
};

const dashboardSummary: FeesDashboardSummary = {
  cobradoMes: 84530,
  pendiente: 12305,
  deudaTotal: 18450,

  sociosAlDia: 120,
  sociosPendientes: 15,
  sociosDeudores: 7,
};

const recentPayments: RecentFeePayment[] = [
  {
    id: 1,
    socioId: 1,
    razonSocial: 'Supermercado Central',
    importe: 535,
    fechaPago: '2026-09-16T14:30:00',
  },
  {
    id: 2,
    socioId: 4,
    razonSocial: 'Barraca del Centro',
    importe: 635,
    fechaPago: '2026-09-16T11:15:00',
  },
  {
    id: 3,
    socioId: 5,
    razonSocial: 'Comercial Rodríguez',
    importe: 535,
    fechaPago: '2026-09-15T16:40:00',
  },
];

const configurationHistory: FeeConfigurationHistory[] = [
  {
    id: 3,
    importeBase: 535,
    vigenciaDesde: '2026-01-01',
  },
  {
    id: 2,
    importeBase: 500,
    vigenciaDesde: '2025-07-01',
  },
  {
    id: 1,
    importeBase: 450,
    vigenciaDesde: '2025-01-01',
  },
];

export const feesService = {
  async getConfiguration(): Promise<FeeConfiguration> {
    return { ...configuration };
  },

  async getMemberFeeSummary(socioId: number): Promise<MemberFeeSummary> {
    return {
      socioId,
      razonSocial: '',
      rut: '',
      cuotaActual: 535,
      deudaTotal: 1070,
      cuotasPendientes: 2,
      estado: 'PENDIENTE',
    };
  },

  async getDashboardSummary(): Promise<FeesDashboardSummary> {
    return { ...dashboardSummary };
  },

  async getRecentPayments(): Promise<RecentFeePayment[]> {
    return recentPayments.map((payment) => ({ ...payment }));
  },

  async getConfigurationHistory(): Promise<FeeConfigurationHistory[]> {
    return configurationHistory.map((item) => ({ ...item }));
  },

  async getMembersFees(): Promise<MemberFeeSummary[]> {
    return membersFees.map((member) => ({ ...member }));
  },

  async getMemberFees(socioId: number): Promise<Fee[]> {
    return [
      {
        id: 1,
        socioId,
        periodoDesde: '2026-06-20',
        periodoHasta: '2026-07-20',
        fechaVencimiento: '2026-08-20',
        importeBase: 535,
        importeAjustes: 0,
        importeTotal: 535,
        estado: 'PAGADA',
      },
      {
        id: 2,
        socioId,
        periodoDesde: '2026-07-20',
        periodoHasta: '2026-08-20',
        fechaVencimiento: '2026-09-20',
        importeBase: 535,
        importeAjustes: 0,
        importeTotal: 535,
        estado: 'PENDIENTE',
      },
      {
        id: 3,
        socioId,
        periodoDesde: '2026-08-20',
        periodoHasta: '2026-09-20',
        fechaVencimiento: '2026-10-20',
        importeBase: 535,
        importeAjustes: 0,
        importeTotal: 535,
        estado: 'PENDIENTE',
      },
    ];
  },

  async getPayableFees(socioId: number): Promise<PayableFee[]> {
    const memberFees = await this.getMemberFees(socioId);

    return memberFees
      .filter((fee) => fee.estado === 'PENDIENTE')
      .map((fee) => ({
        id: fee.id,
        periodoDesde: fee.periodoDesde,
        periodoHasta: fee.periodoHasta,
        fechaVencimiento: fee.fechaVencimiento,
        importeTotal: fee.importeTotal,
        estado: 'PENDIENTE' as const,
      }));
  },
};
