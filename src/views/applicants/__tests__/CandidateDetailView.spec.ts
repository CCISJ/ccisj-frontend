import { createMemoryHistory, createRouter } from 'vue-router';

import CandidateDetailView from '@/views/applicants/CandidateDetailView.vue';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import {
  getCandidateById,
  getCandidateCvFileUrl,
} from '@/services/applicantService';

vi.mock('@/services/applicantService', () => ({
  getCandidateById: vi.fn(),
  getCandidateCvFileUrl: vi.fn(),
}));

const SIGNED_URL = 'https://storage.example.com/cv.pdf?token=abc';

async function mountWithCv() {
  vi.mocked(getCandidateById).mockResolvedValue({
    id: 12,
    nombre: 'Ana',
    apellido: 'Pérez',
    direccion: null,
    otros: null,
    categorias: [],
    estudios: [],
    experiencias: [],
    referencias: [],
    cvs: [{ id: 5, nombreArchivo: 'cv.pdf', descripcion: null }],
  } as never);
  vi.mocked(getCandidateCvFileUrl).mockResolvedValue({ url: SIGNED_URL });

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/candidatos',
        name: 'candidatos',
        component: { template: '<div />' },
      },
      {
        path: '/candidatos/:id',
        name: 'candidato-detalle',
        component: CandidateDetailView,
      },
    ],
  });
  await router.push('/candidatos/12');

  const wrapper = mount(CandidateDetailView, {
    global: { plugins: [router] },
  });
  await flushPromises();

  return wrapper;
}

describe('CandidateDetailView', () => {
  it('abre el PDF del candidato en una pestaña sin acceso a esta', async () => {
    const tab = {
      opener: window as Window | null,
      location: { replace: vi.fn() },
      close: vi.fn(),
    };
    vi.spyOn(window, 'open').mockReturnValue(tab as never);

    const wrapper = await mountWithCv();
    await wrapper.get('button').trigger('click');
    await flushPromises();

    // El PDF lo subió el postulante: sin esto podría navegar esta pestaña
    // con `window.opener` (reverse tabnabbing).
    expect(tab.opener).toBeNull();
    expect(getCandidateCvFileUrl).toHaveBeenCalledWith(12, 5);
    expect(tab.location.replace).toHaveBeenCalledWith(SIGNED_URL);
  });
});
