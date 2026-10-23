// El control real del archivo lo hace el backend (que además mira el
// contenido y no solo el tipo declarado). Esto prueba que el aviso temprano
// usa los mismos límites, para que nadie arme un pago que el servidor va a
// rechazar.
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ReceiptFileInput from '@/components/fees/ReceiptFileInput.vue';

const MB = 1024 * 1024;

function makeFile(name: string, type: string, size: number) {
  return new File([new Uint8Array(size)], name, { type });
}

async function choose(file: File) {
  const wrapper = mount(ReceiptFileInput, { props: { id: 'comprobante' } });
  const input = wrapper.get('input[type="file"]');

  // jsdom no deja elegir archivos: se le pone la lista a mano.
  Object.defineProperty(input.element, 'files', { value: [file] });
  await input.trigger('change');

  return wrapper;
}

// El archivo que quedó elegido. Si el componente no emitió nada, el modelo
// sigue en su valor inicial, que es `null`.
function chosen(wrapper: Awaited<ReturnType<typeof choose>>) {
  return wrapper.emitted('update:modelValue')?.at(-1)?.[0] ?? null;
}

describe('ReceiptFileInput', () => {
  it.each([
    ['comprobante.pdf', 'application/pdf'],
    ['foto.jpg', 'image/jpeg'],
    ['captura.png', 'image/png'],
  ])('acepta %s', async (name, type) => {
    const file = makeFile(name, type, 200 * 1024);

    const wrapper = await choose(file);

    expect(chosen(wrapper)).toBe(file);
    expect(wrapper.text()).not.toContain('Solo se permiten');
  });

  it.each([
    ['notas.txt', 'text/plain'],
    ['pagina.html', 'text/html'],
    ['imagen.svg', 'image/svg+xml'],
    ['sin-tipo', ''],
  ])('rechaza %s', async (name, type) => {
    const wrapper = await choose(makeFile(name, type, 1024));

    expect(chosen(wrapper)).toBeNull();
    expect(wrapper.text()).toContain(
      'Solo se permiten archivos PDF, JPG y PNG',
    );
  });

  it('acepta justo 5 MB y rechaza un byte más', async () => {
    const exact = makeFile('justo.pdf', 'application/pdf', 5 * MB);
    expect(chosen(await choose(exact))).toBe(exact);

    const wrapper = await choose(
      makeFile('grande.pdf', 'application/pdf', 5 * MB + 1),
    );

    expect(chosen(wrapper)).toBeNull();
    expect(wrapper.text()).toContain('no puede superar los 5 MB');
  });
});
