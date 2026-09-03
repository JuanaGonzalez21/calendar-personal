"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DatosEvento } from "@/lib/tipos";

/**
 * Normaliza lo que llega del formulario. `user_id` lo pone la BD
 * (default auth.uid()) y `categoria` se queda en su default.
 */
function limpiar(datos: DatosEvento) {
  return {
    titulo: datos.titulo.trim(),
    tipo: datos.tipo,
    fecha: datos.fecha,
    hora: datos.hora || null,
    duracion_min:
      datos.duracion_min !== null &&
      Number.isInteger(datos.duracion_min) &&
      datos.duracion_min >= 1
        ? datos.duracion_min
        : null,
    nota: datos.nota?.trim() || null,
    bloquea_dia: datos.bloquea_dia,
  };
}

/** Crea un evento de la agenda. */
export async function crearEvento(datos: DatosEvento) {
  const supabase = await createClient();
  const fila = limpiar(datos);
  if (!fila.titulo || !fila.fecha) return;

  await supabase.from("events").insert(fila);

  revalidatePath("/agenda");
}

/** Edita un evento existente. */
export async function actualizarEvento(id: string, datos: DatosEvento) {
  const supabase = await createClient();
  const fila = limpiar(datos);
  if (!fila.titulo || !fila.fecha) return;

  await supabase.from("events").update(fila).eq("id", id);

  revalidatePath("/agenda");
}

/** Borra el evento (DELETE real: una cita cancelada no es historial). */
export async function eliminarEvento(id: string) {
  const supabase = await createClient();
  await supabase.from("events").delete().eq("id", id);
  revalidatePath("/agenda");
}