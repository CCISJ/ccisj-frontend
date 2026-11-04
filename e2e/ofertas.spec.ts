import { expect, test } from '@playwright/test';

import { EMPRESA, iniciarSesion, otroNavegador, unico } from './apoyo';

test('una empresa publica una oferta, se ve en la bolsa de trabajo sin sesión y al cerrarla deja de verse', async ({
  page,
  browser,
}) => {
  const id = unico();
  const titulo = `Cajero E2E ${id}`;
  const descripcion = `Atención al público y manejo de caja (${id}).`;

  // 1. La empresa publica la oferta.
  await iniciarSesion(page, EMPRESA);
  await page.goto('/mis-ofertas/nueva');

  await page.getByLabel('Título', { exact: true }).fill(titulo);
  await page
    .getByRole('group', { name: 'Categorías' })
    .getByRole('button')
    .first()
    .click();
  await page.getByLabel('Modalidad').selectOption('PRESENCIAL');
  await page.getByLabel('Ubicación').fill('San José de Mayo');
  await page.getByLabel('Vacantes').fill('2');
  await page.getByLabel('Descripción del puesto').fill(descripcion);
  await page.getByRole('button', { name: 'Publicar oferta' }).click();

  await expect(page).toHaveURL(/\/mis-ofertas$/);
  const fila = page.getByRole('row').filter({ hasText: titulo });
  await expect(fila).toContainText('Activa');

  // 2. Alguien sin sesión la encuentra en la bolsa de trabajo y la abre.
  const visitante = await otroNavegador(browser);
  await visitante.goto('/ofertas');
  await visitante.getByLabel('Buscar ofertas').fill(titulo);

  const enlace = visitante.getByRole('link', { name: new RegExp(titulo) });
  await enlace.click();
  // La lista también muestra la descripción: esperar a estar en el detalle.
  await expect(visitante).toHaveURL(/\/ofertas\/\d+$/);
  await expect(visitante.getByText(descripcion)).toBeVisible();
  await expect(visitante.getByText(EMPRESA.nombre).first()).toBeVisible();
  const detalle = visitante.url();

  // 3. La empresa la cierra.
  await fila.getByRole('button', { name: `Cerrar ${titulo}` }).click();
  await page.getByRole('button', { name: 'Cerrar oferta' }).click();
  await expect(fila).toContainText('Cerrada');

  // 4. Sin sesión ya no aparece en la lista, y el enlace directo avisa que
  // no está disponible.
  await visitante.goto('/ofertas');
  await visitante.getByLabel('Buscar ofertas').fill(titulo);
  await expect(enlace).toHaveCount(0);

  await visitante.goto(detalle);
  await expect(
    visitante.getByText('Esta oferta ya no está disponible.'),
  ).toBeVisible();
  await expect(visitante.getByText(descripcion)).toHaveCount(0);

  await visitante.context().close();
});
