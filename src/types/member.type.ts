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

/**
 * La empresa del socio de la sesión (`GET /socios/me`): toda la ficha menos
 * las observaciones internas. `usuario.email` es el email con el que inicia
 * sesión, que el socio no puede cambiar.
 */
export type OwnMember = Omit<
  Member,
  'usuarioId' | 'observaciones' | 'usuario'
> & {
  usuario: { email: string };
};

// Lo único que el socio puede modificar de su empresa.
export type OwnMemberEditableField =
  'telefono' | 'celular' | 'email' | 'direccion' | 'ciudad' | 'numeroBps';

export type UpdateOwnMemberData = Partial<
  Pick<OwnMember, OwnMemberEditableField>
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

// Lo que devuelve `POST /socios`. La contraseña inicial se muestra una sola vez.
export type CreateMemberResponse = {
  message: string;
  socioId: number;
  email: string;
  passwordInicial: string;
};
