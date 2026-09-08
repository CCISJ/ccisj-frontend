const API_URL = import.meta.env.VITE_API_URL;

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(error?.message ?? 'Error al comunicarse con el servidor');
  }

  return response.json();
}
