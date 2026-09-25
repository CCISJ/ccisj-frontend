import type {
  CreateFeeAdjustmentData,
  CreateFeeConfigurationData,
  DeleteAdjustmentResponse,
  Fee,
  FeeAdjustment,
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

  async createConfiguration(
    data: CreateFeeConfigurationData,
  ): Promise<FeeConfiguration> {
    const response = await apiFetch<FeeConfiguration>('/cuotas/configuracion', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return {
      ...response,
      importeBase: Number(response.importeBase),
    };
  },

  async updateConfiguration(
    id: number,
    importeBase: number,
  ): Promise<FeeConfiguration> {
    const response = await apiFetch<FeeConfiguration>(
      `/cuotas/configuracion/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ importeBase }),
      },
    );
    return {
      ...response,
      importeBase: Number(response.importeBase),
    };
  },

  async getMemberAdjustments(socioId: number): Promise<FeeAdjustment[]> {
    const data = await apiFetch<FeeAdjustment[]>(
      `/cuotas/socio/${socioId}/ajustes`,
    );

    return data.map((adjustment) => ({
      ...adjustment,
      importe: Number(adjustment.importe),
    }));
  },

  async createAdjustment(socioId: number, data: CreateFeeAdjustmentData) {
    return apiFetch(`/cuotas/socio/${socioId}/ajustes`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteAdjustment(
    adjustmentId: number,
  ): Promise<DeleteAdjustmentResponse> {
    return apiFetch<DeleteAdjustmentResponse>(
      `/cuotas/ajustes/${adjustmentId}`,
      {
        method: 'DELETE',
      },
    );
  },
};
