import { apiFetch } from './api';

export type ChangePasswordData = {
  passwordActual: string;
  passwordNueva: string;
};

// Mismas reglas que valida el backend.
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

/**
 * Cambia la contraseña de la cuenta de la sesión. El backend renueva la cookie
 * de esta sesión y deja sin efecto las abiertas en otros dispositivos.
 */
export function changePassword(data: ChangePasswordData) {
  return apiFetch<{ message: string }>('/auth/cambiar-contrasena', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
