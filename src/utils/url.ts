/**
 * La URL, si es https y absoluta; si no, null. Para enlazar valores que carga
 * otro usuario (como el archivo de un CV) sin abrir la puerta a un
 * `javascript:` o a una ruta que no lleva a ningún lado.
 */
export function safeHttpsUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    const url = new URL(value);

    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/** Número para un enlace `tel:`: solo dígitos y un `+` inicial. */
export function telHref(value: string | null | undefined) {
  if (!value) return null;

  const digits = value.trim().replace(/(?!^\+)[^\d]/g, '');

  return /\d{3,}/.test(digits) ? `tel:${digits}` : null;
}
