import { expect, test } from '@playwright/test';

import { ADMIN, cerrarSesion, iniciarSesion, unico } from './apoyo';

test('la administración da de alta un socio y el socio entra con su contraseña inicial', async ({
  page,
}) => {
  const id = unico();
  const socio = {
    razonSocial: `Ferretería E2E ${id}`,
    email: `socio-${id}@e2e.test`,
  };

  await iniciarSesion(page, ADMIN);
  await page.goto('/socios/nuevo');

  await page.getByLabel('Razón social').fill(socio.razonSocial);
  await page.getByLabel('Nombre del titular').fill('Ana Pérez');
  await page.getByLabel('Giro comercial').fill('Ferretería');
  await page.getByLabel('Fecha de inicio de la empresa').fill('2015-03-01');
  await page.getByLabel('RUT').fill(`21${id}`.slice(0, 12));
  await page.getByLabel('Nº BPS').fill(id.slice(-9));
  await page.getByLabel('Teléfono').fill('4342 0000');
  await page.getByLabel('Celular').fill('099 000 000');
  await page.getByLabel('Dirección').fill('Calle 1 1234');
  await page.getByLabel('Ciudad').fill('San José de Mayo');
  await page.getByLabel('Email').fill(socio.email);
  await page.getByRole('button', { name: 'Crear socio' }).click();

  // La contraseña inicial se muestra una sola vez, para entregársela al socio.
  const aviso = page.getByText('Contraseña inicial:');
  await expect(aviso).toBeVisible();
  const password = (await aviso.locator('span').textContent())?.trim() ?? '';
  expect(password.length).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Ver ficha del socio' }).click();
  await expect(page).toHaveURL(/\/socios\/\d+$/);
  await expect(page.getByText(socio.razonSocial).first()).toBeVisible();

  await cerrarSesion(page, ADMIN.nombre);

  // El socio nuevo entra con esa contraseña y ve su empresa.
  await iniciarSesion(page, { email: socio.email, password });
  await page.goto('/mi-empresa');
  await expect(page.getByText(socio.razonSocial).first()).toBeVisible();
});
