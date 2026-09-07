export type MemberType = 'DIRECTIVO' | 'COMUN';

export type Member = {
  id: number;
  usuarioId: number;
  nombre: string;
  rut: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  tipo: 'COMUN' | 'DIRECTIVO';
  activo: boolean;
  usuario: {
    id: number;
    email: string;
    activo: boolean;
  };
};
