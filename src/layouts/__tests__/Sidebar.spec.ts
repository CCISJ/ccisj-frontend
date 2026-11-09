import { createPinia, setActivePinia } from 'pinia';

import router from '@/router';
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import Sidebar from '@/layouts/Sidebar.vue';

import { useAuthStore } from '@/stores/auth';

import type { AuthUser } from '@/types/auth.type';

function mountAs(user: AuthUser) {
  const pinia = createPinia();
  setActivePinia(pinia);
  useAuthStore().user = user;

  return mount(Sidebar, { global: { plugins: [pinia, router] } });
}

/** Los textos del menú, en orden, sin el título de la sección. */
function labels(wrapper: ReturnType<typeof mount>) {
  return wrapper
    .findAll('nav a, nav span[aria-disabled]')
    .map((item) => item.text().replace('Pronto', '').trim());
}

const SOCIO = {
  id: 2,
  email: 'empresa@ccisj.uy',
  displayName: 'Empresa',
  role: 'SOCIO',
} as const;

describe('Sidebar', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('a un socio directivo le muestra cada sección una sola vez', () => {
    const items = labels(mountAs({ ...SOCIO, memberType: 'DIRECTIVO' }));

    expect(items).toEqual([
      'Inicio',
      'Notificaciones',
      'Socios',
      'Buscar candidatos',
      'Mi empresa',
      'Mis ofertas',
      'Postulantes',
    ]);
  });

  it('a un socio común no le muestra el directorio ni la búsqueda de candidatos', () => {
    const items = labels(mountAs({ ...SOCIO, memberType: 'COMUN' }));

    expect(items).not.toContain('Socios');
    expect(items).not.toContain('Buscar candidatos');
    expect(items).toContain('Mi empresa');
  });
});
