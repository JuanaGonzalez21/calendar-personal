import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  ORDEN_TIPOS,
  type NombresTipo,
  type PlantillaConTareas,
} from "@/lib/tipos";
import EditorPlantillas from "@/components/EditorPlantillas";
import EditorSecuencia from "@/components/EditorSecuencia";

export const dynamic = "force-dynamic";

export default async function Plantillas() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: plantillasData } = await supabase
    .from("templates")
    .select("id, tipo, nombre, descripcion");

  const nombres: NombresTipo = { A_cocina: "Cocina", B_gym: "Gym", B_libre: "Libre" };
  for (const p of plantillasData ?? []) {
    nombres[p.tipo as keyof NombresTipo] = p.nombre;
  }

  const { data: settings } = user
    ? await supabase
        .from("settings")
        .select("secuencia_tipos")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const secuencia = settings?.secuencia_tipos ?? ORDEN_TIPOS;

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
      className="mx-auto w-full max-w-lg overflow-x-hidden px-4 pb-32"
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

      <p className="mb-4 text-xs text-neutral-500">
        Los cambios en las plantillas solo afectan los días que se generen de
        ahora en adelante. Los días ya creados no cambian.
      </p>

      <EditorSecuencia secuencia={secuencia} nombres={nombres} />

      <EditorPlantillas plantillas={plantillas} />
    </main>
  );
}
