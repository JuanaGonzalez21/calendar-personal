import { createClient } from "@/lib/supabase/server";
import { hoyBogota } from "@/lib/fechas";
import type { EsfuerzoDia, Evento } from "@/lib/tipos";
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

  // Esfuerzo por día, agregado en el server: al cliente solo viajan
  // los días con esfuerzo (> 0). Lo demás queda neutro por diseño.
  const { data: diasData } = await supabase.from("days").select("id, fecha");
  const { data: tareasData } = await supabase
    .from("day_tasks")
    .select("day_id, hecha, peso, es_minimo");

  const fechaPorDia = new Map((diasData ?? []).map((d) => [d.id, d.fecha]));
  const acumulado = new Map<
    string,
    { pesoTotal: number; pesoHecho: number; minTotal: number; minHechos: number }
  >();
  for (const t of tareasData ?? []) {
    const fecha = fechaPorDia.get(t.day_id);
    if (!fecha) continue;
    const a =
      acumulado.get(fecha) ??
      { pesoTotal: 0, pesoHecho: 0, minTotal: 0, minHechos: 0 };
    const peso = Number(t.peso);
    a.pesoTotal += peso;
    if (t.hecha) a.pesoHecho += peso;
    if (t.es_minimo) {
      a.minTotal++;
      if (t.hecha) a.minHechos++;
    }
    acumulado.set(fecha, a);
  }

  const esfuerzos: EsfuerzoDia[] = [...acumulado.entries()]
    .map(([fecha, a]) => ({
      fecha,
      pct: a.pesoTotal > 0 ? Math.round((a.pesoHecho / a.pesoTotal) * 100) : 0,
      minimosHechos: a.minHechos,
      minimosTotal: a.minTotal,
      minimoCumplido:
        a.minTotal === 0 ? a.pesoHecho > 0 : a.minHechos === a.minTotal,
    }))
    .filter((e) => e.pct > 0);

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
        esfuerzos={esfuerzos}
        hoy={hoy}
        abrirNuevo={abrirNuevo}
      />
    </main>
  );
}
