export type EducationType = 'CURRICULAR' | 'NO_CURRICULAR';
export type ReferenceType = 'LABORAL' | 'PERSONAL';

export type CvEducation = {
  id?: number;
  tipo: EducationType;
  institucion: string;
  titulo: string;
  // "AAAA-MM" en el formulario; el backend devuelve la fecha completa.
  fechaInicio: string | null;
  fechaFin: string | null;
  enCurso: boolean;
  descripcion: string | null;
};

export type CvExperience = {
  id?: number;
  empresa: string;
  cargo: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  actual: boolean;
  tareas: string | null;
};

export type CvReference = {
  id?: number;
  tipo: ReferenceType;
  nombre: string;
  relacion: string | null;
  telefono: string | null;
  email: string | null;
};

/** Un PDF subido. Se abre con un enlace firmado que se pide al hacer clic. */
export type CvFile = {
  id: number;
  nombreArchivo: string | null;
  descripcion: string | null;
  fechaActualizacion: string;
};

/** El CV completo (`GET /postulantes/me/cv`). */
export type Cv = {
  id: number;
  nombre: string;
  apellido: string;
  telefono: string | null;
  direccion: string | null;
  fechaNacimiento: string | null;
  otros: string | null;
  usuario: { email: string };
  estudios: CvEducation[];
  experiencias: CvExperience[];
  referencias: CvReference[];
  // Categorías de las que quiere recibir ofertas; vacía = todas.
  categorias: { categoria: { id: number; nombre: string } }[];
  // El más reciente primero.
  cvs: CvFile[];
};

export type CvData = Omit<Cv, 'id' | 'usuario' | 'cvs' | 'categorias'>;

/** Lo que se edita en "Mi perfil" (`PATCH /postulantes/me/perfil`). */
export type ProfileData = {
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  fechaNacimiento: string;
  // Vacía = todas.
  categoriaIds: number[];
};
