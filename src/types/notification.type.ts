export type NotificationType = 'NORMAL' | 'EMERGENTE';

export type NotificationRecipientType =
  | 'TODOS'
  | 'SOCIOS'
  | 'POSTULANTES'
  | 'USUARIOS';

export type NotificationUser = {
  id: number;
  email: string;
  tipo: 'ADMIN' | 'SOCIO' | 'POSTULANTE';
};

export type NotificationRecipient = {
  id: number;
  leida: boolean;
  fechaLectura: string | null;
  emergenteVista: boolean;
  fechaEmergenteVista: string | null;
  usuario: NotificationUser;
};

export type Notification = {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: NotificationType;
  fechaCreacion: string;
  creadoPorId: number;

  creadoPor: NotificationUser;

  destinatarios: NotificationRecipient[];
};

export type ReceivedNotification = {
  id: number;
  notificacionId: number;
  usuarioId: number;

  leida: boolean;
  fechaLectura: string | null;

  emergenteVista: boolean;
  fechaEmergenteVista: string | null;

  notificacion: Notification;
};

export type CreateNotificationData = {
  titulo: string;
  mensaje: string;
  tipo: NotificationType;
  destinatarioTipo: NotificationRecipientType;
  usuarioIds?: number[];
};

export type NotificationAvailableRecipient = {
  id: number;
  email: string;
  tipo: 'SOCIO' | 'POSTULANTE';
  socio: {
    razonSocial: string;
  } | null;
  postulante: {
    nombre: string;
    apellido: string;
  } | null;
};
