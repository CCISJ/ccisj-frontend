import { expect, test } from '@playwright/test';

import {
  ADMIN,
  altaDeSocio,
  iniciarSesion,
  otroNavegador,
  unico,
} from './apoyo';

test('la administración manda un aviso importante a un socio: le llega solo a él y lo marca como leído', async ({
  page,
  browser,
}) => {
  const id = unico();
  const titulo = `Corte de luz E2E ${id}`;
  const mensaje = 'Mañana no habrá atención en la sede de 9 a 12.';

  await iniciarSesion(page, ADMIN);

  // Dos socios nuevos: el aviso va a uno solo, y el otro no lo tiene que ver.
  const destinatario = await altaDeSocio(page.request, `Panadería E2E ${id}`);
  const otro = await altaDeSocio(page.request, `Librería E2E ${id}`);

  // 1. La administración lo manda a un usuario específico.
  await page.goto('/notificaciones');
  await page.getByLabel('Título', { exact: true }).fill(titulo);
  await page.getByLabel('Mensaje', { exact: true }).fill(mensaje);
  await page
    .getByLabel('Destinatarios', { exact: true })
    .selectOption('USUARIOS');
  await page.getByLabel('Buscar destinatarios').fill(destinatario.email);
  await page
    .locator('label')
    .filter({ hasText: destinatario.email })
    .getByRole('checkbox')
    .check();
  await page.getByLabel('Tipo', { exact: true }).selectOption('EMERGENTE');
  await page.getByRole('button', { name: 'Enviar notificación' }).click();

  await expect(
    page.getByText('Notificación enviada correctamente'),
  ).toBeVisible();
  await expect(page.getByText(titulo).first()).toBeVisible();

  // 2. Al destinatario, apenas entra, le aparece en una ventana que no se
  // cierra tocando afuera, solo con "Entendido". Cerrada, no vuelve a salir.
  const socio = await otroNavegador(browser);
  await iniciarSesion(socio, destinatario);

  const ventana = socio
    .locator('.fixed')
    .filter({ hasText: 'Notificación importante' });
  await expect(ventana).toContainText(titulo);
  await expect(ventana).toContainText(mensaje);
  await ventana.getByRole('button', { name: 'Entendido' }).click();
  await expect(ventana).toBeHidden();

  // Después de que la pantalla vuelve a preguntar si hay ventanas pendientes.
  const pendientes = socio.waitForResponse(
    (r) => r.url().endsWith('/notificaciones/emergentes') && r.ok(),
  );
  await socio.reload();
  expect(await (await pendientes).json()).toEqual([]);
  await expect(ventana).toHaveCount(0);

  // En sus notificaciones queda marcada como importante y sin leer.
  await socio.goto('/notificaciones');

  const aviso = socio.getByRole('button').filter({ hasText: titulo });
  await expect(aviso).toContainText(mensaje);
  await expect(aviso).toContainText('Importante');
  await expect(socio.getByText('1 sin leer')).toBeVisible();

  // Al abrirla queda leída, y sigue así al volver a entrar.
  await aviso.click();
  await expect(socio.getByText('1 sin leer')).toBeHidden();
  await socio.reload();
  await expect(aviso).toBeVisible();
  await expect(socio.getByText(/\d+ sin leer/)).toHaveCount(0);

  // 3. El otro socio no la ve.
  const ajeno = await otroNavegador(browser);
  await iniciarSesion(ajeno, otro);
  await ajeno.goto('/notificaciones');
  await expect(ajeno.getByText('No tenés notificaciones')).toBeVisible();
  await expect(ajeno.getByText(titulo)).toHaveCount(0);

  await socio.context().close();
  await ajeno.context().close();
});
