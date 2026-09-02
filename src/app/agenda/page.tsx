import { createClient } from "@/lib/supabase/server";
import { hoyBogota } from "@/lib/fechas";
import type { Evento } from "@/lib/tipos";
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
        hoy={hoy}
        abrirNuevo={abrirNuevo}
      />
    </main>
  );
}
