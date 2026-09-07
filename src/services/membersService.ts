import type { Member } from '@/types/member.type';
import { apiFetch } from './api';

console.log('GET MEMBERS EJECUTADO');

export function getMembers() {
  console.log('MEMBERS SERVICE CARGADO');
  return apiFetch<Member[]>('/socios');
}
