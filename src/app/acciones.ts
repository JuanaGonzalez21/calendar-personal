"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generarTareas } from "@/lib/dia";
import { sumarMinutos } from "@/lib/fechas";
import type { Dia, Settings, TipoDia } from "@/lib/tipos";

/** Marca o desmarca una tarea. */
export async function alternarTarea(id: string, hecha: boolean) {
  const supabase = await createClient();

  await supabase
    .from("day_tasks")
    .update({
      hecha,
      hecha_at: hecha ? new Date().toISOString() : null,
    })
    .eq("id", id);

  revalidatePath("/");
}

/** Cambia la hora de una tarea puntual (sin tocar la plantilla). */
export async function moverHora(id: string, hora: string) {
  const supabase = await createClient();

  await supabase
    .from("day_tasks")
    .update({ hora: hora || null })
    .eq("id", id);

  revalidatePath("/");
}

/**
 * Corre todas las tareas pendientes X minutos.
 * Para cuando te levantaste tarde o el día se atrasó.
 */
export async function correrDia(dayId: string, minutos: number) {
  const supabase = await createClient();

  const { data: tareas } = await supabase
    .from("day_tasks")
    .select("id, hora")
    .eq("day_id", dayId)
    .eq("hecha", false)
    .not("hora", "is", null);

  if (!tareas?.length) return;

  await Promise.all(
    tareas.map((t) =>
      supabase
        .from("day_tasks")
        .update({ hora: sumarMinutos(t.hora as string, minutos) })
        .eq("id", t.id)
    )
  );

  revalidatePath("/");
}

/**
 * Cambia el tipo de día y regenera las tareas.
 * Lo que ya marcaste como hecho se conserva.
 */
export async function cambiarTipoDia(dayId: string, tipo: TipoDia) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: plantilla } = await supabase
    .from("templates")
    .select("id")
    .eq("tipo", tipo)
    .maybeSingle();

  // Borra solo lo pendiente. Lo hecho es historial y no se toca.
  await supabase
    .from("day_tasks")
    .delete()
    .eq("day_id", dayId)
    .eq("hecha", false);

  const { data: dia } = await supabase
    .from("days")
    .update({
      tipo,
      template_id: plantilla?.id ?? null,
      es_roto: tipo === "roto",
    })
    .eq("id", dayId)
    .select()
    .single();

  if (!dia) return;

  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  await generarTareas(
    supabase,
    dia as Dia,
    user.id,
    (settings ?? null) as Settings | null
  );

  revalidatePath("/");
}

/** Agrega una tarea suelta al día (algo que no está en la plantilla). */
export async function agregarTarea(
  dayId: string,
  titulo: string,
  hora: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !titulo.trim()) return;

  await supabase.from("day_tasks").insert({
    user_id: user.id,
    day_id: dayId,
    titulo: titulo.trim(),
    categoria: "otros",
    grupo: "general",
    hora: hora || null,
    orden: 99,
    peso: 1,
    es_minimo: false,
  });

  revalidatePath("/");
}

/** Borra una tarea del día. */
export async function borrarTarea(id: string) {
  const supabase = await createClient();
  await supabase.from("day_tasks").delete().eq("id", id);
  revalidatePath("/");
}
