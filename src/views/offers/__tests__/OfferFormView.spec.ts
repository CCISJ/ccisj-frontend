import { createMemoryHistory, createRouter } from 'vue-router';

import { createPinia, setActivePinia } from 'pinia';

import OfferFormView from '@/views/offers/OfferFormView.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCategories } from '@/services/categoriesService';
import { getMembers } from '@/services/membersService';
import { createOffer, getOffer, updateOffer } from '@/services/offersService';

import type { Member, MemberDirectoryEntry } from '@/types/member.type';
import type { Offer } from '@/types/offer.type';

vi.mock('@/services/categoriesService', () => ({ getCategories: vi.fn() }));
vi.mock('@/services/membersService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/membersService')>()),
  getMembers: vi.fn(),
}));
vi.mock('@/services/offersService', () => ({
  createOffer: vi.fn(),
  getMyOffer: vi.fn(),
  getOffer: vi.fn(),
  updateOffer: vi.fn(),
}));

function socio(id: number, razonSocial: string, activo = true) {
  return {
    id,
    razonSocial,
    usuario: { id: id + 100, email: `s${id}@ccisj.uy`, activo },
  } as unknown as Member;
}

const OFERTA: Offer = {
  id: 12,
  socioId: 2,
  titulo: 'Cajero',
  descripcion: 'Atención al público.',
  ubicacion: null,
  modalidad: 'PRESENCIAL',
  cantidadVacantes: 1,
  fechaPublicacion: '2026-11-01T15:00:00.000Z',
  fechaCierre: null,
  estado: 'ACTIVA',
  socio: {
    id: 2,
    razonSocial: 'Almacén Central',
    giroComercial: 'Comercio',
    ciudad: 'San José de Mayo',
  },
  categorias: [
    {
      categoriaId: 1,
      categoria: { id: 1, nombre: 'Ventas', descripcion: null, activa: true },
    },
  ],
};

async function mountAt(url: string) {
  setActivePinia(createPinia());

  const stub = { template: '<div />' };
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/ofertas', name: 'ofertas', component: stub },
      {
        path: '/ofertas/nueva',
        name: 'oferta-nueva',
        component: OfferFormView,
      },
      {
        path: '/ofertas/:id(\\d+)/editar',
        name: 'oferta-editar',
        component: OfferFormView,
      },
      { path: '/ofertas/:id(\\d+)', name: 'oferta-detalle', component: stub },
      { path: '/mis-ofertas', name: 'mis-ofertas', component: stub },
    ],
  });

  await router.push(url);

  const wrapper = mount(OfferFormView, { global: { plugins: [router] } });
  await flushPromises();

  return { wrapper, router };
}

async function completar(
  wrapper: Awaited<ReturnType<typeof mountAt>>['wrapper'],
) {
  await wrapper.get('#oferta-titulo').setValue('Repositor');
  await wrapper.get('[aria-pressed]').trigger('click');
  await wrapper.get('#oferta-modalidad').setValue('PRESENCIAL');
  await wrapper.get('#oferta-descripcion').setValue('Reposición de góndolas.');
}

describe('la administración publica en nombre de una empresa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCategories).mockResolvedValue([
      { id: 1, nombre: 'Ventas', descripcion: null, activa: true },
    ]);
    vi.mocked(getMembers).mockResolvedValue([
      socio(3, 'Zapatería Sur'),
      socio(2, 'Almacén Central'),
      socio(4, 'Dada de Baja SA', false),
    ] as (Member | MemberDirectoryEntry)[]);
    vi.mocked(createOffer).mockResolvedValue({ id: 40 });
  });

  it('ofrece solo las empresas activas, en orden alfabético', async () => {
    const { wrapper } = await mountAt('/ofertas/nueva');

    const opciones = wrapper
      .get('#oferta-empresa')
      .findAll('option')
      .map((option) => option.text());

    expect(opciones).toEqual([
      'Elegí una empresa socia',
      'Almacén Central',
      'Zapatería Sur',
    ]);
  });

  it('no deja publicar sin elegir la empresa', async () => {
    const { wrapper } = await mountAt('/ofertas/nueva');

    await completar(wrapper);
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(createOffer).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Elegí la empresa que publica la oferta');
  });

  it('manda la empresa elegida y abre la oferta publicada', async () => {
    const { wrapper, router } = await mountAt('/ofertas/nueva');

    await wrapper.get('#oferta-empresa').setValue('3');
    await completar(wrapper);
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(createOffer).toHaveBeenCalledWith(
      expect.objectContaining({ socioId: 3, titulo: 'Repositor' }),
    );
    expect(router.currentRoute.value.fullPath).toBe('/ofertas/40');
  });

  it('desde la ficha de un socio llega con la empresa ya elegida', async () => {
    const { wrapper } = await mountAt('/ofertas/nueva?socio=2');

    expect(
      (wrapper.get('#oferta-empresa').element as HTMLSelectElement).value,
    ).toBe('2');
  });

  it('al editar, muestra de qué empresa es y manda solo lo que cambió', async () => {
    vi.mocked(getOffer).mockResolvedValue(OFERTA);

    const { wrapper, router } = await mountAt('/ofertas/12/editar');

    expect(getOffer).toHaveBeenCalledWith(12);
    expect(wrapper.find('#oferta-empresa').exists()).toBe(false);
    expect(wrapper.text()).toContain('Almacén Central');

    await wrapper.get('#oferta-titulo').setValue('Cajero de mañana');
    await wrapper.get('form').trigger('submit');
    await flushPromises();

    expect(updateOffer).toHaveBeenCalledWith(12, {
      titulo: 'Cajero de mañana',
    });
    expect(router.currentRoute.value.fullPath).toBe('/ofertas/12');
  });
});
