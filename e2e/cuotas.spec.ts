import { expect, test } from '@playwright/test';

import { ADMIN, API, abrirArchivo, iniciarSesion, pdf, unico } from './apoyo';

test('la administración genera las cuotas del mes y registra un pago con tarjeta y comprobante', async ({
  page,
}) => {
  const id = unico();
  const razonSocial = `Almacén E2E ${id}`;
  const marca = `Comprobante E2E ${id}`;

  await iniciarSesion(page, ADMIN);

  // El alta del socio ya tiene su propio recorrido: acá se hace por la API.
  // `page.request` comparte las cookies de la página, o sea la sesión.
  const alta = await page.request.post(`${API}/socios`, {
    data: {
      razonSocial,
      titular: 'Juan Gómez',
      giroComercial: 'Almacén',
      tipo: 'COMUN',
      rut: `22${id}`.slice(0, 12),
      numeroBps: id.slice(-9),
      fechaInicioEmpresa: '2010-05-01',
      fechaAfiliacion: '2020-01-01',
      direccion: 'Calle 2 2345',
      ciudad: 'San José de Mayo',
      celular: '099 111 111',
      telefono: '4342 1111',
      email: `almacen-${id}@e2e.test`,
    },
  });
  expect(alta.ok()).toBe(true);
  const { socioId } = (await alta.json()) as { socioId: number };

  // Generar las cuotas del mes, como hace la administración cada mes. Las
  // que ya existen no se duplican, así que se puede correr varias veces.
  await page.goto('/cuotas');
  await page.getByRole('button', { name: 'Generar cuotas' }).click();
  await page.getByRole('button', { name: 'Confirmar generación' }).click();
  await expect(page.getByText(/Cuotas generadas: \d+/)).toBeVisible();

  await page.goto(`/socios/${socioId}`);
  await expect(page.getByText(razonSocial).first()).toBeVisible();
  await expect(page.getByText('Pendiente').first()).toBeVisible();

  await page.getByRole('button', { name: 'Registrar pago' }).click();

  const modal = page
    .locator('.fixed')
    .filter({ hasText: 'Registrar un pago de cuotas para' });

  await modal.getByLabel('Importe').fill('760');
  await modal.getByLabel('Medio de pago').selectOption('TARJETA');

  // Con tarjeta el comprobante es obligatorio: sin él no se puede confirmar.
  const confirmar = modal.getByRole('button', { name: 'Registrar pago' });
  await expect(confirmar).toBeDisabled();

  await modal
    .getByLabel('Comprobante')
    .setInputFiles(pdf('comprobante.pdf', marca));
  await confirmar.click();

  await expect(modal).toBeHidden();
  await expect(page.getByText('Pagada').first()).toBeVisible();

  // El comprobante se abre desde el pago, con un enlace firmado de Storage.
  const archivo = await abrirArchivo(
    page,
    page.getByRole('button', { name: 'Ver comprobante' }).first(),
  );

  expect(archivo.status()).toBe(200);
  expect(archivo.headers()['content-type']).toBe('application/pdf');
  expect((await archivo.body()).toString()).toContain(marca);
});
