import { createPinia, setActivePinia } from 'pinia';

import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AppToast from '@/components/AppToast.vue';

import { useToastStore } from '@/stores/toast';

describe('AppToast', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('la región que anuncia los avisos existe aunque no haya ninguno', () => {
    const wrapper = mount(AppToast);

    expect(wrapper.find('[aria-live="polite"]').exists()).toBe(true);
  });

  it('un error se anuncia como alerta y lo demás como estado', async () => {
    const wrapper = mount(AppToast);
    const toast = useToastStore();

    toast.error('No se pudo guardar');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[role="alert"]').text()).toContain(
      'No se pudo guardar',
    );

    toast.success('Guardado');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[role="status"]').text()).toContain('Guardado');
  });

  it('el botón de cerrar tiene nombre', async () => {
    const wrapper = mount(AppToast);

    useToastStore().info('Hola');
    await wrapper.vm.$nextTick();

    expect(wrapper.get('button').attributes('aria-label')).toBe('Cerrar aviso');
  });

  it('con el mouse encima no se cierra; al sacarlo, se cierra a los 2 segundos', async () => {
    const wrapper = mount(AppToast);
    const toast = useToastStore();

    toast.info('Leyendo…');
    await wrapper.vm.$nextTick();

    await wrapper.get('[role="status"]').trigger('mouseenter');
    vi.advanceTimersByTime(10_000);
    expect(toast.visible).toBe(true);

    await wrapper.get('[role="status"]').trigger('mouseleave');
    vi.advanceTimersByTime(1_999);
    expect(toast.visible).toBe(true);

    vi.advanceTimersByTime(1);
    expect(toast.visible).toBe(false);
  });

  it('sin el mouse encima, se cierra solo a los 3 segundos', () => {
    const toast = useToastStore();

    toast.info('Hola');
    vi.advanceTimersByTime(3_000);

    expect(toast.visible).toBe(false);
  });
});
