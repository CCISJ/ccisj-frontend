/// <reference lib="dom" />
// `page.evaluate` corre en el navegador: ahí existe `document`.
/**
 * Dos chequeos que recorren todas las pantallas de cada rol, en vez de una
 * por una:
 *
 * - **Nada se desborda en un celular.** El rediseño agrandó la letra, y una
 *   tabla o un texto oculto mal contenido ensanchaba la página entera: había
 *   que deslizar de costado para leer.
 * - **Accesibilidad automática con axe** (WCAG 2.1 A y AA): contraste,
 *   etiquetas de los campos, nombres de los botones, estructura. Falla con
 *   los problemas graves y críticos; axe no reemplaza probar con un lector de
 *   pantalla, pero atrapa lo que se rompe sin que nadie lo vea.
 */
import AxeBuilder from '@axe-core/playwright';
import { type Page, expect, test } from '@playwright/test';

import { ADMIN, DIRECTIVO, EMPRESA, POSTULANTE, iniciarSesion } from './apoyo';

const PANTALLAS = {
  administración: {
    cuenta: ADMIN,
    rutas: [
      '/',
      '/socios',
      '/cuotas',
      '/caja',
      '/notificaciones',
      '/ofertas',
      '/ofertas/nueva',
      '/candidatos',
      '/gestoria',
      '/gestoria/nueva',
      '/mi-cuenta',
    ],
  },
  empresa: {
    cuenta: EMPRESA,
    rutas: [
      '/',
      '/mi-empresa',
      '/mis-ofertas',
      '/postulaciones-recibidas',
      '/notificaciones',
    ],
  },
  directivo: {
    cuenta: DIRECTIVO,
    rutas: ['/', '/socios', '/candidatos', '/gestoria'],
  },
  postulante: {
    cuenta: POSTULANTE,
    rutas: ['/', '/ofertas', '/mis-postulaciones', '/mi-cv', '/mi-perfil'],
  },
};

async function abrir(page: Page, ruta: string) {
  await page.goto(ruta);
  await page.waitForLoadState('networkidle');
}

test.describe('sin sesión', () => {
  for (const ruta of ['/login', '/registro', '/ofertas']) {
    test(`${ruta}: accesible y sin desbordes en un celular`, async ({
      page,
    }) => {
      await abrir(page, ruta);
      expect(await problemasDeAccesibilidad(page)).toEqual([]);

      await page.setViewportSize({ width: 390, height: 844 });
      await abrir(page, ruta);
      expect(await desborde(page)).toBe(0);
    });
  }
});

/** Cuántos píxeles la página es más ancha que la pantalla. */
function desborde(page: Page) {
  return page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  );
}

async function problemasDeAccesibilidad(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // El botón de Vue DevTools: solo existe con `vite` en desarrollo.
    .exclude('[id^="__vue-devtools"]')
    .analyze();

  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map(
      (v) =>
        `${v.id}: ${v.help} (${v.nodes
          .slice(0, 3)
          .map((n) => n.target.join(' '))
          .join(' | ')})`,
    );
}

for (const [rol, { cuenta, rutas }] of Object.entries(PANTALLAS)) {
  test.describe(rol, () => {
    test('ninguna pantalla se desborda en un celular', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await iniciarSesion(page, cuenta);

      const desbordadas: string[] = [];

      for (const ruta of rutas) {
        await abrir(page, ruta);
        const px = await desborde(page);

        if (px > 0) desbordadas.push(`${ruta} (+${px} px)`);
      }

      expect(desbordadas).toEqual([]);
    });

    test('ninguna pantalla tiene problemas de accesibilidad graves', async ({
      page,
    }) => {
      await iniciarSesion(page, cuenta);

      const problemas: string[] = [];

      for (const ruta of rutas) {
        await abrir(page, ruta);

        for (const problema of await problemasDeAccesibilidad(page)) {
          problemas.push(`${ruta} → ${problema}`);
        }
      }

      expect(problemas).toEqual([]);
    });
  });
}
