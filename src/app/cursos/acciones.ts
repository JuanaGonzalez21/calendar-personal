"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hoyBogota } from "@/lib/fechas";
import type { DatosCurso } from "@/lib/tipos";

/** Registra una sesión de estudio. */
export async function registrarSesion(courseId: string, minutos: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || minutos <= 0) return;

  await supabase.from("course_sessions").insert({
    user_id: user.id,
    course_id: courseId,
    fecha: hoyBogota(),
    minutos,
  });

  revalidatePath("/cursos");
}

/** Deshace la última sesión registrada de un curso. */
export async function deshacerUltima(courseId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("course_sessions")
    .select("id")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data?.id) {
    await supabase.from("course_sessions").delete().eq("id", data.id);
  }

  revalidatePath("/cursos");
}

/** Archiva o reactiva un curso. */
export async function alternarActivo(courseId: string, activo: boolean) {
  const supabase = await createClient();
  await supabase.from("courses").update({ activo }).eq("id", courseId);
  revalidatePath("/cursos");
}

/** Crea un curso. El progreso nace en 0 (default de la BD). */
export async function crearCurso(datos: Omit<DatosCurso, "progreso">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const nombre = datos.nombre.trim();
  if (!user || !nombre) return;

  await supabase.from("courses").insert({
    user_id: user.id,
    nombre,
    plataforma: datos.plataforma?.trim() || null,
    url: datos.url?.trim() || null,
    prioridad:
      Number.isInteger(datos.prioridad) && datos.prioridad >= 0
        ? datos.prioridad
        : 0,
  });

  revalidatePath("/cursos");
}

/** Edita nombre, plataforma, url, prioridad y progreso (0-100). */
export async function actualizarCurso(id: string, datos: DatosCurso) {
  const supabase = await createClient();
  const nombre = datos.nombre.trim();
  if (!nombre) return;

  const fila: Record<string, unknown> = {
    nombre,
    plataforma: datos.plataforma?.trim() || null,
    url: datos.url?.trim() || null,
  };
  if (Number.isInteger(datos.prioridad) && datos.prioridad >= 0) {
    fila.prioridad = datos.prioridad;
  }
  if (
    Number.isInteger(datos.progreso) &&
    datos.progreso >= 0 &&
    datos.progreso <= 100
  ) {
    fila.progreso = datos.progreso;
  }

  await supabase.from("courses").update(fila).eq("id", id);

  revalidatePath("/cursos");
}

/**
 * Borra un curso y su tiempo registrado. Primero las sesiones
 * (la FK de course_sessions apunta al curso) y luego el curso.
 * La UI confirma antes de llamar acá.
 */
export async function eliminarCurso(id: string) {
  const supabase = await createClient();
  await supabase.from("course_sessions").delete().eq("course_id", id);
  await supabase.from("courses").delete().eq("id", id);
  revalidatePath("/cursos");
}
