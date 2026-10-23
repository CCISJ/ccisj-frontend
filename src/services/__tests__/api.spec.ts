// `apiFetch` es el único lugar por donde el frontend habla con el backend:
// lo que se rompa acá se rompe en todas las pantallas a la vez.
import { afterEach, describe, expect, it, vi } from 'vitest';

import { apiFetch, setUnauthorizedHandler } from '@/services/api';

function stubFetch(response: Response) {
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) =>
    response.clone(),
  );

  vi.stubGlobal('fetch', fetch);

  return fetch;
}

function sentHeaders(fetch: ReturnType<typeof stubFetch>) {
  return fetch.mock.calls[0]?.[1]?.headers as Headers;
}

describe('apiFetch', () => {
  afterEach(() => {
    setUnauthorizedHandler(() => {});
  });

  it('manda la cookie de sesión y arma la URL con VITE_API_URL', async () => {
    const fetch = stubFetch(Response.json({ ok: true }));

    await expect(apiFetch('/socios')).resolves.toEqual({ ok: true });

    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0]?.[0]).toBe('http://api.test/socios');
    // Sin esto el navegador no manda la cookie httpOnly y toda pantalla
    // con sesión daría 401.
    expect(fetch.mock.calls[0]?.[1]?.credentials).toBe('include');
  });

  it('un llamador no puede sacar la cookie pasando otro `credentials`', async () => {
    const fetch = stubFetch(Response.json({}));

    await apiFetch('/socios', { credentials: 'omit' });

    expect(fetch.mock.calls[0]?.[1]?.credentials).toBe('include');
  });

  it('pone JSON por defecto y respeta el Content-Type del llamador', async () => {
    let fetch = stubFetch(Response.json({}));
    await apiFetch('/socios', { method: 'POST', body: '{}' });
    expect(sentHeaders(fetch).get('Content-Type')).toBe('application/json');

    fetch = stubFetch(Response.json({}));
    await apiFetch('/x', {
      headers: new Headers({ 'Content-Type': 'text/plain', 'X-Otra': '1' }),
    });
    expect(sentHeaders(fetch).get('Content-Type')).toBe('text/plain');
    expect(sentHeaders(fetch).get('X-Otra')).toBe('1');
  });

  it('no pone Content-Type al subir un archivo', async () => {
    // El navegador lo arma solo con el `boundary` del multipart. Si se
    // fijara a mano, el backend no podría separar las partes y ninguna
    // subida (CV, comprobantes) llegaría.
    const fetch = stubFetch(Response.json({}));
    const body = new FormData();
    body.append('archivo', new Blob(['%PDF']), 'cv.pdf');

    await apiFetch('/cv', { method: 'POST', body });

    expect(sentHeaders(fetch).has('Content-Type')).toBe(false);
  });

  it('muestra el mensaje del backend o uno genérico si no hay', async () => {
    stubFetch(
      Response.json({ message: 'Socio no encontrado' }, { status: 404 }),
    );
    await expect(apiFetch('/socios/9')).rejects.toThrow('Socio no encontrado');

    // Un 502 de un proxy, por ejemplo, viene en HTML y no en JSON.
    stubFetch(new Response('<html>Bad Gateway</html>', { status: 502 }));
    await expect(apiFetch('/socios')).rejects.toThrow(
      'Error al comunicarse con el servidor',
    );
  });

  it('un 204 no intenta leer un cuerpo que no existe', async () => {
    stubFetch(new Response(null, { status: 204 }));

    await expect(
      apiFetch('/socios/9', { method: 'DELETE' }),
    ).resolves.toBeUndefined();
  });

  describe('un 401', () => {
    function unauthorized() {
      return Response.json({ message: 'No autenticado' }, { status: 401 });
    }

    it('en medio del uso avisa que la sesión venció', async () => {
      const handler = vi.fn();
      setUnauthorizedHandler(handler);
      stubFetch(unauthorized());

      await expect(apiFetch('/socios')).rejects.toThrow('No autenticado');

      expect(handler).toHaveBeenCalledOnce();
    });

    it.each(['/auth/login', '/auth/me'])(
      'en %s es la respuesta esperada y no echa a nadie',
      async (endpoint) => {
        // Contraseña incorrecta, o la consulta "¿hay sesión?" sin sesión:
        // si esto llamara al handler, el login no podría mostrar su error.
        const handler = vi.fn();
        setUnauthorizedHandler(handler);
        stubFetch(unauthorized());

        await expect(apiFetch(endpoint)).rejects.toThrow();

        expect(handler).not.toHaveBeenCalled();
      },
    );

    it('un 403 no es una sesión vencida', async () => {
      const handler = vi.fn();
      setUnauthorizedHandler(handler);
      stubFetch(Response.json({ message: 'Sin permiso' }, { status: 403 }));

      await expect(apiFetch('/caja')).rejects.toThrow('Sin permiso');

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
