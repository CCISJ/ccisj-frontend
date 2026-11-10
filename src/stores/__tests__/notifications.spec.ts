import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as notificationsService from '@/services/notificationsService';
import { connectSocket, disconnectSocket } from '@/services/socket';

import { useNotificationsStore } from '@/stores/notifications';

/** Un socket de mentira: guarda los manejadores para dispararlos a mano. */
const fake = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => void>();

  return {
    handlers,
    socket: {
      on: (event: string, handler: (...args: unknown[]) => void) => {
        handlers.set(event, handler);
      },
      off: (event: string) => {
        handlers.delete(event);
      },
      connect: () => undefined,
    },
    emit(event: string, ...args: unknown[]) {
      handlers.get(event)?.(...args);
    },
  };
});

vi.mock('@/services/socket', () => ({
  connectSocket: vi.fn(() => fake.socket),
  disconnectSocket: vi.fn(),
}));

vi.mock('@/services/notificationsService', () => ({
  getMine: vi.fn(async () => []),
  getPendingPopups: vi.fn(async () => []),
}));

describe('notificaciones en tiempo real', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fake.handlers.clear();
    setActivePinia(createPinia());
  });

  it('al llegar un aviso vuelve a pedir la bandeja y las emergentes', async () => {
    useNotificationsStore().startRealtime();

    fake.emit('notificacion:nueva', { notificacionId: 5 });
    await vi.waitFor(() =>
      expect(notificationsService.getPendingPopups).toHaveBeenCalled(),
    );

    expect(notificationsService.getMine).toHaveBeenCalledTimes(1);
  });

  it('si el servidor corta la conexión, intenta reconectarse una vez', () => {
    const connect = vi.spyOn(fake.socket, 'connect');
    useNotificationsStore().startRealtime();

    fake.emit('disconnect', 'io server disconnect');
    expect(connect).toHaveBeenCalledTimes(1);

    // Un corte de red lo reintenta Socket.IO solo; cerrar la pestaña, nada.
    fake.emit('disconnect', 'transport close');
    fake.emit('disconnect', 'io client disconnect');
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('al cerrar sesión deja de escuchar y desconecta', () => {
    const store = useNotificationsStore();
    store.startRealtime();
    store.clear();

    expect(disconnectSocket).toHaveBeenCalled();
    expect(fake.handlers.size).toBe(0);

    // Volver a empezar abre una conexión nueva.
    store.startRealtime();
    expect(connectSocket).toHaveBeenCalledTimes(2);
  });
});
