import type {
  CreateMemberData,
  CreateMemberResponse,
  Member,
  MemberDirectoryEntry,
  OwnMember,
  UpdateOwnMemberData,
} from '@/types/member.type';
import { apiFetch } from './api';

export function isFullMember(
  member: Member | MemberDirectoryEntry,
): member is Member {
  return 'usuario' in member;
}

// El administrador recibe la ficha completa y un directivo el directorio;
// usar `isFullMember` para distinguirlos.
export function getMembers() {
  return apiFetch<(Member | MemberDirectoryEntry)[]>('/socios');
}

export function getMember(id: number) {
  return apiFetch<Member | MemberDirectoryEntry>(`/socios/${id}`);
}

export function getMyCompany() {
  return apiFetch<OwnMember>('/socios/me');
}

export function updateMyCompany(data: UpdateOwnMemberData) {
  return apiFetch<OwnMember>('/socios/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function createMember(data: CreateMemberData) {
  return apiFetch<CreateMemberResponse>('/socios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateMember(id: number, data: Partial<CreateMemberData>) {
  return apiFetch<Member>(`/socios/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteMember(id: number) {
  return apiFetch<{ message: string }>(`/socios/${id}`, {
    method: 'DELETE',
  });
}
