import { getCashMovementReceipt } from '@/services/cashService';

import { useToastStore } from '@/stores/toast';

/**
 * Abre en una pestaña nueva el comprobante de un movimiento de caja. El de un
 * pago de cuota también vive en su movimiento, así que sirve para los dos.
 *
 * La pestaña se abre *antes* de pedir el enlace: si se abriera después del
 * `await`, el navegador ya no lo cuenta como respuesta al clic y la bloquea
 * como ventana emergente. El enlace firmado vence en un minuto, por eso se
 * pide recién al hacer clic y no al cargar la pantalla.
 */
export function useReceiptViewer() {
  const toast = useToastStore();

  async function viewReceipt(movementId: number) {
    const tab = window.open('', '_blank');

    if (tab) {
      // Sin esto, la página del comprobante podría navegar esta pestaña desde
      // la suya con `window.opener` (reverse tabnabbing).
      tab.opener = null;

      tab.document.title = 'Cargando comprobante...';
      tab.document.body.style.cssText =
        'margin:0;display:flex;align-items:center;justify-content:center;' +
        'min-height:100vh;font-family:Arial,sans-serif;' +
        'background:#f8fafc;color:#475569;';

      tab.document.body.textContent = 'Cargando comprobante...';
    }

    try {
      const { url } = await getCashMovementReceipt(movementId);

      if (tab && !tab.closed) {
        tab.location.replace(url);
      } else {
        window.location.href = url;
      }
    } catch (err) {
      tab?.close();

      toast.error(
        err instanceof Error ? err.message : 'Error al abrir el comprobante',
      );
    }
  }

  return { viewReceipt };
}
