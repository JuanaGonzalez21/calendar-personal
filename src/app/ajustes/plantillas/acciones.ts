"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hoyBogota } from "@/lib/fechas";
import {
  esTituloProtegido,
  ORDEN_TIPOS,
  type CamposTareaPlantilla,
  type TipoDia,
} from "@/lib/tipos";

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

  // Ni renombrar una tarea protegida, ni renombrar otra HACIA un nombre
  // protegido (crearía duplicados que confunden la generación del día).
  if (
    campos.titulo !== undefined &&
    campos.titulo?.trim() &&
    !esTituloProtegido(actual.titulo) &&
    !esTituloProtegido(campos.titulo.trim())
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

  revalidatePath("/ajustes/plantillas");
}

/**
 * Desactiva o reactiva una tarea de plantilla. Nunca borra:
 * activa=false la saca de los días futuros conservando el historial.
 */
export async function alternarTareaActiva(id: string, activa: boolean) {
  const supabase = await createClient();
  await supabase.from("template_tasks").update({ activa }).eq("id", id);
  revalidatePath("/ajustes/plantillas");
}

/**
 * Agrega una tarea nueva a una plantilla: orden = máximo actual + 1,
 * activa = true. Rechaza nombres protegidos: esos títulos son de las
 * tareas que la generación del día ya maneja sola.
 */
export async function agregarTarea(
  templateId: string,
  campos: CamposTareaPlantilla,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const titulo = campos.titulo?.trim();
  if (!user || !titulo || esTituloProtegido(titulo)) return;

  const { data: ultima } = await supabase
    .from("template_tasks")
    .select("orden")
    .eq("template_id", templateId)
    .order("orden", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("template_tasks").insert({
    user_id: user.id,
    template_id: templateId,
    titulo,
    categoria: campos.categoria ?? "otros",
    grupo: campos.grupo ?? "general",
    hora: campos.hora || null,
    duracion_min:
      campos.duracion_min != null &&
      Number.isInteger(campos.duracion_min) &&
      campos.duracion_min >= 1
        ? campos.duracion_min
        : null,
    peso:
      campos.peso !== undefined &&
      Number.isFinite(campos.peso) &&
      campos.peso >= 0
        ? campos.peso
        : 1,
    es_minimo: campos.es_minimo ?? false,
    orden: (ultima?.orden ?? 0) + 1,
  });

  revalidatePath("/ajustes/plantillas");
}

/**
 * Borrado FÍSICO, solo bajo pedido explícito con confirmación en la UI
 * (el "quitar" normal es alternarTareaActiva). Es seguro para el
 * historial: day_tasks.template_task_id es ON DELETE SET NULL, así que
 * los días ya generados conservan su copia.
 */
export async function eliminarTarea(id: string) {
  const supabase = await createClient();
  await supabase.from("template_tasks").delete().eq("id", id);
  revalidatePath("/ajustes/plantillas");
}

/** Renombra una plantilla (el nombre visible de un tipo de día). */
export async function actualizarNombrePlantilla(id: string, nombre: string) {
  const limpio = nombre.trim();
  if (!limpio) return;

  const supabase = await createClient();
  await supabase.from("templates").update({ nombre: limpio }).eq("id", id);

  revalidatePath("/ajustes/plantillas");
  revalidatePath("/");
}

/**
 * Guarda la secuencia de rotación de tipos de día y resetea el ancla
 * a hoy: así el primer paso de la lista siempre aplica desde hoy.
 */
export async function actualizarSecuencia(secuencia: TipoDia[]) {
  const limpia = secuencia.filter((t) => ORDEN_TIPOS.includes(t));
  if (limpia.length === 0) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("settings")
    .update({
      secuencia_tipos: limpia,
      secuencia_ancla: hoyBogota(),
    })
    .eq("user_id", user.id);

  revalidatePath("/ajustes/plantillas");
  revalidatePath("/");
}

/** Intercambia el orden de dos tareas (subir/bajar dentro de la plantilla). */
export async function intercambiarOrden(idA: string, idB: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("template_tasks")
    .select("id, orden")
    .in("id", [idA, idB]);
  if (!data || data.length !== 2) return;

  const [a, b] = data;
  await supabase.from("template_tasks").update({ orden: b.orden }).eq("id", a.id);
  await supabase.from("template_tasks").update({ orden: a.orden }).eq("id", b.id);

  revalidatePath("/ajustes/plantillas");
}
