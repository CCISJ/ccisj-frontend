import {
  type APIRequestContext,
  type APIResponse,
  type Browser,
  type Locator,
  type Page,
  expect,
  test,
} from '@playwright/test';

/**
 * La API de los E2E: la de `pnpm e2e:api` en el backend, sobre la base de
 * Docker, o la que diga E2E_API (ver `playwright.config.ts`).
 */
export const API = process.env.E2E_API ?? 'http://localhost:3201';

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

  // Más que los 5 s por defecto: Argon2 tarda unos 2 s en verificar la
  // contraseña, y en el primer test vite todavía compila la pantalla de
  // inicio. Juntos llegaron a pasarse de los 5 s sin que nada anduviera mal.
  await expect(page).not.toHaveURL(/\/login/, { timeout: 15_000 });
}

/**
 * Da de alta un socio por la API, con la sesión de la administración que
 * tenga `request` (`page.request` comparte las cookies de la página). El alta
 * por la pantalla ya tiene su propio recorrido (`socios.spec.ts`). Devuelve
 * también la contraseña inicial, que la API muestra una sola vez.
 */
export async function altaDeSocio(
  request: APIRequestContext,
  razonSocial: string,
) {
  const id = unico();
  const email = `socio-${id}@e2e.test`;

  const alta = await request.post(`${API}/socios`, {
    data: {
      razonSocial,
      titular: 'Juan Gómez',
      giroComercial: 'Almacén',
      tipo: 'COMUN',
      // Con los últimos dígitos: los primeros son la hora y se repiten entre
      // dos altas seguidas, y el RUT no se puede repetir.
      rut: `22${id.slice(-10)}`,
      numeroBps: id.slice(-9),
      fechaInicioEmpresa: '2010-05-01',
      fechaAfiliacion: '2020-01-01',
      direccion: 'Calle 2 2345',
      ciudad: 'San José de Mayo',
      celular: '099 111 111',
      telefono: '4342 1111',
      email,
    },
  });
  expect(alta.ok()).toBe(true);

  const { socioId, passwordInicial } = (await alta.json()) as {
    socioId: number;
    passwordInicial: string;
  };

  return { socioId, razonSocial, email, password: passwordInicial };
}

/**
 * Una pestaña en otro navegador, con su propia sesión: para ver lo mismo
 * desde dos cuentas a la vez, sin cerrar e iniciar sesión cada vez.
 */
export async function otroNavegador(browser: Browser) {
  const { baseURL, ignoreHTTPSErrors, locale, timezoneId } =
    test.info().project.use;
  const context = await browser.newContext({
    baseURL,
    ignoreHTTPSErrors,
    locale,
    timezoneId,
  });

  return context.newPage();
}

/** El número de un importe como lo muestra la pantalla ("$1.234,5"). */
export function importe(texto: string | null) {
  return Number((texto ?? '').replace(/[^\d,-]/g, '').replace(',', '.'));
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
