import type {
  Fee,
  FeeConfiguration,
  FeeConfigurationHistory,
  FeesDashboardSummary,
  MemberFeeSummary,
  PayableFee,
  RecentFeePayment,
} from '@/types/fee.type';

import { apiFetch } from './api';

export const feesService = {
  async getConfiguration(): Promise<FeeConfiguration> {
    const data = await apiFetch<FeeConfiguration>('/cuotas/configuracion');
    return {
      ...data,
      importeBase: Number(data.importeBase),
    };
  },

  async getMemberFeeSummary(socioId: number): Promise<MemberFeeSummary> {
    const data = await apiFetch<{
      estado: MemberFeeSummary['estado'];
      cuotasVencidas: number;
      deudaVencida: number;
    }>(`/cuotas/socio/${socioId}/estado`);

    return {
      socioId,
      deudaTotal: data.deudaVencida,
      cuotasPendientes: data.cuotasVencidas,
      estado: data.estado,
    };
  },

  async getDashboardSummary(): Promise<FeesDashboardSummary> {
    return apiFetch<FeesDashboardSummary>('/cuotas/resumen');
  },

  async getRecentPayments(): Promise<RecentFeePayment[]> {
    return apiFetch<RecentFeePayment[]>('/cuotas/pagos/recientes');
  },

  async getConfigurationHistory(): Promise<FeeConfigurationHistory[]> {
    const data = await apiFetch<FeeConfigurationHistory[]>(
      '/cuotas/configuracion/historial',
    );
    return data.map((config) => ({
      ...config,
      importeBase: Number(config.importeBase),
    }));
  },

  async getMemberFees(socioId: number): Promise<Fee[]> {
    const data = await apiFetch<Fee[]>(`/cuotas/socio/${socioId}`);

    return data.map((fee) => ({
      ...fee,
      importeBase: Number(fee.importeBase),
      importeAjustes: Number(fee.importeAjustes),
      importeTotal: Number(fee.importeTotal),
    }));
  },

  async getPayableFees(socioId: number): Promise<PayableFee[]> {
    const memberFees = await this.getMemberFees(socioId);

    return memberFees
      .filter(
        (fee): fee is Fee & { estado: 'PENDIENTE' | 'PARCIAL' } =>
          fee.estado === 'PENDIENTE' || fee.estado === 'PARCIAL',
      )
      .map((fee) => ({
        id: fee.id,
        periodoDesde: fee.periodoDesde,
        periodoHasta: fee.periodoHasta,
        fechaVencimiento: fee.fechaVencimiento,
        importeTotal: fee.importeTotal,
        estado: fee.estado,
        fechaCreacion: fee.fechaCreacion,
      }));
  },
};
