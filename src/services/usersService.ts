import { apiFetch } from './api';

/** Lo que devuelve el backend al restablecer: la contraseña, una sola vez. */
export type ResetPasswordResponse = {
  email: string;
  password: string;
};

/**
 * La administración le genera una contraseña nueva a una cuenta. La anterior
 * deja de servir y se cierran las sesiones abiertas de esa cuenta.
 */
export function resetPassword(usuarioId: number) {
  return apiFetch<ResetPasswordResponse>(
    `/usuarios/${usuarioId}/restablecer-contrasena`,
    { method: 'POST' },
  );
}
