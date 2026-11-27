import { type VueWrapper, flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import BaseModal from '@/components/BaseModal.vue';

let wrapper: VueWrapper | null = null;

function mountModal(open: boolean) {
  wrapper = mount(BaseModal, {
    props: { open, title: 'Registrar pago' },
    slots: { default: '<p>Contenido</p>' },
    attachTo: document.body,
  });

  return wrapper;
}

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]');

function pressEscape() {
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
}

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  document.body.innerHTML = '';
});

describe('BaseModal', () => {
  it('es un diálogo modal con nombre: el título', async () => {
    mountModal(true);
    await flushPromises();

    const panel = dialog()!;

    expect(panel.getAttribute('aria-modal')).toBe('true');

    const titleId = panel.getAttribute('aria-labelledby')!;
    expect(document.getElementById(titleId)?.textContent).toContain(
      'Registrar pago',
    );
  });

  it('Escape lo cierra, como la X', async () => {
    const modal = mountModal(true);
    await flushPromises();

    pressEscape();

    expect(modal.emitted('close')).toHaveLength(1);
  });

  it('Escape no le llega a un panel de atrás que también cierra con Escape', async () => {
    const panelDeAtras = vi.fn();
    document.addEventListener('keydown', panelDeAtras);

    mountModal(true);
    await flushPromises();
    pressEscape();

    expect(panelDeAtras).not.toHaveBeenCalled();
    document.removeEventListener('keydown', panelDeAtras);
  });

  it('cerrado, Escape no hace nada', async () => {
    const modal = mountModal(false);
    await flushPromises();

    pressEscape();

    expect(modal.emitted('close')).toBeUndefined();
  });

  it('al abrir lleva el foco al modal y al cerrar lo devuelve al botón que lo abrió', async () => {
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.focus();

    const modal = mountModal(false);
    await modal.setProps({ open: true });
    await flushPromises();

    expect(document.activeElement).toBe(dialog());

    await modal.setProps({ open: false });
    await flushPromises();

    expect(document.activeElement).toBe(button);
  });
});
