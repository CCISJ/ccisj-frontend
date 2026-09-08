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
  activo: boolean;

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

/**
 * `POST /socios` no devuelve el socio pelado: devuelve el socio creado junto
 * con la contraseña inicial que hay que entregarle.
 */
export type CreateMemberResponse = {
  socio: Member;
  passwordInicial: string;
};
