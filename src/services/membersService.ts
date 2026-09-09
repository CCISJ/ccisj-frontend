import type {
  CreateMemberData,
  CreateMemberResponse,
  Member,
} from '@/types/member.type';
import { apiFetch } from './api';

export function getMembers() {
  return apiFetch<Member[]>('/socios');
}

export function getMember(id: number) {
  return apiFetch<Member>(`/socios/${id}`);
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
