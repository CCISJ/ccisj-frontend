# Tests punta a punta (E2E)

Recorridos completos en un navegador de verdad, con Playwright: la app de este
repo contra la API del backend, sobre la base de pruebas de Docker.

```bash
pnpm test:e2e
```

Hace falta:

- el repo del backend **al lado de este** (`../ccisj-backend`), con
  `pnpm install` hecho. Otra carpeta se indica con `E2E_BACKEND`;
- Docker corriendo: la API usa la base de pruebas (`pnpm test:db` del backend);
- Microsoft Edge, que viene con Windows. Con otro navegador:
  `E2E_CANAL=chrome pnpm test:e2e`, o el de Playwright con
  `pnpm exec playwright install chromium` y `E2E_CANAL=chromium`.

Playwright levanta todo solo (`playwright.config.ts`) y lo apaga al terminar:

| Qué | Dónde | Cómo |
| --- | --- | --- |
| API | `localhost:3201` | `pnpm e2e:api` del backend: `NODE_ENV=test`, base de Docker |
| Storage falso | `127.0.0.1:3202` | lo arranca `pnpm e2e:api`; los archivos no salen de la máquina |
| App | `localhost:5273` | `vite` con `VITE_API_URL` apuntando a la API de arriba |

Son puertos propios a propósito: `pnpm dev` (5173) y la API de desarrollo
(3000) usan la base de Supabase del equipo, y estos tests **escriben**. Si ya
hay algo corriendo en esos puertos, Playwright lo reutiliza.

## Los recorridos

| Archivo | Qué recorre |
| --- | --- |
| `login.spec.ts` | Sin sesión manda al login; contraseña incorrecta; entrar y cerrar sesión (y que la sesión se cierre de verdad) |
| `socios.spec.ts` | La administración da de alta un socio, y el socio entra con la contraseña inicial que se le mostró |
| `cuotas.spec.ts` | Generar las cuotas del mes, pagar con tarjeta (el comprobante es obligatorio) y abrir el comprobante |
| `postulacion.spec.ts` | Alguien se registra, sube su CV en PDF y se postula; la empresa ve la postulación y abre ese PDF |
| `caja.spec.ts` | La administración registra un ingreso (el resumen del mes sube), le adjunta el comprobante y lo abre, y lo anula con motivo (queda en el historial y sale del resumen) |
| `ofertas.spec.ts` | Una empresa publica una oferta; alguien sin sesión la encuentra en la bolsa de trabajo y la abre; la empresa la cierra y deja de verse, también por el enlace directo |
| `notificaciones.spec.ts` | La administración manda un aviso importante a un socio puntual: le aparece en una ventana al entrar, queda sin leer hasta que lo abre, y otro socio no lo ve |

`apoyo.ts` tiene lo que comparten: las cuentas del seed, `iniciarSesion`,
`altaDeSocio` (por la API, devuelve la contraseña inicial), `otroNavegador`
(otra sesión a la vez, para ver lo mismo desde dos cuentas), `abrirArchivo` e
`importe` (lee un monto como lo muestra la pantalla).

Corren de a uno (`workers: 1`) y cada uno crea sus datos con un sufijo único,
así que se pueden correr varias veces sobre la misma base. Las cuentas fijas
son las del seed del backend (`admin@ccisj.uy`, `empresa@ccisj.uy`).

## En el CI

El job "E2E (Playwright)" de `.github/workflows/ci.yml` los corre en cada PR
con Chrome, contra el `main` del backend. No es un chequeo obligatorio: un PR
que necesita un cambio del backend todavía sin mergear va a estar en rojo
hasta que ese cambio entre. Si falla, las capturas y trazas quedan en el
artefacto `e2e-resultados` de la corrida.

## Contra la preproducción

Los mismos recorridos corren contra el sistema armado como en producción: la
preproducción local del backend (`pnpm preprod` allá), con HTTPS, las imágenes
de producción y la CSP real. Es la regresión de la fase 9.

```bash
E2E_URL=https://ccisj.localhost:8443 E2E_API=https://ccisj.localhost:8443/api pnpm test:e2e
```

Con `E2E_URL`, Playwright no levanta nada: usa lo que ya está corriendo y
acepta el certificado local de Caddy. Como los recorridos **crean datos**, solo
acepta destinos locales. Otro destino exige `E2E_DESTINO_REMOTO=1`, y tiene que
ser un entorno de prueba, nunca la base real.

## Cuando uno falla

Queda una captura y una traza en `test-results/`. La traza muestra cada paso
con el DOM y la red:

```bash
pnpm exec playwright show-trace test-results/<carpeta>/trace.zip
```

Para verlos en el navegador mientras corren: `pnpm test:e2e --headed`, o
`--ui` para ir paso a paso.

## Cómo sabemos que sirven

Se rompió la app a propósito, de a una cosa, y algún recorrido falló cada vez:

- el guard deja entrar sin sesión → fallan los dos de login que lo esperan;
- el pago con tarjeta se puede confirmar sin comprobante → falla el de cuotas;
- la postulación no manda el PDF elegido → falla el de postulación (la
  empresa no tiene qué abrir).
