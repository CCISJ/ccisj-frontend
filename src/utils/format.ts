/**
 * Fechas del backend (ISO) a formato local uruguayo. Devuelve un guion cuando
 * el campo viene vacío, para no imprimir "Invalid Date" en pantalla.
 */
export function formatDate(value: string | null | undefined) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
