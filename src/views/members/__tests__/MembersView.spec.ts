import { createMemoryHistory, createRouter } from 'vue-router';

import { createPinia, setActivePinia } from 'pinia';

import MembersView from '@/views/members/MembersView.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMembers } from '@/services/membersService';

import { useAuthStore } from '@/stores/auth';

import type { MemberFeeState } from '@/types/fee.type';
import type { Member, MemberDirectoryEntry } from '@/types/member.type';

import { downloadCsv } from '@/utils/csv';
import { uruguayDay } from '@/utils/date';
import { formatMoney } from '@/utils/money';

vi.mock('@/services/membersService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/membersService')>()),
  getMembers: vi.fn(),
  deleteMember: vi.fn(),
}));

vi.mock('@/utils/csv', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/csv')>()),
  downloadCsv: vi.fn(),
}));

const AL_DIA: MemberFeeState = {
  estado: 'AL_DIA',
  cuotasPendientes: 0,
  deudaTotal: 0,
  cuotasVencidas: 0,
  deudaVencida: 0,
};

function member(
  id: number,
  razonSocial: string,
  estadoCuotas: MemberFeeState,
): Member {
  return {
    id,
    usuarioId: id + 100,
    razonSocial,
    titular: 'Titular',
    giroComercial: 'Comercio',
    tipo: 'COMUN',
    rut: `21990000000${id}`,
    numeroBps: '1234567',
    fechaInicioEmpresa: '2020-01-01T00:00:00.000Z',
    fechaAfiliacion: '2021-01-01T00:00:00.000Z',
    direccion: '25 de Mayo 123',
    ciudad: 'San José de Mayo',
    celular: '099123456',
    telefono: '43421234',
    email: `socio${id}@ccisj.uy`,
    observaciones: null,
    usuario: { id: id + 100, email: `socio${id}@ccisj.uy`, activo: true },
    estadoCuotas,
  };
}

const SOCIOS: Member[] = [
  member(1, 'Ferretería del Sur', {
    estado: 'DEUDOR',
    cuotasPendientes: 12,
    deudaTotal: 6840,
    cuotasVencidas: 11,
    deudaVencida: 6460,
  }),
  member(2, 'Farmacia San José', AL_DIA),
  member(3, 'Óptica Visión', {
    estado: 'PENDIENTE',
    cuotasPendientes: 1,
    deudaTotal: 760,
    cuotasVencidas: 1,
    deudaVencida: 760,
  }),
];

async function mountAs(role: 'ADMIN' | 'SOCIO', socios: unknown[]) {
  const pinia = createPinia();
  setActivePinia(pinia);
  useAuthStore().user = {
    id: 1,
    email: 'x@ccisj.uy',
    displayName: 'X',
    role,
    memberType: role === 'SOCIO' ? 'DIRECTIVO' : null,
  };

  vi.mocked(getMembers).mockResolvedValue(socios as Member[]);

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:p(.*)*', component: { template: '<div />' } }],
  });

  const wrapper = mount(MembersView, {
    global: { plugins: [pinia, router] },
  });
  await flushPromises();

  return wrapper;
}

function cuotasDe(
  wrapper: Awaited<ReturnType<typeof mountAs>>,
  nombre: string,
) {
  const row = wrapper
    .findAll('tbody tr')
    .find((tr) => tr.text().includes(nombre));

  if (!row) throw new Error(`No está la fila de ${nombre}`);

  // Cada renglón por separado: `text()` los pega sin espacio.
  return row
    .get('[data-test="cuotas"]')
    .findAll('p')
    .map((p) => p.text().replace(/\s+/g, ' '))
    .join(' ');
}

// `formatMoney` separa el signo con un espacio duro; el texto leído, con uno común.
function pesos(value: number) {
  return formatMoney(value).replace(/\s+/g, ' ');
}

