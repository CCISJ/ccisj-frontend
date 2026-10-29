// La vigencia de una configuración y la fecha de un pago son días sin hora:
// llegan como medianoche UTC, que en hora de Uruguay es el día anterior a las
// 21. Comparadas o mostradas como instantes, la cuota del año nuevo pasaba a
// "Actual" el 31/12 a las 21 y un pago del 29/10 se veía "28/10 21:00".
import { createPinia, setActivePinia } from 'pinia';

import FeesView from '@/views/fees/FeesView.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { feesService } from '@/services/feesService';

type FeesService = typeof feesService;

const service = vi.hoisted(() => ({
  getConfiguration: vi.fn<FeesService['getConfiguration']>(),
  getDashboardSummary: vi.fn<FeesService['getDashboardSummary']>(),
  getRecentPayments: vi.fn<FeesService['getRecentPayments']>(),
  getConfigurationHistory: vi.fn<FeesService['getConfigurationHistory']>(),
}));

vi.mock('@/services/feesService', () => ({ feesService: service }));

describe('FeesView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());

    // El 31/12 a las 22 de Uruguay: en UTC ya es 01/01.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-12-31T22:00:00-03:00'));

    service.getConfiguration.mockResolvedValue({
      id: 1,
      importeBase: 760,
      vigenciaDesde: '2026-01-01T00:00:00.000Z',
      fechaCreacion: '2025-12-01T12:00:00.000Z',
    });
    service.getDashboardSummary.mockResolvedValue({
      cobradoMes: 760,
      pendiente: 0,
      deudaTotal: 0,
      sociosAlDia: 1,
      sociosPendientes: 0,
      sociosDeudores: 0,
    });
    service.getRecentPayments.mockResolvedValue([
      {
        id: 1,
        socioId: 1,
        razonSocial: 'Ferretería Centro',
        importe: 760,
        fechaPago: '2026-10-29T00:00:00.000Z',
      },
    ]);
    service.getConfigurationHistory.mockResolvedValue([
      { id: 2, importeBase: 900, vigenciaDesde: '2027-01-01T00:00:00.000Z' },
      { id: 1, importeBase: 760, vigenciaDesde: '2026-01-01T00:00:00.000Z' },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function historyRow(wrapper: ReturnType<typeof mount>, fecha: string) {
    const row = wrapper
      .findAll('tr')
      .find((tr) => tr.text().includes(fecha) && tr.text().includes('$'));

    if (!row) throw new Error(`No hay una fila del historial para ${fecha}`);

    return row.text();
  }

  it('la configuración del año nuevo sigue siendo futura hasta la medianoche de Uruguay', async () => {
    const wrapper = mount(FeesView);
    await flushPromises();

    expect(historyRow(wrapper, '01/01/2027')).toContain('Futuro');
    expect(historyRow(wrapper, '01/01/2026')).toContain('Actual');
  });

  it('muestra el día del pago sin correrlo al día anterior', async () => {
    const wrapper = mount(FeesView);
    await flushPromises();

    expect(wrapper.text()).toContain('Ferretería Centro');
    expect(wrapper.text()).toContain('29/10/2026');
    expect(wrapper.text()).not.toContain('28/10/2026');
  });
});
