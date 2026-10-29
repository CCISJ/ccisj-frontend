import { expect, test } from '@playwright/test';

import {
  EMPRESA,
  abrirArchivo,
  cerrarSesion,
  iniciarSesion,
  pdf,
  unico,
} from './apoyo';

// Una oferta del seed, de la empresa de prueba.
const OFERTA = 'Vendedor de mostrador';

test('una persona se registra, sube su CV y se postula; la empresa ve la postulación y el PDF', async ({
  page,
}) => {
  const id = unico();
  const persona = {
    nombre: 'Lucía',
    apellido: `E2E ${id}`,
    email: `lucia-${id}@e2e.test`,
    // Cumple la política: letras, números y más de 10 caracteres.
    password: `Clave${id}`,
  };
  const archivo = `cv-${id}.pdf`;
  const marca = `CV E2E ${id}`;

  // 1. Se registra sola desde la bolsa de trabajo.
  await page.goto('/registro');
  await page.getByLabel('Nombre').fill(persona.nombre);
  await page.getByLabel('Apellido').fill(persona.apellido);
  await page.getByLabel('Correo electrónico').fill(persona.email);
  await page.getByLabel('Teléfono').fill('099 222 222');
  await page.getByLabel('Contraseña', { exact: true }).fill(persona.password);
  await page.getByLabel('Repetir contraseña').fill(persona.password);
  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect(page).not.toHaveURL(/\/registro/);

  // 2. Sube su CV en PDF.
  await page.goto('/mi-cv');
  await page.getByLabel('Subir CV en PDF').setInputFiles(pdf(archivo, marca));
  await expect(page.getByText(archivo)).toBeVisible();

  // 3. Se postula a una oferta, mandando ese PDF.
  await page.goto('/ofertas');
  await page
    .getByRole('link', { name: new RegExp(OFERTA) })
    .first()
    .click();
  await page.getByLabel(archivo).check();
  await page
    .getByLabel('Mensaje para la empresa')
    .fill('Tengo experiencia en atención al público.');
  await page.getByRole('button', { name: 'Postularme' }).click();
  await expect(page.getByText('Ya te postulaste a esta oferta.')).toBeVisible();

  await page.goto('/mis-postulaciones');
  await expect(page.getByText(OFERTA).first()).toBeVisible();

  await cerrarSesion(page, persona.nombre);

  // 4. La empresa ve la postulación y abre el CV que le mandaron.
  await iniciarSesion(page, EMPRESA);
  await page.goto('/postulaciones-recibidas');
  await page.getByText(`${persona.nombre} ${persona.apellido}`).first().click();

  const panel = page.getByRole('dialog', {
    name: `Postulación de ${persona.nombre} ${persona.apellido}`,
  });
  await expect(panel).toContainText(
    'Tengo experiencia en atención al público.',
  );

  const respuesta = await abrirArchivo(
    page,
    panel.getByRole('button', { name: 'Ver' }),
  );

  expect(respuesta.status()).toBe(200);
  expect((await respuesta.body()).toString()).toContain(marca);
});
