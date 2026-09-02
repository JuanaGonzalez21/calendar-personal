"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { esTituloProtegido, type CamposTareaPlantilla } from "@/lib/tipos";

/**
 * Edita campos de una tarea de plantilla. Solo afecta los días que se
 * generen de ahora en adelante (los días ya creados son una copia).
 */
export async function actualizarTarea(
  id: string,
  campos: CamposTareaPlantilla,
) {
  const supabase = await createClient();

  const { data: actual } = await supabase
    .from("template_tasks")
    .select("titulo")
    .eq("id", id)
    .maybeSingle();
  if (!actual) return;

  // Payload por allowlist: solo lo que viene y pasa validación.
  const datos: Record<string, unknown> = {};

  if (
    campos.titulo !== undefined &&
    campos.titulo?.trim() &&
    !esTituloProtegido(actual.titulo)
  ) {
    datos.titulo = campos.titulo.trim();
  }
  if (campos.hora !== undefined) datos.hora = campos.hora || null;
  if (campos.categoria !== undefined) datos.categoria = campos.categoria;
  if (campos.grupo !== undefined) datos.grupo = campos.grupo;
  if (campos.es_minimo !== undefined) datos.es_minimo = campos.es_minimo;
  // peso 0 es válido: las comidas pesan 0 a propósito.
  if (
    campos.peso !== undefined &&
    Number.isFinite(campos.peso) &&
    campos.peso >= 0
  ) {
    datos.peso = campos.peso;
  }
  if (campos.duracion_min !== undefined) {
    if (campos.duracion_min === null) {
      datos.duracion_min = null;
    } else if (
      Number.isInteger(campos.duracion_min) &&
      campos.duracion_min >= 1
    ) {
      datos.duracion_min = campos.duracion_min;
    }
  }

  if (Object.keys(datos).length === 0) return;

  await supabase.from("template_tasks").update(datos).eq("id", id);

  revalidatePath("/plantillas");
}

/**
 * Desactiva o reactiva una tarea de plantilla. Nunca borra:
 * activa=false la saca de los días futuros conservando el historial.
 */
export async function alternarTareaActiva(id: string, activa: boolean) {
  const supabase = await createClient();
  await supabase.from("template_tasks").update({ activa }).eq("id", id);
  revalidatePath("/plantillas");
}
