import type { CreateMemberData, Member } from '@/types/member.type';
import { apiFetch } from './api';

export function getMembers() {
  return apiFetch<Member[]>('/socios');
}

export function createMember(data: CreateMemberData) {
  return apiFetch<Member>('/socios', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
