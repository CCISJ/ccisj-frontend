export type Candidate = {
  id: number;
  nombre: string;
  apellido: string;
  direccion: string | null;
  categorias: {
    categoria: { id: number; nombre: string };
  }[];
  estudios: { titulo: string; institucion: string }[];
  experiencias: { cargo: string; empresa: string }[];
  _count: {
    estudios: number;
    experiencias: number;
    cvs: number;
  };
};

export type CandidateResponse = {
  items: Candidate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type Category = {
  id: number;
  nombre: string;
};

export type CandidateFilters = {
  search?: string;
  categoriaId?: string;
  conEstudios?: boolean;
  conExperiencia?: boolean;
  page?: number;
  limit?: number;
};

export type CandidateDetail = {
  id: number;
  nombre: string;
  apellido: string;
  direccion: string | null;
  otros: string | null;

  categorias: {
    categoria: {
      id: number;
      nombre: string;
    };
  }[];

  estudios: {
    id: number;
    tipo: string;
    titulo: string;
    institucion: string;
    descripcion: string | null;
    fechaInicio: string | null;
    fechaFin: string | null;
    enCurso: boolean;
    orden: number;
  }[];

  experiencias: {
    id: number;
    empresa: string;
    cargo: string;
    tareas: string | null;
    fechaInicio: string | null;
    fechaFin: string | null;
    actual: boolean;
    orden: number;
  }[];

  referencias: {
    id: number;
    tipo: string;
    nombre: string;
    relacion: string | null;
    telefono: string | null;
    email: string | null;
    orden: number;
  }[];

  cvs: {
    id: number;
    nombreArchivo: string | null;
    descripcion: string | null;
    fechaActualizacion: string;
  }[];
};
