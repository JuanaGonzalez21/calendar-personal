"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hoyBogota } from "@/lib/fechas";

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
