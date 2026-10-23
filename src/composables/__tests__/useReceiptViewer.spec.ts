import { createPinia, setActivePinia } from 'pinia';

import { useReceiptViewer } from '@/composables/useReceiptViewer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getCashMovementReceipt } from '@/services/cashService';

import { useToastStore } from '@/stores/toast';

vi.mock('@/services/cashService', () => ({
  getCashMovementReceipt: vi.fn(),
}));

const SIGNED_URL = 'https://storage.example.com/comprobante.pdf?token=abc';

// Lo justo de una pestaña para lo que usa el composable.
function fakeTab() {
  const document = window.document.implementation.createHTMLDocument('');

  return {
    opener: window as Window | null,
    closed: false,
    document,
    location: { replace: vi.fn() },
    close: vi.fn(),
  };
}

describe('useReceiptViewer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('abre el comprobante en una pestaña sin acceso a esta', async () => {
    const tab = fakeTab();
    const open = vi.spyOn(window, 'open').mockReturnValue(tab as never);
    vi.mocked(getCashMovementReceipt).mockResolvedValue({ url: SIGNED_URL });

    await useReceiptViewer().viewReceipt(42);

    expect(open).toHaveBeenCalledWith('', '_blank');
    // Sin esto, el documento abierto podría navegar esta pestaña a una
    // página falsa de login con `window.opener.location` (reverse
    // tabnabbing). El archivo lo subió una persona, no es de confianza.
    expect(tab.opener).toBeNull();
    expect(getCashMovementReceipt).toHaveBeenCalledWith(42);
    // `replace` y no `href`: el "Cargando..." no queda en el historial.
    expect(tab.location.replace).toHaveBeenCalledWith(SIGNED_URL);
  });

  it('abre la pestaña antes de pedir el enlace', async () => {
    // Si se abriera después del `await`, el navegador ya no lo cuenta como
    // respuesta al clic y la bloquea como ventana emergente.
    const order: string[] = [];
    vi.spyOn(window, 'open').mockImplementation(() => {
      order.push('open');
      return fakeTab() as never;
    });
    vi.mocked(getCashMovementReceipt).mockImplementation(async () => {
      order.push('pedir enlace');
      return { url: SIGNED_URL };
    });

    await useReceiptViewer().viewReceipt(1);

    expect(order).toEqual(['open', 'pedir enlace']);
  });

  it('si falla, cierra la pestaña y muestra el error', async () => {
    const tab = fakeTab();
    vi.spyOn(window, 'open').mockReturnValue(tab as never);
    vi.mocked(getCashMovementReceipt).mockRejectedValue(
      new Error('El movimiento no tiene comprobante'),
    );

    await useReceiptViewer().viewReceipt(7);

    expect(tab.close).toHaveBeenCalledOnce();
    expect(tab.location.replace).not.toHaveBeenCalled();

    const toast = useToastStore();
    expect(toast.type).toBe('error');
    expect(toast.message).toBe('El movimiento no tiene comprobante');
  });
});
