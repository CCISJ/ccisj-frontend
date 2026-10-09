const API_URL = import.meta.env.VITE_API_URL;

// Endpoints donde un 401 es una respuesta esperada y no una sesión vencida:
// credenciales incorrectas o la consulta inicial de "¿hay sesión?".
const AUTH_PROBES = ['/auth/login', '/auth/me'];

let unauthorizedHandler: (() => void) | null = null;

/**
 * Qué hacer cuando la sesión deja de valer en medio del uso (venció, se
 * desactivó la cuenta o se cambió la contraseña en otro dispositivo). Se
 * registra en `main.ts` para no importar el router ni los stores desde acá.
 */
export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  // `RequestInit.headers` admite tres formas: un objeto plano, un `Headers`
  // o un arreglo de pares. Esto antes hacía `{ ...options.headers }`, que
  // solo funciona con la primera: esparcir un `Headers` da un objeto vacío
  // —las cabeceras se pierden en silencio— y esparcir un arreglo de pares da
  // índices numéricos como nombres de cabecera. `new Headers()` normaliza las
  // tres formas.
  //
  // Hoy ningún llamador pasa cabeceras, así que esto no cambia nada: cierra
  // la trampa antes de que alguien la pise.
  const headers = new Headers(options.headers);

  // Solo si el llamador no definió la suya, para no pisarle un
  // `Content-Type` distinto (por ejemplo al subir un archivo).
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    if (response.status === 401 && !AUTH_PROBES.includes(endpoint)) {
      unauthorizedHandler?.();
    }

    throw new Error(error?.message ?? 'Error al comunicarse con el servidor');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
