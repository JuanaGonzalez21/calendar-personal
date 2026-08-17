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
