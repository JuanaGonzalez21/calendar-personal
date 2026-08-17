/**
 * Helpers de fecha · SIEMPRE en hora de Bogotá.
 *
 * Por qué existe este archivo:
 * Vercel y Supabase corren en UTC. Bogotá es UTC-5. Si usáramos
 * `new Date()` directo, a las 7 p.m. tuyas el servidor ya cree que
 * es el día siguiente y te generaría el día equivocado.
 * Todo lo que tenga que ver con "qué día es hoy" pasa por acá.
 */

const TZ = "America/Bogota";

/** Fecha de hoy en Bogotá, formato YYYY-MM-DD. */
export function hoyBogota(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Hora actual en Bogotá, formato HH:MM. */
export function horaBogota(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

/** Día de la semana: 0 = domingo, 1 = lunes … 6 = sábado. */
export function diaSemana(fecha: string): number {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Suma (o resta, con negativo) días a una fecha YYYY-MM-DD. */
export function sumarDias(fecha: string, dias: number): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString().slice(0, 10);
}

/** Días completos entre dos fechas YYYY-MM-DD. */
export function diasEntre(desde: string, hasta: string): number {
  const [y1, m1, d1] = desde.split("-").map(Number);
  const [y2, m2, d2] = hasta.split("-").map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((b - a) / 86_400_000);
}

/** "lunes, 17 de agosto" */
export function formatoLargo(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Suma minutos a una hora "HH:MM" o "HH:MM:SS". Devuelve "HH:MM". */
export function sumarMinutos(hora: string, minutos: number): string {
  const [h, m] = hora.split(":").map(Number);
  let total = h * 60 + m + minutos;
  total = Math.max(0, Math.min(23 * 60 + 59, total));
  const hh = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Recorta "HH:MM:SS" a "HH:MM". Tolera null. */
export function soloHoraMinuto(hora: string | null): string | null {
  return hora ? hora.slice(0, 5) : null;
}

/**
 * ¿Toca Bellaface hoy?
 * Ciclo de 28 días: 21 con pastilla + 7 de reposo.
 * Si no hay fecha de inicio configurada, asumimos que sí toca
 * (mejor mostrarla de más que ocultarla de menos).
 */
export function tocaBellaface(
  inicio: string | null,
  fecha: string
): boolean {
  if (!inicio) return true;
  const dias = diasEntre(inicio, fecha);
  if (dias < 0) return true;
  return dias % 28 < 21;
}
