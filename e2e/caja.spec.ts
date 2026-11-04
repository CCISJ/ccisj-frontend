import { expect, test } from '@playwright/test';

import {
  ADMIN,
  abrirArchivo,
  importe,
  iniciarSesion,
  pdf,
  unico,
} from './apoyo';

test('la administración registra un ingreso en caja, le adjunta el comprobante y lo anula', async ({
  page,
}) => {
  const id = unico();
  const concepto = `Alquiler de salón E2E ${id}`;
  const marca = `Comprobante de caja E2E ${id}`;

  await iniciarSesion(page, ADMIN);

  // Lo que la API dice que entró este mes, antes de tocar nada. Los demás
  // recorridos también mueven la caja, pero corren de a uno.
  const resumen = page.waitForResponse(
    (r) => r.url().endsWith('/caja/movimientos/resumen') && r.ok(),
  );
  await page.goto('/caja');
  const antes = Number(
    ((await (await resumen).json()) as { ingresos: number | string }).ingresos,
  );

  const ingresosDelMes = page
    .getByText('Ingresos del mes')
    .locator('xpath=following-sibling::p');
  await expect
    .poll(async () => importe(await ingresosDelMes.textContent()))
    .toBe(antes);

  // 1. Registra el ingreso. La fecha viene puesta en hoy.
  await page.getByRole('button', { name: 'Registrar movimiento' }).click();

  const modal = page.locator('.fixed').filter({
    has: page.getByRole('heading', { name: 'Registrar movimiento' }),
  });

  await modal.getByLabel('Tipo').selectOption('INGRESO');
  await modal.getByLabel('Categoría').selectOption({
    label: 'Alquiler de espacios',
  });
  await modal.getByLabel('Concepto').fill(concepto);
  await modal.getByLabel('Importe').fill('1234');
  await modal.getByLabel('Observaciones').fill('Evento de fin de año');
  await modal.getByRole('button', { name: 'Registrar movimiento' }).click();
  await expect(modal).toBeHidden();

  const fila = page.getByRole('row').filter({ hasText: concepto });
  await expect(fila).toContainText('Ingreso');
  await expect(fila).toContainText('+ $1.234');
  await expect
    .poll(async () => importe(await ingresosDelMes.textContent()))
    .toBe(antes + 1234);

  // 2. Le adjunta el comprobante y lo abre.
  const selector = page.waitForEvent('filechooser');
  await fila.getByRole('button', { name: 'Adjuntar' }).click();
  await (await selector).setFiles(pdf('factura.pdf', marca));
  await expect(
    page.getByText('Comprobante guardado correctamente'),
  ).toBeVisible();
  await expect(fila.getByRole('button', { name: 'Reemplazar' })).toBeVisible();

  const archivo = await abrirArchivo(
    page,
    fila.getByRole('button', { name: 'Ver' }),
  );

  expect(archivo.status()).toBe(200);
  expect(archivo.headers()['content-type']).toBe('application/pdf');
  expect((await archivo.body()).toString()).toContain(marca);

  // 3. Lo anula: sin motivo no se puede, y después queda en el historial
  // marcado como anulado y fuera del resumen del mes.
  await fila.getByRole('button', { name: 'Anular' }).click();
  await page.getByRole('button', { name: 'Anular movimiento' }).click();
  await expect(page.getByText('Ingresá un motivo de anulación')).toBeVisible();

  await page
    .getByLabel('Motivo de anulación')
    .fill('Importe registrado incorrectamente');
  await page.getByRole('button', { name: 'Anular movimiento' }).click();
  await expect(
    page.getByText('Movimiento anulado correctamente'),
  ).toBeVisible();

  await expect(fila).toContainText('Anulado');
  await expect(fila.getByRole('button', { name: 'Anular' })).toHaveCount(0);
  await expect(fila.getByRole('button', { name: 'Reemplazar' })).toHaveCount(0);
  await expect
    .poll(async () => importe(await ingresosDelMes.textContent()))
    .toBe(antes);
});
