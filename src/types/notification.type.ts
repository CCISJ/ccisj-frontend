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

/**
 * Lo que recibe un usuario. Del creador solo llega el tipo (administración o
 * empresa), y solo en `/notificaciones/recibidas`: ni su email ni su ID.
 */
export type ReceivedNotification = {
  id: number;
  notificacionId: number;
  usuarioId: number;

  leida: boolean;
  fechaLectura: string | null;

  emergenteVista: boolean;
  fechaEmergenteVista: string | null;

  notificacion: Omit<
    Notification,
    'creadoPorId' | 'creadoPor' | 'destinatarios'
  > & {
    creadoPor?: Pick<NotificationUser, 'tipo'>;
  };
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
