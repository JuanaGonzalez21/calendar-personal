import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ORDEN_TIPOS, type PlantillaConTareas } from "@/lib/tipos";
import Nav from "@/components/Nav";
import EditorPlantillas from "@/components/EditorPlantillas";

export const dynamic = "force-dynamic";

export default async function Plantillas() {
  const supabase = await createClient();

  const { data: plantillasData } = await supabase
    .from("templates")
    .select("id, tipo, nombre, descripcion");

  // Sin filtrar `activa`: el editor necesita ver también las desactivadas
  // (a diferencia de la generación del día, que sí las excluye).
  const { data: tareasData } = await supabase
    .from("template_tasks")
    .select("*")
    .order("orden");

  const plantillas: PlantillaConTareas[] = ORDEN_TIPOS.flatMap((tipo) => {
    const p = (plantillasData ?? []).find((x) => x.tipo === tipo);
    if (!p) return [];
    return [
      {
        ...p,
        tareas: (tareasData ?? [])
          .filter((t) => t.template_id === p.id)
          .map((t) => ({ ...t, peso: Number(t.peso) })),
      } as PlantillaConTareas,
    ];
  });

  return (
    <main
      className="mx-auto w-full max-w-lg overflow-x-hidden px-4 pb-24"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 2rem)" }}
    >
      <Link
        href="/ajustes"
        className="mb-2 inline-block text-sm text-neutral-500 transition-colors active:text-neutral-300"
      >
        ← Ajustes
      </Link>

      <h1 className="mb-4 text-3xl font-semibold tracking-tight text-neutral-100">
        Plantillas
      </h1>

      <Nav />

      <p className="mb-4 text-xs text-neutral-500">
        Los cambios en las plantillas solo afectan los días que se generen de
        ahora en adelante. Los días ya creados no cambian.
      </p>

      <EditorPlantillas plantillas={plantillas} />
    </main>
  );
}
