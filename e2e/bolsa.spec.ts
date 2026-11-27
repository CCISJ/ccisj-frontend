import { type Page, expect, test } from '@playwright/test';

import { EMPRESA, iniciarSesion, otroNavegador, unico } from './apoyo';

/**
 * La bolsa de candidatos muestra solo a quien eligió que las empresas socias
 * lo encuentren. Por defecto nadie aparece: un postulante recién registrado
 * no está en la bolsa hasta que lo activa en "Mi perfil".
 */
test('un postulante aparece en la bolsa de candidatos recién cuando elige que las empresas lo encuentren', async ({
  page,
  browser,
}) => {
  const id = unico();
  const persona = {
    nombre: 'Martina',
    apellido: `Bolsa ${id}`,
    email: `martina-${id}@e2e.test`,
    password: 'Gaviota-Faro-Tilo-47',
  };

  // Se registra sola desde la bolsa de trabajo.
  await page.goto('/registro');
  await page.getByLabel('Nombre').fill(persona.nombre);
  await page.getByLabel('Apellido').fill(persona.apellido);
  await page.getByLabel('Correo electrónico').fill(persona.email);
  await page.getByLabel('Teléfono').fill('099 333 333');
  await page.getByLabel('Contraseña', { exact: true }).fill(persona.password);
  await page.getByLabel('Repetir contraseña').fill(persona.password);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).not.toHaveURL(/\/registro/);

  // Una empresa socia busca candidatos por el apellido.
  const empresa = await otroNavegador(browser);
  await iniciarSesion(empresa, EMPRESA);

  async function buscar(pagina: Page) {
    await pagina.goto('/candidatos');
    await pagina.getByLabel('Nombre o apellido').fill(persona.apellido);
    await pagina.getByRole('button', { name: 'Buscar', exact: true }).click();
  }

  // Todavía no eligió aparecer: la empresa no la encuentra.
  await buscar(empresa);
  await expect(empresa.getByText('No se encontraron candidatos')).toBeVisible();

  // En "Mi perfil" elige que las empresas la puedan encontrar.
  await page.goto('/mi-perfil');
  const opcion = page.getByLabel(
    'Quiero que las empresas socias puedan encontrarme',
  );
  await expect(opcion).not.toBeChecked();
  await opcion.check();
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByText('Perfil guardado')).toBeVisible();

  // Ahora la empresa sí la encuentra.
  await buscar(empresa);
  await expect(
    empresa.getByRole('heading', {
      name: `${persona.nombre} ${persona.apellido}`,
    }),
  ).toBeVisible();
});
