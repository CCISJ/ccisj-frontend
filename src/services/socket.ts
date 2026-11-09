import { type Socket, io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;

let socket: Socket | null = null;

export function connectSocket(): Socket {
  if (socket) return socket;

  socket = io(API_URL, {
    withCredentials: true,
    autoConnect: false,
    transports: ['websocket', 'polling'],
  });

  socket.connect();

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
