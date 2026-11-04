import { apiFetch } from './api';

export type ChangePasswordData = {
  passwordActual: string;
  passwordNueva: string;
};

// Mismas reglas que valida el backend. Que no sea fácil de adivinar lo decide
// solo el backend (zxcvbn): la pantalla lo avisa y muestra su respuesta.
export const PASSWORD_MIN = 12;
export const PASSWORD_HINT =
  'Que no sea fácil de adivinar: evitá palabras comunes, fechas, secuencias como 1234 y tus propios datos. Varias palabras sueltas juntas funcionan bien.';
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
