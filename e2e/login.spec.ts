import { expect, test } from '@playwright/test';

import { ADMIN, cerrarSesion, iniciarSesion } from './apoyo';

test.describe('Inicio de sesión', () => {
  test('sin sesión, una pantalla interna manda al login', async ({ page }) => {
    await page.goto('/socios');

    await expect(page).toHaveURL(/\/login$/);
  });

  test('con una contraseña incorrecta no entra y avisa', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo electrónico').fill(ADMIN.email);
    await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta1');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page.getByText('Credenciales inválidas')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('la administración entra, ve su inicio y cierra la sesión', async ({
    page,
  }) => {
    await iniciarSesion(page, ADMIN);

    await expect(page.getByText('Backoffice CCISJ')).toBeVisible();
    await expect(page.getByRole('banner')).toContainText(ADMIN.nombre);

    await cerrarSesion(page, ADMIN.nombre);

    // La cookie se borró de verdad: no alcanza con volver a la pantalla.
    await page.goto('/socios');
    await expect(page).toHaveURL(/\/login$/);
  });
});
