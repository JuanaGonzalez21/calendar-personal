import { createClient } from "@/lib/supabase/server";
import { hoyBogota } from "@/lib/fechas";
import type {
  DiaCalendario,
  Evento,
  TareaCalendario,
} from "@/lib/tipos";
import CalendarioAgenda from "@/components/CalendarioAgenda";

export const dynamic = "force-dynamic";

export default async function Agenda({
  searchParams,
}: {
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const supabase = await createClient();
  const hoy = hoyBogota();
  const { nuevo } = await searchParams;
  const abrirNuevo = nuevo === "1";

  const { data } = await supabase
    .from("events")
    .select("id, titulo, tipo, fecha, hora, duracion_min, nota, bloquea_dia")
    .order("fecha")
    .order("hora", { nullsFirst: true });

  const eventos = (data ?? []) as Evento[];

  // Días generados (una fila por fecha vivida): marcan la rejilla.
  const { data: diasData } = await supabase
    .from("days")
    .select("id, fecha, tipo, es_roto");
  const dias: DiaCalendario[] = (diasData ?? []).map((d) => ({
    fecha: d.fecha,
    tipo: d.tipo,
    es_roto: d.es_roto,
  }));

  // Las tareas de hoy vienen precargadas (es el día seleccionado inicial).
  const diaHoy = (diasData ?? []).find((d) => d.fecha === hoy);
  let tareasHoy: TareaCalendario[] = [];
  if (diaHoy) {
    const { data: tareasData } = await supabase
      .from("day_tasks")
      .select("id, titulo, hora, hecha, categoria, orden")
      .eq("day_id", diaHoy.id)
      .order("orden");
    tareasHoy = (tareasData ?? []) as TareaCalendario[];
  }

  return (
    <main
      className="mx-auto w-full max-w-lg overflow-x-hidden px-4 pb-32"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 2rem)" }}
    >
      <h1 className="mb-4 text-3xl font-semibold tracking-tight text-neutral-100">
        Agenda
      </h1>

      <CalendarioAgenda
        key={abrirNuevo ? "nuevo" : "lista"}
        eventos={eventos}
        dias={dias}
        tareasIniciales={tareasHoy}
        hoy={hoy}
        abrirNuevo={abrirNuevo}
      />
    </main>
  );
}
