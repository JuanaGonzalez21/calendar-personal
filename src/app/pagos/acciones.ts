"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hoyBogota } from "@/lib/fechas";
import { estaPendiente } from "@/lib/pagos";
import type { DatosPago } from "@/lib/tipos";

/**
 * Normaliza lo que llega del formulario. `user_id` no viaja nunca:
 * lo pone la BD con su default auth.uid().
 */
function limpiar(datos: DatosPago) {
  return {
    concepto: datos.concepto.trim(),
    monto:
      datos.monto !== null && Number.isFinite(datos.monto) && datos.monto >= 0
        ? datos.monto
        : null,
    categoria: datos.categoria,
    recurrente: datos.recurrente,
    dia_mes:
      datos.recurrente &&
      datos.dia_mes !== null &&
      Number.isInteger(datos.dia_mes) &&
      datos.dia_mes >= 1 &&
      datos.dia_mes <= 31
        ? datos.dia_mes
        : null,
    fecha_venc: !datos.recurrente && datos.fecha_venc ? datos.fecha_venc : null,
    responsable: datos.responsable,
    nota: datos.nota?.trim() || null,
  };
}

/** Crea un pago (pendiente por definición: pagado_at nace null). */
export async function crearPago(datos: DatosPago) {
  const supabase = await createClient();
  const fila = limpiar(datos);
  if (!fila.concepto) return;

  await supabase.from("pagos").insert(fila);

  revalidatePath("/pagos");
}

/** Edita un pago existente (no toca pagado_at). */
export async function actualizarPago(id: string, datos: DatosPago) {
  const supabase = await createClient();
  const fila = limpiar(datos);
  if (!fila.concepto) return;

  await supabase.from("pagos").update(fila).eq("id", id);

  revalidatePath("/pagos");
}

/**
 * Si está pendiente lo marca pagado ahora; si ya está pagado en el
 * periodo, lo desmarca. La misma regla de pendiente que usa la UI.
 */
export async function alternarPagado(id: string) {
  const supabase = await createClient();

  const { data: pago } = await supabase
    .from("pagos")
    .select("recurrente, pagado_at")
    .eq("id", id)
    .maybeSingle();
  if (!pago) return;

  const pendiente = estaPendiente(pago, hoyBogota());
  await supabase
    .from("pagos")
    .update({ pagado_at: pendiente ? new Date().toISOString() : null })
    .eq("id", id);

  revalidatePath("/pagos");
}

/** Borra el pago. Acá sí es DELETE real: no hay historial que proteger. */
export async function eliminarPago(id: string) {
  const supabase = await createClient();
  await supabase.from("pagos").delete().eq("id", id);
  revalidatePath("/pagos");
}
