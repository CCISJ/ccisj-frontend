import { createPinia, setActivePinia } from 'pinia';

import MyCvView from '@/views/applicants/MyCvView.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getMyCv, saveMyCv } from '@/services/cvService';

import type { Cv } from '@/types/cv.type';

vi.mock('@/services/cvService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/cvService')>()),
  getMyCv: vi.fn(),
  saveMyCv: vi.fn(),
}));

const CV: Cv = {
  id: 1,
  nombre: 'Juan',
  apellido: 'Pérez',
  telefono: null,
  direccion: null,
  fechaNacimiento: null,
  otros: null,
  usuario: { email: 'juan@ccisj.uy' },
  estudios: [
    {
      id: 1,
      tipo: 'CURRICULAR',
      institucion: 'Liceo N°1',
      titulo: 'Bachillerato',
      fechaInicio: '2011-03-01T00:00:00.000Z',
      fechaFin: '2016-12-01T00:00:00.000Z',
      enCurso: false,
      descripcion: null,
    },
  ],
  experiencias: [
    {
      id: 2,
      empresa: 'Supermercado',
      cargo: 'Cajero',
      fechaInicio: '2020-02-01T00:00:00.000Z',
      fechaFin: null,
      actual: true,
      tareas: null,
    },
  ],
  referencias: [],
  categorias: [],
  cvs: [],
};

async function mountCv() {
  setActivePinia(createPinia());

  const wrapper = mount(MyCvView);
  await flushPromises();

  return wrapper;
}

describe('Mi CV: lo cargado se ve resumido', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMyCv).mockResolvedValue(structuredClone(CV));
  });

  it('cada estudio y experiencia es una línea, sin los campos a la vista', async () => {
    const wrapper = await mountCv();

    expect(wrapper.text()).toContain('Bachillerato');
    expect(wrapper.text()).toContain('Liceo N°1 · 2011 – 2016');
    expect(wrapper.text()).toContain('Supermercado · 2020 – hoy');
    expect(wrapper.find('#estudio-0-institucion').exists()).toBe(false);
  });

  it('Editar abre los campos con lo guardado, y Listo los vuelve a cerrar', async () => {
    const wrapper = await mountCv();

    await wrapper.get('[aria-label="Editar Bachillerato"]').trigger('click');

    const institucion = wrapper.get('#estudio-0-institucion');
    expect((institucion.element as HTMLInputElement).value).toBe('Liceo N°1');

    await institucion.setValue('Liceo N°2');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Listo')!
      .trigger('click');

    expect(wrapper.find('#estudio-0-institucion').exists()).toBe(false);
    expect(wrapper.text()).toContain('Liceo N°2 · 2011 – 2016');
  });

  it('lo que se agrega viene abierto para completarlo', async () => {
    const wrapper = await mountCv();

    const agregar = wrapper
      .findAll('button')
      .filter((button) => button.text().includes('Agregar'));

    // El segundo "Agregar" es el de estudios no curriculares.
    await agregar[1]!.trigger('click');

    expect(wrapper.find('#estudio-1-institucion').exists()).toBe(true);
  });

  it('al guardar, todo vuelve a verse resumido', async () => {
    vi.mocked(saveMyCv).mockResolvedValue(structuredClone(CV));
    const wrapper = await mountCv();

    await wrapper.get('[aria-label="Editar Cajero"]').trigger('click');
    expect(wrapper.find('#experiencia-0-empresa').exists()).toBe(true);

    await wrapper
      .findAll('button')
      .find((button) => button.text().includes('Guardar CV'))!
      .trigger('click');
    await flushPromises();

    expect(saveMyCv).toHaveBeenCalled();
    expect(wrapper.find('#experiencia-0-empresa').exists()).toBe(false);
  });
});
