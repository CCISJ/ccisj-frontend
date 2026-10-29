import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// Tests punta a punta: la app en un navegador de verdad, contra la API de
// verdad sobre la base de pruebas de Docker. Ver `e2e/README.md`.

// El repo del backend, al lado de este. En el CI se baja en otra carpeta.
const BACKEND = fileURLToPath(
  new URL(process.env.E2E_BACKEND ?? '../ccisj-backend', import.meta.url),
);

// Puertos propios, para no chocar con `pnpm dev` (5173) ni con la API de
// desarrollo (3000), que apunta a Supabase: los E2E escriben, y no pueden
// tocar la base del equipo.
const API = 'http://localhost:3201';
const APP = 'http://localhost:5273';

export default defineConfig({
  testDir: './e2e',
  // Los recorridos comparten la base: de a uno, cada uno con datos nuevos.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: APP,
    // Un navegador ya instalado, sin descargar el de Playwright: Edge viene
    // con Windows y Chrome está en las máquinas del CI. `E2E_CANAL` lo
    // cambia (por ejemplo `chrome`, o `chromium` después de
    // `pnpm exec playwright install chromium`).
    channel: process.env.E2E_CANAL ?? (process.env.CI ? 'chrome' : 'msedge'),
    // Como la usa el cliente: los errores de fechas aparecen a las 21.
    locale: 'es-UY',
    timezoneId: 'America/Montevideo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },

  webServer: [
    {
      command: 'pnpm e2e:api',
      cwd: BACKEND,
      url: API,
      // Levantar la base y aplicar el seed lleva un rato la primera vez.
      timeout: 180_000,
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'pnpm exec vite --port 5273 --strictPort',
      url: APP,
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
      // Gana sobre el `.env`, que apunta a la API de desarrollo.
      env: { VITE_API_URL: API },
    },
  ],
});
