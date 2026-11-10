import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import TabBar from '@/components/TabBar.vue';

const TABS = [
  { value: 'resumen', label: 'Resumen' },
  { value: 'cuotas', label: 'Cuotas y pagos' },
  { value: 'datos', label: 'Datos' },
];

function mountTabs(modelValue: string, idPrefix = 'x') {
  return mount(TabBar, {
    attachTo: document.body,
    props: { tabs: TABS, idPrefix, label: 'Secciones', modelValue },
  });
}

describe('TabBar', () => {
  it('marca la pestaña elegida y solo esa entra en el orden del tabulador', () => {
    const wrapper = mountTabs('cuotas');
    const tabs = wrapper.findAll('[role="tab"]');

    expect(tabs.map((tab) => tab.attributes('aria-selected'))).toEqual([
      'false',
      'true',
      'false',
    ]);
    expect(tabs.map((tab) => tab.attributes('tabindex'))).toEqual([
      '-1',
      '0',
      '-1',
    ]);
    expect(tabs[1]!.attributes('aria-controls')).toBe('x-panel-cuotas');

    wrapper.unmount();
  });

  it('con las flechas pasa a la siguiente, y da la vuelta', async () => {
    const wrapper = mountTabs('datos', 'y');

    await wrapper.findAll('[role="tab"]')[2]!.trigger('keydown', {
      key: 'ArrowRight',
    });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['resumen']);

    await wrapper.findAll('[role="tab"]')[2]!.trigger('keydown', {
      key: 'ArrowLeft',
    });
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['cuotas']);

    wrapper.unmount();
  });
});
