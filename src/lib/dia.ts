import { createClient } from "@/lib/supabase/server";
import { diaSemana, diasEntre, tocaBellaface } from "@/lib/fechas";
import type { Dia, NombresTipo, Settings, Tarea, TipoDia } from "@/lib/tipos";

type Supa = Awaited<ReturnType<typeof createClient>>;

/**
 * Decide qué tipo de día proponer cuando el día todavía no existe.
 *
 * La secuencia (`settings.secuencia_tipos`) rota en ciclo desde
 * `secuencia_ancla`: guardar una secuencia nueva resetea el ancla a
 * hoy, así "hoy toca el primer paso" siempre se cumple. Es una
 * sugerencia, no una imposición — siempre puedes cambiarla con un
 * toque desde la app.
 */
function tipoSugerido(settings: Settings | null, fecha: string): TipoDia {
  const seq = settings?.secuencia_tipos;
  if (!seq?.length) return "A_cocina";

  const offset = diasEntre(settings!.secuencia_ancla, fecha);
  const idx = ((offset % seq.length) + seq.length) % seq.length;
  return seq[idx];
}

/**
 * Ajusta una tarea de plantilla según el día de la semana.
 *
 * El Bloque 1 alterna: estudio lunes/miércoles/viernes,
 * proyecto martes/jueves/sábado. Como las plantillas son por tipo de
 * día y no por día de la semana, el ajuste se hace acá, al generar.
 */
function ajustarBloque1(
  titulo: string,
  categoria: string,
  fecha: string,
): { titulo: string; categoria: string } {
  if (!titulo.startsWith("Bloque 1")) {
    return { titulo, categoria };
  }

  const dow = diaSemana(fecha);
  const esProyecto = dow === 2 || dow === 4 || dow === 6; // mar, jue, sáb

  return esProyecto
    ? { titulo: "Bloque 1 · Proyecto", categoria: "proyecto" }
    : { titulo: "Bloque 1 · Estudio", categoria: "estudio" };
}

/**
 * Copia las tareas de la plantilla al día.
 *
 * Es una COPIA, no una referencia: si mañana cambias la plantilla,
 * los días ya vividos no se alteran. El historial queda congelado.
 */
export async function generarTareas(
  supabase: Supa,
  dia: Dia,
  userId: string,
  settings: Settings | null,
) {
  if (!dia.template_id) return;

  const { data: plantilla } = await supabase
    .from("template_tasks")
    .select("*")
    .eq("template_id", dia.template_id)
    .eq("activa", true)
    .order("orden");

  if (!plantilla?.length) return;

  // Títulos que ya existen en el día (para no duplicar al cambiar de tipo)
  const { data: existentes } = await supabase
    .from("day_tasks")
    .select("titulo")
    .eq("day_id", dia.id);

  const yaEstan = new Set((existentes ?? []).map((t) => t.titulo));

  const mostrarBellaface = tocaBellaface(
    settings?.bellaface_inicio ?? null,
    dia.fecha,
  );

  const filas = plantilla
    .filter((t) => mostrarBellaface || t.titulo !== "Bellaface")
    .map((t) => {
      const ajuste = ajustarBloque1(t.titulo, t.categoria, dia.fecha);
      return {
        user_id: userId,
        day_id: dia.id,
        template_task_id: t.id,
        titulo: ajuste.titulo,
        categoria: ajuste.categoria,
        grupo: t.grupo,
        hora: t.hora,
        duracion_min: t.duracion_min,
        orden: t.orden,
        peso: t.peso,
        es_minimo: t.es_minimo,
        aviso_min: t.aviso_min,
      };
    })
    .filter((f) => !yaEstan.has(f.titulo));

  if (filas.length) {
    await supabase.from("day_tasks").insert(filas);
  }
}

/**
 * Devuelve el día pedido. Si no existe, lo crea y genera sus tareas.
 * Esta es la puerta de entrada de la pantalla Hoy.
 */
export async function obtenerDia(fecha: string): Promise<{
  dia: Dia | null;
  tareas: Tarea[];
  settings: Settings | null;
  nombresTipo: NombresTipo;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const nombresTipoVacio: NombresTipo = {
    A_cocina: "Cocina",
    B_gym: "Gym",
    B_libre: "Libre",
  };

  if (!user) {
    return { dia: null, tareas: [], settings: null, nombresTipo: nombresTipoVacio };
  }

  const { data: settings } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: plantillasData } = await supabase
    .from("templates")
    .select("tipo, nombre");

  const nombresTipo: NombresTipo = { ...nombresTipoVacio };
  for (const p of plantillasData ?? []) {
    nombresTipo[p.tipo as TipoDia] = p.nombre;
  }

  let { data: dia } = await supabase
    .from("days")
    .select("*")
    .eq("fecha", fecha)
    .maybeSingle();

  if (!dia) {
    const tipo = tipoSugerido(settings as Settings | null, fecha);

    const { data: plantilla } = await supabase
      .from("templates")
      .select("id")
      .eq("tipo", tipo)
      .maybeSingle();

    const { data: nuevo, error } = await supabase
      .from("days")
      .insert({
        user_id: user.id,
        fecha,
        tipo,
        template_id: plantilla?.id ?? null,
      })
      .select()
      .single();

    if (error || !nuevo) {
      return { dia: null, tareas: [], settings, nombresTipo };
    }

    dia = nuevo;
    await generarTareas(supabase, dia as Dia, user.id, settings);
  }

  const { data: tareas } = await supabase
    .from("day_tasks")
    .select("*")
    .eq("day_id", dia.id)
    .order("hora", { ascending: true, nullsFirst: false })
    .order("orden");

  return {
    dia: dia as Dia,
    tareas: (tareas ?? []) as Tarea[],
    settings: (settings ?? null) as Settings | null,
    nombresTipo,
  };
}
