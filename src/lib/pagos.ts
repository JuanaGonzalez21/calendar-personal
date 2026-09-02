/**
 * Lógica de pagos: qué cuenta como pendiente y en qué orden se listan.
 * Es pura (sin Supabase) para poder usarla igual en server actions,
 * páginas y componentes client.
 */

import { fechaBogotaDe } from "./fechas";
import type { Pago } from "./tipos";

type PagoMinimo = Pick<Pago, "recurrente" | "pagado_at">;

/**
 * Puntual: pendiente ⟺ nunca pagado.
 * Recurrente: pendiente ⟺ nunca pagado o pagado en un mes anterior
 * (se compara contra el inicio del mes en curso, en hora de Bogotá).
 */
export function estaPendiente(p: PagoMinimo, hoy: string): boolean {
  if (!p.pagado_at) return true;
  if (!p.recurrente) return false;
  const inicioMes = `${hoy.slice(0, 7)}-01`;
  return fechaBogotaDe(p.pagado_at) < inicioMes;
}

/** Solo los puntuales vencen: fecha_venc pasada y sin pagar. */
export function estaVencido(p: Pago, hoy: string): boolean {
  return (
    !p.recurrente &&
    p.fecha_venc !== null &&
    p.fecha_venc < hoy &&
    estaPendiente(p, hoy)
  );
}

function grupo(p: Pago, hoy: string): number {
  if (!estaPendiente(p, hoy)) return 3; // pagados al fondo
  if (estaVencido(p, hoy)) return 0; // vencidos primero
  return p.recurrente ? 2 : 1; // próximos por fecha, luego recurrentes del mes
}

/** Vencidos → próximos por fecha → recurrentes del mes → pagados. */
export function ordenarPagos(pagos: Pago[], hoy: string): Pago[] {
  return [...pagos].sort((a, b) => {
    const ga = grupo(a, hoy);
    const gb = grupo(b, hoy);
    if (ga !== gb) return ga - gb;
    if (ga === 3) return (b.pagado_at ?? "").localeCompare(a.pagado_at ?? "");
    if (ga === 2) return (a.dia_mes ?? 99) - (b.dia_mes ?? 99);
    return (a.fecha_venc ?? "9999-12-31").localeCompare(
      b.fecha_venc ?? "9999-12-31",
    );
  });
}
