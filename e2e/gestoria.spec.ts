import { expect, test } from '@playwright/test';

import {
  ADMIN,
  DIRECTIVO,
  EMPRESA,
  abrirArchivo,
  iniciarSesion,
  otroNavegador,
  pdf,
  unico,
} from './apoyo';

test('la administración asienta una gestión con un archivo y un directivo la consulta', async ({
  page,
  browser,
}) => {
  const id = unico();
  const titulo = `Habilitación E2E ${id}`;
  const categoria = `Trámites E2E ${id}`;

  await iniciarSesion(page, ADMIN);
  await page.goto('/gestoria');
  await page.getByRole('link', { name: 'Nueva gestión' }).click();

  await page.getByLabel('Título').fill(titulo);
  await page.getByLabel('Categoría').fill(categoria);
  await page
    .getByLabel('Descripción')
    .fill('Pasos para renovarla.\nDocumentos que hay que llevar.');
  await page
    .getByLabel('Archivos (opcional)')
    .setInputFiles(pdf('requisitos.pdf', `gestion-${id}`));
  await page.getByRole('button', { name: 'Crear gestión' }).click();

  await expect(page).toHaveURL(/\/gestoria\/\d+$/);
  await expect(page.getByRole('heading', { name: titulo })).toBeVisible();
  await expect(page.getByText('requisitos.pdf')).toBeVisible();

  // Un directivo la encuentra filtrando por la categoría y abre el archivo.
  const directivo = await otroNavegador(browser);
  await iniciarSesion(directivo, DIRECTIVO);
  await directivo.getByRole('link', { name: 'Gestoría' }).click();
  await directivo.getByLabel('Categoría').selectOption(categoria);
  await directivo.getByRole('link', { name: new RegExp(titulo) }).click();

  await expect(directivo.getByRole('heading', { name: titulo })).toBeVisible();
  // El directivo consulta: no puede editar ni borrar.
  await expect(directivo.getByRole('link', { name: 'Editar' })).toHaveCount(0);
  await expect(
    directivo.getByRole('button', { name: 'Agregar archivos' }),
  ).toHaveCount(0);

  const archivo = await abrirArchivo(
    directivo,
    directivo.getByRole('button', { name: 'Abrir requisitos.pdf' }),
  );
  expect(archivo.status()).toBe(200);
  expect((await archivo.body()).toString()).toContain(`gestion-${id}`);

  // La administración la borra, y desaparece para todos.
  const eliminar = page.getByRole('button', { name: 'Eliminar', exact: true });
  await eliminar.click();
  // El de la confirmación: el modal se monta al final de la página.
  await eliminar.last().click();
  await expect(page).toHaveURL(/\/gestoria$/);

  await directivo.reload();
  await expect(directivo.getByText('No se pudo cargar')).toHaveCount(0);
  await expect(directivo.getByText('Gestión no encontrada')).toBeVisible();
});

test('un socio común no ve la Gestoría', async ({ page }) => {
  await iniciarSesion(page, EMPRESA);

  await expect(page.getByRole('link', { name: 'Gestoría' })).toHaveCount(0);

  await page.goto('/gestoria');
  await expect(page).not.toHaveURL(/\/gestoria/);
});
