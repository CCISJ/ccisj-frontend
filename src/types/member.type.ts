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

/**
 * Lo que el backend devuelve de un socio a un socio directivo: el directorio,
 * sin RUT, BPS, observaciones ni datos de la cuenta. El administrador recibe
 * el `Member` completo.
 */
export type MemberDirectoryEntry = Pick<
  Member,
  | 'id'
  | 'razonSocial'
  | 'titular'
  | 'giroComercial'
  | 'tipo'
  | 'telefono'
  | 'celular'
  | 'email'
  | 'direccion'
  | 'ciudad'
  | 'fechaAfiliacion'
>;

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
