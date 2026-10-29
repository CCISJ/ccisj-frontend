import {
  type APIResponse,
  type Locator,
  type Page,
  expect,
} from '@playwright/test';

/** La API de los E2E (`pnpm e2e:api` en el backend), sobre la base de Docker. */
export const API = 'http://localhost:3201';

// Las cuentas del seed del backend (`prisma/seed.ts`). Solo existen en la base
// de pruebas, y la contraseña es la del seed: no protege nada real.
export const ADMIN = {
  email: 'admin@ccisj.uy',
  password: '1234',
  nombre: 'Administración CCISJ',
};

export const EMPRESA = {
  email: 'empresa@ccisj.uy',
  password: '1234',
  nombre: 'Empresa de Prueba SRL',
};

/** Para que los datos de cada corrida no choquen con los de la anterior. */
export function unico() {
  return `${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

/** Un PDF mínimo: el backend reconoce el tipo por los primeros bytes. */
export function pdf(nombre: string, marca: string) {
  return {
    name: nombre,
    mimeType: 'application/pdf',
    buffer: Buffer.from(`%PDF-1.7\n${marca}\n`),
  };
}

export async function iniciarSesion(
  page: Page,
  cuenta: { email: string; password: string },
) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(cuenta.email);
  await page.getByLabel('Contraseña', { exact: true }).fill(cuenta.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function cerrarSesion(page: Page, nombre: string) {
  // El menú del usuario es el botón del encabezado con su nombre.
  await page.getByRole('banner').getByRole('button', { name: nombre }).click();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/\/login/);
}

/**
 * Hace click en `boton`, que abre un archivo en una pestaña nueva con un
 * enlace firmado de Storage, y devuelve lo que contesta ese enlace.
 *
 * El enlace se vuelve a pedir aparte porque la pestaña no sirve para leerlo:
 * el navegador muestra el PDF con su visor, y lo que queda en la pestaña es
 * la página del visor y no el archivo.
 */
export async function abrirArchivo(
  page: Page,
  boton: Locator,
): Promise<APIResponse> {
  const pestaña = page.waitForEvent('popup');

  await boton.click();

  const popup = await pestaña;
  await popup.waitForURL(/\/object\/sign\//);
  const enlace = popup.url();
  await popup.close();

  return page.request.get(enlace);
}
