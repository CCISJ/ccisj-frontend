// Matriz de acceso a las pantallas: cada ruta × cada tipo de usuario.
//
// El control real lo hace el backend (su propia matriz prueba los endpoints
// con los mismos cinco actores). El guard del router solo evita mostrar
// pantallas que igual darían 403, pero si se equivoca, un postulante ve la
// caja vacía o un socio común el directorio: eso es lo que se prueba acá.
//
// La tabla `ACCESO` tiene que nombrar todas las rutas. Si alguien agrega una
// ruta sin declararla, falla el primer test: obliga a decidir quién la ve.
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MeResponse } from '@/types/auth.type';

type Actor = 'anonimo' | 'postulante' | 'empresa' | 'directivo' | 'admin';

const ACTORES: Actor[] = [
  'anonimo',
  'postulante',
  'empresa',
  'directivo',
  'admin',
];

// Lo que contesta `/auth/me` para cada uno; `null` es un 401 (sin sesión).
const SESIONES: Record<Actor, MeResponse['user'] | null> = {
  anonimo: null,
  postulante: {
    id: 1,
    email: 'postulante@ccisj.uy',
    tipo: 'POSTULANTE',
    displayName: 'Postulante',
    memberType: null,
  },
  empresa: {
    id: 2,
    email: 'empresa@ccisj.uy',
    tipo: 'SOCIO',
    displayName: 'Empresa',
    memberType: 'COMUN',
  },
  directivo: {
    id: 3,
    email: 'directivo@ccisj.uy',
    tipo: 'SOCIO',
    displayName: 'Directivo',
    memberType: 'DIRECTIVO',
  },
  admin: {
    id: 4,
    email: 'admin@ccisj.uy',
    tipo: 'ADMIN',
    displayName: 'Administración',
    memberType: null,
  },
};

const SOCIOS: Actor[] = ['empresa', 'directivo'];
const CON_SESION: Actor[] = ['postulante', 'empresa', 'directivo', 'admin'];

// Ruta → una URL concreta para navegar y quiénes pueden entrar.
const ACCESO: Record<string, { url: string; entran: Actor[] }> = {
  login: { url: '/login', entran: ['anonimo'] },
  registro: { url: '/registro', entran: ['anonimo'] },
  home: { url: '/', entran: CON_SESION },

  socios: { url: '/socios', entran: ['directivo', 'admin'] },
  'socio-detalle': { url: '/socios/7', entran: ['directivo', 'admin'] },
  'socio-nuevo': { url: '/socios/nuevo', entran: ['admin'] },
  'socio-editar': { url: '/socios/7/editar', entran: ['admin'] },
  'mi-empresa': { url: '/mi-empresa', entran: SOCIOS },

  ofertas: { url: '/ofertas', entran: ['anonimo', 'postulante'] },
  'oferta-detalle': { url: '/ofertas/12', entran: ['anonimo', 'postulante'] },
  'mis-postulaciones': { url: '/mis-postulaciones', entran: ['postulante'] },
  'mi-perfil': { url: '/mi-perfil', entran: ['postulante'] },
  'mi-cv': { url: '/mi-cv', entran: ['postulante'] },

  'mis-ofertas': { url: '/mis-ofertas', entran: SOCIOS },
  'mis-ofertas-nueva': { url: '/mis-ofertas/nueva', entran: SOCIOS },
  'mis-ofertas-editar': { url: '/mis-ofertas/3/editar', entran: SOCIOS },
  'postulaciones-recibidas': {
    url: '/postulaciones-recibidas',
    entran: SOCIOS,
  },

  notificaciones: { url: '/notificaciones', entran: CON_SESION },
  'mi-cuenta': { url: '/mi-cuenta', entran: CON_SESION },

  cuotas: { url: '/cuotas', entran: ['admin'] },
  caja: { url: '/caja', entran: ['admin'] },

  'not-found': { url: '/no-existe', entran: CON_SESION },
};

let meCalls = 0;

function stubSession(actor: Actor) {
  meCalls = 0;

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (!url.endsWith('/auth/me')) {
        throw new Error(`El guard no debería pedir ${url}`);
      }

      meCalls++;
      const user = SESIONES[actor];

      return user
        ? Response.json({ user })
        : Response.json({ message: 'No autenticado' }, { status: 401 });
    }),
  );
}

// Un router y un store nuevos por test, como al abrir la app en una pestaña
// nueva: si no, la sesión y la ruta actual del test anterior se arrastran.
async function freshRouter() {
  vi.resetModules();

  const { createPinia, setActivePinia } = await import('pinia');
  setActivePinia(createPinia());

  const { default: router } = await import('@/router');

  return router;
}

async function visit(actor: Actor, url: string) {
  stubSession(actor);
  const router = await freshRouter();

  // `/login` es la única pantalla que no consulta la sesión antes de
  // mostrarse. Quien ya entró llega ahí con la sesión cargada (desde otra
  // pantalla), así que primero se pasa por el inicio.
  if (url === '/login' && actor !== 'anonimo') {
    await router.push('/');
  }

  await router.push(url);

  return router.currentRoute.value.fullPath;
}

describe('guard del router', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('la tabla declara todas las rutas con nombre', async () => {
    stubSession('anonimo');
    const router = await freshRouter();

    const names = router
      .getRoutes()
      .map((route) => route.name)
      .filter((name): name is string => typeof name === 'string')
      .sort();

    expect(names).toEqual(Object.keys(ACCESO).sort());
  });

  const casos = Object.entries(ACCESO).flatMap(([name, { url, entran }]) =>
    ACTORES.map((actor) => ({
      name,
      url,
      actor,
      entra: entran.includes(actor),
    })),
  );

  it.each(casos)(
    '$name ($url) — $actor: entra = $entra',
    async ({ url, actor, entra }) => {
      const destino = await visit(actor, url);

      // A quien no tiene sesión se lo manda al login; a quien sí la tiene
      // pero no le corresponde, al inicio de su rol.
      const rechazo = actor === 'anonimo' ? '/login' : '/';

      expect(destino).toBe(entra ? url : rechazo);
    },
  );

  it('consulta la sesión una sola vez aunque se navegue varias', async () => {
    stubSession('admin');
    const router = await freshRouter();

    await router.push('/socios');
    await router.push('/cuotas');
    await router.push('/caja');

    expect(router.currentRoute.value.fullPath).toBe('/caja');
    expect(meCalls).toBe(1);
  });
});
