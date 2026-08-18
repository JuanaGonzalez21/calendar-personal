export type Categoria =
  | "estudio"
  | "proyecto"
  | "postulaciones"
  | "perros"
  | "casa"
  | "salud"
  | "salidas"
  | "otros";

export type GrupoRacha = "general" | "personal";

export type TipoDia = "A_cocina" | "B_gym" | "B_libre" | "roto";

export interface Dia {
  id: string;
  user_id: string;
  fecha: string;
  tipo: TipoDia;
  template_id: string | null;
  es_roto: boolean;
  nota: string | null;
}

export interface Tarea {
  id: string;
  day_id: string;
  titulo: string;
  categoria: Categoria;
  grupo: GrupoRacha;
  hora: string | null;
  duracion_min: number | null;
  orden: number;
  peso: number;
  es_minimo: boolean;
  aviso_min: number | null;
  hecha: boolean;
  hecha_at: string | null;
}

export interface Settings {
  user_id: string;
  bellaface_inicio: string | null;
  meta_postulaciones_sem: number;
  meta_gym_sem: number;
  min_gym_sem: number;
  umbral_cumplida: number;
  umbral_parcial: number;
}

/* ---------------------------- POSTULACIONES ---------------------------- */

export type Fase =
  | "entregada"
  | "entrevista_rrhh"
  | "prueba_tecnica"
  | "propuesta";

export type EstadoProceso = "en_proceso" | "cerrada" | "sin_respuesta";

export interface Postulacion {
  id: string;
  empresa: string;
  cargo: string | null;
  fuente: string | null;
  url: string | null;
  fecha: string;
  fase: Fase;
  estado: EstadoProceso;
  ultimo_movimiento: string;
  nota: string | null;
}

export const NOMBRE_FASE: Record<Fase, string> = {
  entregada: "Hoja de vida entregada",
  entrevista_rrhh: "Entrevista RRHH",
  prueba_tecnica: "Prueba técnica",
  propuesta: "Propuesta laboral",
};

export const FASE_CORTA: Record<Fase, string> = {
  entregada: "HV",
  entrevista_rrhh: "RRHH",
  prueba_tecnica: "Prueba",
  propuesta: "Propuesta",
};

export const ORDEN_FASES: Fase[] = [
  "entregada",
  "entrevista_rrhh",
  "prueba_tecnica",
  "propuesta",
];

export const NOMBRE_ESTADO: Record<EstadoProceso, string> = {
  en_proceso: "En proceso",
  cerrada: "Cerrada",
  sin_respuesta: "Sin respuesta",
};

/* ------------------------------- CURSOS -------------------------------- */

export interface Curso {
  id: string;
  nombre: string;
  plataforma: string | null;
  url: string | null;
  prioridad: number;
  activo: boolean;
}

export interface CursoConTiempo extends Curso {
  minutosTotal: number;
  minutosSemana: number;
}

/* ------------------------------- COLORES ------------------------------- */

export const NOMBRE_TIPO: Record<TipoDia, string> = {
  A_cocina: "Cocina",
  B_gym: "Gym",
  B_libre: "Libre",
  roto: "Roto",
};

/** Color de acento por categoría (clases de Tailwind). */
export const COLOR_CATEGORIA: Record<Categoria, string> = {
  estudio: "bg-sky-400",
  proyecto: "bg-violet-400",
  postulaciones: "bg-lime-400",
  perros: "bg-amber-400",
  casa: "bg-neutral-500",
  salud: "bg-rose-400",
  salidas: "bg-teal-400",
  otros: "bg-neutral-600",
};

/** Formatea minutos como "3 h 20 min". */
export function formatoTiempo(minutos: number): string {
  if (minutos <= 0) return "0 min";
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
