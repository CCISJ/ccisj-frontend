# CCISJ Frontend

Frontend del sistema de gestión del **Centro Comercial e Industrial de San José (CCISJ)**.

La aplicación forma parte de un sistema compuesto por:

- Frontend en Vue + TypeScript.
- Backend en Node.js + Express + TypeScript.
- Base de datos PostgreSQL en Supabase.
- Docker para estandarizar el entorno de desarrollo.
- pnpm como gestor de paquetes.

---

## Tecnologías principales

- Vue 3
- TypeScript
- Vite
- Vue Router
- Pinia
- pnpm
- Docker / Docker Compose

---

## Estructura general

Los repositorios de frontend y backend deben estar ubicados como carpetas hermanas:

```text
CCISJ/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   └── ...
│
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── pnpm-lock.yaml
    ├── src/
    └── ...
```

---

# Requisitos

## Opción recomendada: Docker

Para ejecutar el proyecto usando Docker solamente se necesita:

- Git
- Docker Desktop

Docker se encarga de Node.js, pnpm y las dependencias.

## Ejecución sin Docker

Para ejecutar el frontend directamente en el sistema se necesita:

- Node.js
- pnpm

---

# Instalación

## 1. Clonar los repositorios

Crear una carpeta para el proyecto:

```bash
mkdir CCISJ
cd CCISJ
```

Clonar el backend:

```bash
git clone https://github.com/CCISJ/ccisj-backend.git backend
```

Clonar el frontend:

```bash
git clone https://github.com/CCISJ/ccisj-frontend.git frontend
```

La estructura debe quedar:

```text
CCISJ/
├── backend/
└── frontend/
```

---

# Ejecutar con Docker

Desde la carpeta raíz `CCISJ`, donde se encuentra `docker-compose.yml`:

```bash
docker compose up --build
```

Una vez iniciado:

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:3000
```

Para detener los contenedores:

```bash
docker compose down
```

Para volver a iniciarlos:

```bash
docker compose up
```

---

# Desarrollo con Docker

El código del frontend está montado mediante un volumen de Docker.

Por lo tanto, para cambios normales en archivos `.vue`, `.ts`, `.css`, etc. no es necesario reconstruir la imagen.

Simplemente mantener los contenedores levantados:

```bash
docker compose up
```

y trabajar normalmente.

Vite detectará los cambios automáticamente mediante Hot Module Replacement (HMR).

## ¿Cuándo usar `--build`?

Ejecutar:

```bash
docker compose up --build
```

cuando se modifiquen archivos relacionados con dependencias o configuración del entorno, por ejemplo:

```text
package.json
pnpm-lock.yaml
Dockerfile
pnpm-workspace.yaml
```

---

# Ejecutar frontend sin Docker

Instalar las dependencias:

```bash
pnpm install
```

Iniciar el servidor de desarrollo:

```bash
pnpm dev
```

La aplicación estará disponible normalmente en:

```text
http://localhost:5173
```

---

# Build

Para generar la versión de producción:

```bash
pnpm build
```

Los archivos generados se almacenan en:

```text
dist/
```

La carpeta `dist` no debe subirse al repositorio.

---

# Preview de producción

Para probar localmente el build generado:

```bash
pnpm preview
```

---

# Estructura del proyecto

La estructura principal del frontend es:

```text
src/
├── assets/
├── components/
├── views/
├── router/
├── stores/
├── services/
├── composables/
├── types/
├── utils/
├── App.vue
└── main.ts
```

### `components`

Componentes reutilizables de interfaz.

### `views`

Pantallas principales de la aplicación.

Ejemplos:

```text
Dashboard
Socios
Postulantes
Ofertas
Postulaciones
```

### `router`

Configuración de Vue Router y rutas de la aplicación.

### `stores`

Estado global utilizando Pinia.

### `services`

Comunicación con el backend mediante HTTP.

Ejemplo:

```text
usuario.service.ts
oferta.service.ts
postulacion.service.ts
```

### `composables`

Lógica reutilizable utilizando Composition API.

### `types`

Tipos e interfaces TypeScript compartidos.

### `utils`

Funciones auxiliares reutilizables.

---

# Comunicación con el backend

El frontend consume la API REST del backend.

En desarrollo:

```text
Frontend
http://localhost:5173

        ↓ HTTP

Backend
http://localhost:3000
```

Las llamadas al backend deberán centralizarse en:

```text
src/services/
```

para evitar realizar peticiones HTTP directamente desde las vistas.

---

# Scripts disponibles

| Comando        | Descripción                          |
| -------------- | ------------------------------------ |
| `pnpm dev`     | Inicia Vite en modo desarrollo       |
| `pnpm build`   | Genera el build de producción        |
| `pnpm preview` | Ejecuta localmente el build generado |

---

# Flujo recomendado de desarrollo

Actualizar el repositorio:

```bash
git pull
```

Crear una nueva rama:

```bash
git switch -c feat/nombre-funcionalidad
```

Realizar los cambios y luego:

```bash
git add .
git commit -m "feat: descripción del cambio"
git push -u origin feat/nombre-funcionalidad
```

Finalmente crear un Pull Request hacia:

```text
main
```

La rama `main` está protegida y los cambios deben incorporarse mediante Pull Request.

Después del merge se recomienda eliminar la rama utilizada.

---

# Convención de ramas

Ejemplos:

```text
feat/login
feat/job-offers
feat/applications
fix/login-error
refactor/user-service
docs/readme
chore/docker-config
```

---

# Notas importantes

- No subir `node_modules`.
- No subir `dist`.
- No subir archivos `.env`.
- Mantener las peticiones HTTP dentro de `services`.
- Evitar lógica compleja dentro de las vistas.
- Reutilizar componentes cuando tenga sentido.
- Utilizar TypeScript en todo el proyecto.
- Los cambios deben ingresar a `main` mediante Pull Request.
