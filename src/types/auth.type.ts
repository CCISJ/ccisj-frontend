import type { MemberType } from './member.type';
import type { UserRole } from './user.type';

export type AuthUser = {
  id: number;
  displayName: string;
  email: string;
  role: UserRole;
  memberType: MemberType | null;
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