describe('MembersView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('a la administración le muestra cuánto debe cada socio', async () => {
    const wrapper = await mountAs('ADMIN', SOCIOS);

    expect(cuotasDe(wrapper, 'Ferretería del Sur')).toBe(
      `Deudor Debe ${pesos(6840)} · 11 cuotas vencidas`,
    );
    expect(cuotasDe(wrapper, 'Óptica Visión')).toBe(
      `Pendiente Debe ${pesos(760)} · 1 cuota vencida`,
    );
    expect(cuotasDe(wrapper, 'Farmacia San José')).toBe('Al día');
  });

  it('filtra por estado de cuotas: al día, pendiente y deudor', async () => {
    const wrapper = await mountAs('ADMIN', SOCIOS);
    const filtro = wrapper.get('#members-fee-filter');

    await filtro.setValue('PENDIENTE');
    expect(wrapper.text()).toContain('Óptica Visión');
    expect(wrapper.text()).not.toContain('Ferretería del Sur');
    expect(wrapper.text()).not.toContain('Farmacia San José');

    await filtro.setValue('DEUDOR');
    expect(wrapper.text()).toContain('Ferretería del Sur');
    expect(wrapper.text()).not.toContain('Óptica Visión');
    expect(wrapper.text()).not.toContain('Farmacia San José');

    await filtro.setValue('AL_DIA');
    expect(wrapper.text()).toContain('Farmacia San José');
    expect(wrapper.text()).not.toContain('Ferretería del Sur');
    expect(wrapper.text()).not.toContain('Óptica Visión');

    await filtro.setValue('VENCIDAS');
    expect(wrapper.text()).toContain('Ferretería del Sur');
    expect(wrapper.text()).toContain('Óptica Visión');
    expect(wrapper.text()).not.toContain('Farmacia San José');
  });

  it('exporta a Excel lo filtrado, todas las páginas: por ejemplo, las deudoras', async () => {
    // 12 deudoras: más de una página (10 por página), y se exportan todas.
    const deudoras = Array.from({ length: 12 }, (_, i) =>
      member(10 + i, `Deudora ${i + 1}`, SOCIOS[0]!.estadoCuotas!),
    );
    const wrapper = await mountAs('ADMIN', [...SOCIOS, ...deudoras]);

    await wrapper.get('#members-fee-filter').setValue('DEUDOR');
    await wrapper.get('#members-export').trigger('click');

    expect(downloadCsv).toHaveBeenCalledTimes(1);

    const [filename, rows] = vi.mocked(downloadCsv).mock.calls[0]!;

    expect(filename).toBe(`socios-deudores-${uruguayDay()}.csv`);
    expect(rows[0]).toEqual([
      'Empresa',
      'RUT',
      'Titular',
      'Giro comercial',
      'Tipo',
      'Email',
      'Teléfono',
      'Celular',
      'Dirección',
      'Ciudad',
      'Estado',
      'Estado de cuotas',
      'Cuotas vencidas',
      'Deuda vencida',
      'Deuda total',
    ]);

    // Encabezado + Ferretería del Sur + las 12 deudoras; nadie al día ni pendiente.
    expect(rows).toHaveLength(14);
    expect(rows.slice(1).every((row) => row[11] === 'Deudor')).toBe(true);
    expect(rows[1]).toEqual([
      'Ferretería del Sur',
      '219900000001',
      'Titular',
      'Comercio',
      'Común',
      'socio1@ccisj.uy',
      '43421234',
      '099123456',
      '25 de Mayo 123',
      'San José de Mayo',
      'Activo',
      'Deudor',
      11,
      6460,
      6840,
    ]);
  });

  it('no deja exportar si ningún socio coincide con los filtros', async () => {
    const wrapper = await mountAs('ADMIN', [SOCIOS[1]]);

    await wrapper.get('#members-fee-filter').setValue('DEUDOR');

    expect(wrapper.get('#members-export').attributes('disabled')).toBeDefined();
  });

  it('al directivo no le muestra las cuotas de los demás', async () => {
    const directorio: MemberDirectoryEntry[] = SOCIOS.map((socio) => ({
      id: socio.id,
      razonSocial: socio.razonSocial,
      titular: socio.titular,
      giroComercial: socio.giroComercial,
      tipo: socio.tipo,
      telefono: socio.telefono,
      celular: socio.celular,
      email: socio.email,
      direccion: socio.direccion,
      ciudad: socio.ciudad,
      fechaAfiliacion: socio.fechaAfiliacion,
    }));

    const wrapper = await mountAs('SOCIO', directorio);

    expect(wrapper.find('[data-test="cuotas"]').exists()).toBe(false);
    expect(wrapper.find('#members-fee-filter').exists()).toBe(false);
    expect(wrapper.find('#members-export').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Debe');
  });
});
