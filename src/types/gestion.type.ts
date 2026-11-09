/** Un archivo de una gestión. La ruta en Storage nunca llega al navegador. */
export type ArchivoGestion = {
  id: number;
  nombre: string;
  tipo: string;
  tamano: number;
  fechaSubida: string;
};

/** Una gestión en la lista (`GET /gestiones`). */
export type GestionResumen = {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  cantidadArchivos: number;
};

/** La ficha de una gestión (`GET /gestiones/:id`). */
export type Gestion = Omit<GestionResumen, 'cantidadArchivos'> & {
  archivos: ArchivoGestion[];
};

export type GestionData = {
  titulo: string;
  descripcion: string;
  categoria: string;
};

export type CategoriaGestion = {
  nombre: string;
  cantidad: number;
};
