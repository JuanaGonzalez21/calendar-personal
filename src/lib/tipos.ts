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
  /** 0-100. Secundario: el avance real se mide por sesiones de tiempo. */
  progreso: number;
  prioridad: number;
  activo: boolean;
}

/** Datos que viajan del formulario a crearCurso / actualizarCurso. */
export type DatosCurso = Pick<
  Curso,
  "nombre" | "plataforma" | "url" | "prioridad" | "progreso"
>;

export interface CursoConTiempo extends Curso {
  minutosTotal: number;
  minutosSemana: number;
}

/* ------------------------------ PLANTILLAS ----------------------------- */

export interface TareaPlantilla {
  id: string;
  template_id: string;
  titulo: string;
  categoria: Categoria;
  grupo: GrupoRacha;
  hora: string | null;
  duracion_min: number | null;
  orden: number;
  peso: number;
  es_minimo: boolean;
  aviso_min: number | null;
  activa: boolean;
}

export interface PlantillaConTareas {
  id: string;
  tipo: TipoDia;
  nombre: string;
  descripcion: string | null;
  /** Todas las tareas, activas e inactivas, ordenadas por `orden`. */
  tareas: TareaPlantilla[];
}

/**
 * Campos de una tarea de plantilla que el editor puede tocar.
 * Excluye a propósito `activa` (va por alternarTareaActiva), `orden`
 * (Etapa 3) y `template_id` (una tarea no se mueve de plantilla).
 */
export type CamposTareaPlantilla = Partial<
  Pick<
    TareaPlantilla,
    "titulo" | "hora" | "categoria" | "grupo" | "peso" | "es_minimo" | "duracion_min"
  >
>;

/**
 * La generación del día (lib/dia.ts) depende de estos títulos exactos:
 * "Bellaface" se compara con === y "Bloque 1" con startsWith.
 * Renombrarlos rompería tocaBellaface / ajustarBloque1.
 */
export function esTituloProtegido(titulo: string): boolean {
  return titulo === "Bellaface" || titulo.startsWith("Bloque 1");
}

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  estudio: "Estudio",
  proyecto: "Proyecto",
  postulaciones: "Postulaciones",
  perros: "Perros",
  casa: "Casa",
  salud: "Salud",
  salidas: "Salidas",
  otros: "Otros",
};

export const ORDEN_CATEGORIAS: Categoria[] = [
  "estudio",
  "proyecto",
  "postulaciones",
  "perros",
  "casa",
  "salud",
  "salidas",
  "otros",
];

export const NOMBRE_GRUPO: Record<GrupoRacha, string> = {
  general: "General",
  personal: "Personal",
};

export const ORDEN_GRUPOS: GrupoRacha[] = ["general", "personal"];

export const ORDEN_TIPOS: TipoDia[] = ["A_cocina", "B_gym", "B_libre", "roto"];

/* -------------------------------- PAGOS -------------------------------- */

export type CategoriaPago = "fijo" | "suscripcion" | "extra";

export type ResponsablePago = "juana" | "angel" | "compartido";

export interface Pago {
  id: string;
  concepto: string;
  monto: number | null;
  categoria: CategoriaPago;
  recurrente: boolean;
  /** Día de cobro (1-31) cuando es recurrente. */
  dia_mes: number | null;
  /** Fecha de vencimiento cuando es puntual. */
  fecha_venc: string | null;
  responsable: ResponsablePago;
  /** null = nunca pagado. En recurrentes cuenta solo si es del mes en curso. */
  pagado_at: string | null;
  nota: string | null;
}

/** Datos que viajan del formulario a crearPago / actualizarPago. */
export type DatosPago = Pick<
  Pago,
  | "concepto"
  | "monto"
  | "categoria"
  | "recurrente"
  | "dia_mes"
  | "fecha_venc"
  | "responsable"
  | "nota"
>;

export const NOMBRE_CATEGORIA_PAGO: Record<CategoriaPago, string> = {
  fijo: "Fijo",
  suscripcion: "Suscripción",
  extra: "Extra",
};

export const ORDEN_CATEGORIAS_PAGO: CategoriaPago[] = [
  "fijo",
  "suscripcion",
  "extra",
];

export const NOMBRE_RESPONSABLE: Record<ResponsablePago, string> = {
  juana: "Juana",
  angel: "Ángel",
  compartido: "Compartido",
};

export const ORDEN_RESPONSABLES: ResponsablePago[] = [
  "juana",
  "angel",
  "compartido",
];

/** "$ 1.150.000" — pesos colombianos sin decimales. */
export function formatoCOP(monto: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(monto);
}

/* ------------------------------- EVENTOS ------------------------------- */

export type TipoEvento =
  | "medica"
  | "entrevista"
  | "familiar"
  | "salida"
  | "otro";

export interface Evento {
  id: string;
  titulo: string;
  /** La UI se guía por tipo; `categoria` de la tabla queda en su default. */
  tipo: TipoEvento;
  fecha: string;
  hora: string | null;
  duracion_min: number | null;
  nota: string | null;
  /** Intención de marcar ese día como roto (la generación aún no lo lee). */
  bloquea_dia: boolean;
}

/** Datos que viajan del formulario a crearEvento / actualizarEvento. */
export type DatosEvento = Pick<
  Evento,
  "titulo" | "tipo" | "fecha" | "hora" | "duracion_min" | "nota" | "bloquea_dia"
>;

export const NOMBRE_TIPO_EVENTO: Record<TipoEvento, string> = {
  medica: "Médica",
  entrevista: "Entrevista",
  familiar: "Familiar",
  salida: "Salida",
  otro: "Otro",
};

/** Entrevista primero: es lo que más importa resaltar. */
export const ORDEN_TIPOS_EVENTO: TipoEvento[] = [
  "entrevista",
  "medica",
  "familiar",
  "salida",
  "otro",
];

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
