// H-15: la fecha de un movimiento es un DATE de la base y llega como
// medianoche UTC. En hora de Uruguay eso es el día anterior a las 21 h, así
// que mostrarla convirtiendo de zona la corría un día para atrás.
import { createPinia, setActivePinia } from 'pinia';

import CashView from '@/views/cash/CashView.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getCashCategories,
  getCashMovements,
  getSummary,
} from '@/services/cashService';

vi.mock('@/services/cashService', () => ({
  getCashMovements: vi.fn(),
  getSummary: vi.fn(),
  getCashCategories: vi.fn(),
  cancelCashMovement: vi.fn(),
  uploadCashMovementReceipt: vi.fn(),
  getCashMovementReceipt: vi.fn(),
}));

describe('CashView', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('muestra la fecha del movimiento sin correrla un día', async () => {
    const categoria = { id: 1, nombre: 'Cuotas', tipo: 'INGRESO' };
    vi.mocked(getCashMovements).mockResolvedValue([
      {
        id: 1,
        tipo: 'INGRESO',
        concepto: 'Cuota de octubre',
        importe: '760',
        fecha: '2026-10-16T00:00:00.000Z',
        observaciones: null,
        fechaCreacion: '2026-10-16T15:00:00.000Z',
        categoriaId: 1,
        registradoPorId: 1,
        pagoCuotaId: null,
        comprobanteUrl: null,
        anulado: false,
        fechaAnulacion: null,
        motivoAnulacion: null,
        anuladoPorId: null,
        categoria,
        registradoPor: { id: 1, email: 'admin@ccisj.uy', tipo: 'ADMIN' },
      },
    ] as never);
    vi.mocked(getSummary).mockResolvedValue({
      ingresos: 760,
      egresos: 0,
      balance: 760,
    } as never);
    vi.mocked(getCashCategories).mockResolvedValue([categoria] as never);

    const wrapper = mount(CashView);
    await flushPromises();

    expect(wrapper.text()).toContain('Cuota de octubre');
    expect(wrapper.text()).toContain('16/10/2026');
    expect(wrapper.text()).not.toContain('15/10/2026');
  });
});
