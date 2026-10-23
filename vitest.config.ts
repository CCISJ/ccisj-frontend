import vue from '@vitejs/plugin-vue';
import { URL, fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Los tests corren en hora de Uruguay, como la usa el cliente. Sin esto, en la
// máquina del CI (que está en UTC) un error de un día en las fechas pasaría de
// largo: justamente el que aparece solo al restar tres horas. Va acá y no en
// `test.env` porque la zona horaria se fija al arrancar cada proceso de tests,
// y estos procesos heredan el entorno de este.
process.env.TZ = 'America/Montevideo';

// Aparte de vite.config.ts para no cargar en los tests los plugins que solo
// sirven al navegador (devtools, tailwind).
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/__tests__/*.spec.ts'],
    // `services/api.ts` arma cada URL con esto. Un dominio que no existe:
    // ningún test sale a la red, todos reemplazan `fetch`.
    env: {
      VITE_API_URL: 'http://api.test',
    },
    unstubGlobals: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/__tests__/**', 'src/types/**'],
      reporter: ['text-summary', 'lcov'],
    },
  },
});
