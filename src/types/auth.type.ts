import type { MemberType } from './member.type';
import type { UserRole } from './user.type';

export type AuthUser = {
  id: number;
  displayName: string;
  email: string;
  role: UserRole;
  memberType: MemberType | null;
};

export type RegisterData = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  // Categorías de las que recibir ofertas; vacía = todas.
  categoriaIds: number[];
};

export type MeResponse = {
  user: {
    id: number;
    email: string;
    tipo: UserRole;
    displayName: string;
    memberType: MemberType | null;
  };
};
