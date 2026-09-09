export type MemberType = 'DIRECTIVO' | 'COMUN';

export type Member = {
  id: number;
  usuarioId: number;
  razonSocial: string;
  titular: string;
  giroComercial: string;
  tipo: MemberType;
  rut: string;
  numeroBps: string;
  fechaInicioEmpresa: string;
  fechaAfiliacion: string;
  direccion: string;
  ciudad: string;
  celular: string;
  telefono: string;
  email: string;
  observaciones: string | null;

  usuario: {
    id: number;
    email: string;
    activo: boolean;
  };
};

export type CreateMemberData = {
  razonSocial: string;
  titular: string;
  giroComercial: string;
  tipo: MemberType;
  rut: string;
  numeroBps: string;
  fechaInicioEmpresa: string;
  fechaAfiliacion: string;
  direccion: string;
  ciudad: string;
  celular: string;
  telefono: string;
  email: string;
  observaciones?: string;
};

export type CreateMemberResponse = {
  socio: Member;
  passwordInicial: string;
};
