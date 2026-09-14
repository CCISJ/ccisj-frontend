// Una fecha sin hora (afiliación, inicio de actividad) llega del backend como
// medianoche UTC: `2020-06-15T00:00:00.000Z`. Mostrada en hora de Uruguay
// (UTC-3) caería el día anterior, así que esas se formatean en UTC. Las que
// tienen hora real, como la de una notificación, se muestran en hora local.
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}(T00:00:00(\.000)?Z)?$/;

export function formatDate(value: string | null | undefined) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('es-UY', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: DATE_ONLY.test(value) ? 'UTC' : undefined,
  });
}
