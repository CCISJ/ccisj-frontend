import { expect, test } from '@playwright/test';

import { ADMIN, EMPRESA, iniciarSesion, otroNavegador, unico } from './apoyo';

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

test('la administración publica una oferta a nombre de una empresa: el postulante la ve de esa empresa y la empresa la tiene en sus ofertas', async ({
  page,
  browser,
}) => {
  const id = unico();
  const titulo = `Repositor E2E ${id}`;

  // 1. La administración la publica eligiendo la empresa.
  await iniciarSesion(page, ADMIN);
  await page.goto('/ofertas');
  await page.getByRole('link', { name: 'Publicar oferta' }).click();

  await page.getByLabel('Empresa').selectOption({ label: EMPRESA.nombre });
  await page.getByLabel('Título', { exact: true }).fill(titulo);
  await page
    .getByRole('group', { name: 'Categorías' })
    .getByRole('button')
    .first()
    .click();
  await page.getByLabel('Modalidad').selectOption('PRESENCIAL');
  await page.getByLabel('Descripción del puesto').fill(`Reposición (${id}).`);
  await page.getByRole('button', { name: 'Publicar oferta' }).click();

  // Queda en el detalle de la oferta publicada, que dice de quién es.
  await expect(page).toHaveURL(/\/ofertas\/\d+$/);
  await expect(page.getByRole('heading', { name: titulo })).toBeVisible();
  await expect(page.getByText(EMPRESA.nombre).first()).toBeVisible();

  // 2. La edita desde ahí.
  await page.getByRole('link', { name: 'Editar oferta' }).click();
  await page.getByLabel('Vacantes').fill('3');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page).toHaveURL(/\/ofertas\/\d+$/);
  await expect(page.getByText('3 vacantes')).toBeVisible();

  // 3. Sin sesión se ve como una oferta más de la empresa.
  const visitante = await otroNavegador(browser);
  await visitante.goto('/ofertas');
  await visitante.getByLabel('Buscar ofertas').fill(titulo);
  await expect(
    visitante.getByRole('link', { name: new RegExp(titulo) }),
  ).toContainText(EMPRESA.nombre);
  await visitante.context().close();

  // 4. La empresa la encuentra entre las suyas.
  const empresa = await otroNavegador(browser);
  await iniciarSesion(empresa, EMPRESA);
  await empresa.goto('/mis-ofertas');
  await expect(
    empresa.getByRole('row').filter({ hasText: titulo }),
  ).toContainText('Activa');
  await empresa.context().close();
});
