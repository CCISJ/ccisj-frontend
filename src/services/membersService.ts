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
