import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AccountAccess from '@/components/users/AccountAccess.vue';

import { resetPassword } from '@/services/usersService';

vi.mock('@/services/usersService', () => ({ resetPassword: vi.fn() }));

function mountAccess() {
  return mount(AccountAccess, {
    props: { usuarioId: 42, email: 'empresa@ccisj.uy', nombre: 'Ferretería' },
    // El modal se monta en <body>; acá se pinta en el lugar para leerlo.
    global: { stubs: { teleport: true } },
  });
}

function button(wrapper: ReturnType<typeof mountAccess>, text: string) {
  const found = wrapper.findAll('button').find((b) => b.text() === text);

  if (!found) throw new Error(`No hay un botón "${text}"`);

  return found;
}

describe('AccountAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pide confirmación, genera la contraseña y la muestra una sola vez', async () => {
    vi.mocked(resetPassword).mockResolvedValue({
      email: 'empresa@ccisj.uy',
      password: 'Kp7mRt3xQw9z',
    });

    const wrapper = mountAccess();

    await button(wrapper, 'Generar contraseña nueva').trigger('click');

    // Antes de confirmar no se pidió nada.
    expect(resetPassword).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('deja de servir');

    // El del modal es el último con ese texto.
    const confirmar = wrapper
      .findAll('button')
      .filter((b) => b.text() === 'Generar contraseña nueva')
      .at(-1)!;
    await confirmar.trigger('click');
    await flushPromises();

    expect(resetPassword).toHaveBeenCalledWith(42);
    expect(wrapper.get('[data-test="password"]').text()).toBe('Kp7mRt3xQw9z');
    expect(wrapper.text()).toContain('No se vuelve a mostrar');

    await button(wrapper, 'Listo, ya la anoté').trigger('click');

    expect(wrapper.find('[data-test="password"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Kp7mRt3xQw9z');
  });

  it('si el backend la rechaza, lo dice y no muestra ninguna contraseña', async () => {
    vi.mocked(resetPassword).mockRejectedValue(
      new Error('Usuario no encontrado'),
    );

    const wrapper = mountAccess();

    await button(wrapper, 'Generar contraseña nueva').trigger('click');
    await wrapper
      .findAll('button')
      .filter((b) => b.text() === 'Generar contraseña nueva')
      .at(-1)!
      .trigger('click');
    await flushPromises();

    expect(wrapper.get('[role="alert"]').text()).toBe('Usuario no encontrado');
    expect(wrapper.find('[data-test="password"]').exists()).toBe(false);
  });
});
