import { createMemoryHistory, createRouter } from 'vue-router';

import { createPinia, setActivePinia } from 'pinia';

import GestoriaView from '@/views/gestoria/GestoriaView.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getCategoriasGestion,
  getGestiones,
  problemasDeArchivos,
  tamanoLegible,
  tipoLegible,
} from '@/services/gestionesService';

import { useAuthStore } from '@/stores/auth';

import type { GestionResumen } from '@/types/gestion.type';

vi.mock('@/services/gestionesService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/gestionesService')>()),
  getGestiones: vi.fn(),
  getCategoriasGestion: vi.fn(),
}));

const HABILITACION: GestionResumen = {
  id: 1,
  titulo: 'Renovación de la habilitación',
  descripcion: 'Pasos del trámite.',
  categoria: 'Trámites municipales',
  fechaCreacion: '2026-11-01T15:00:00.000Z',
  fechaActualizacion: '2026-11-05T15:00:00.000Z',
  cantidadArchivos: 2,
};

async function mountAs(role: 'ADMIN' | 'SOCIO') {
  const pinia = createPinia();
  setActivePinia(pinia);
  useAuthStore().user = {
    id: 1,
    email: 'x@ccisj.uy',
    displayName: 'X',
    role,
    memberType: role === 'SOCIO' ? 'DIRECTIVO' : null,
  };

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/gestoria', name: 'gestoria', component: GestoriaView },
      {
        path: '/gestoria/nueva',
        name: 'gestion-nueva',
        component: { template: '<div />' },
      },
      {
        path: '/gestoria/:id',
        name: 'gestion-detalle',
        component: { template: '<div />' },
      },
    ],
  });
  await router.push('/gestoria');

  const wrapper = mount(GestoriaView, { global: { plugins: [pinia, router] } });
  await flushPromises();

  return wrapper;
}

describe('GestoriaView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getGestiones).mockResolvedValue([HABILITACION]);
    vi.mocked(getCategoriasGestion).mockResolvedValue([
      { nombre: 'Trámites municipales', cantidad: 1 },
      { nombre: 'Comercio exterior', cantidad: 3 },
    ]);
  });

  it('lista las gestiones con su categoría y cuántos archivos tienen', async () => {
    const wrapper = await mountAs('SOCIO');

    expect(wrapper.text()).toContain('Renovación de la habilitación');
    expect(wrapper.text()).toContain('Trámites municipales');
    expect(wrapper.text()).toContain('2 archivos');
    expect(wrapper.text()).toContain('Actualizada el 05/11/2026');
  });

  it('en la lista, la descripción va en un solo párrafo', async () => {
    vi.mocked(getGestiones).mockResolvedValue([
      { ...HABILITACION, descripcion: 'Primero.\n\nSegundo.' },
    ]);

    const wrapper = await mountAs('SOCIO');

    expect(wrapper.text()).toContain('Primero. Segundo.');
  });

  it('solo la administración ve "Nueva gestión"', async () => {
    expect((await mountAs('ADMIN')).text()).toContain('Nueva gestión');
    expect((await mountAs('SOCIO')).text()).not.toContain('Nueva gestión');
  });

  it('filtra por categoría y ofrece las que existen, con cuántas tiene cada una', async () => {
    const wrapper = await mountAs('SOCIO');
    const select = wrapper.get('#gestion-categoria');

    expect(select.text()).toContain('Comercio exterior (3)');

    await select.setValue('Comercio exterior');
    await flushPromises();

    expect(getGestiones).toHaveBeenLastCalledWith({
      search: '',
      categoria: 'Comercio exterior',
    });
  });

  it('sin resultados lo dice, y distingue una búsqueda vacía de una Gestoría vacía', async () => {
    vi.mocked(getGestiones).mockResolvedValue([]);

    const wrapper = await mountAs('ADMIN');

    expect(wrapper.text()).toContain('Todavía no hay gestiones.');

    await wrapper.get('#gestion-categoria').setValue('Comercio exterior');
    await flushPromises();

    expect(wrapper.text()).toContain('Ninguna gestión coincide');
  });
});

describe('archivos de una gestión', () => {
  function archivo(nombre: string, bytes: number) {
    return new File([new Uint8Array(bytes)], nombre);
  }

  it('avisa antes de subir lo que el backend rechazaría', () => {
    expect(problemasDeArchivos([archivo('a.pdf', 100)])).toEqual([]);
    expect(
      problemasDeArchivos([archivo('grande.pdf', 10 * 1024 * 1024 + 1)]),
    ).toEqual(['"grande.pdf" pesa más de 10 MB.']);
    expect(
      problemasDeArchivos(
        Array.from({ length: 6 }, (_, i) => archivo(`${i}.pdf`, 1)),
      ),
    ).toEqual(['Se pueden subir hasta 5 archivos a la vez.']);
  });

  it('muestra el tipo y el tamaño como los entiende una persona', () => {
    expect(tipoLegible('application/pdf')).toBe('PDF');
    expect(tipoLegible('image/png')).toBe('Imagen');
    expect(
      tipoLegible(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ).toBe('Word');
    expect(tamanoLegible(900)).toBe('900 B');
    expect(tamanoLegible(2048)).toBe('2 KB');
    expect(tamanoLegible(1.5 * 1024 * 1024)).toBe('1,5 MB');
  });
});
