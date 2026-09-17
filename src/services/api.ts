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
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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
