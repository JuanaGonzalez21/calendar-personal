import { createClient } from "@/lib/supabase/server";
import { hoyBogota, sumarDias } from "@/lib/fechas";
import type { Postulacion } from "@/lib/tipos";
import Nav from "@/components/Nav";
import ListaPostulaciones from "@/components/ListaPostulaciones";

export const dynamic = "force-dynamic";

export default async function Postulaciones() {
  const supabase = await createClient();
  const hoy = hoyBogota();

  const { data } = await supabase
    .from("applications")
    .select("*")
    .order("fecha", { ascending: false });

  const postulaciones = (data ?? []) as Postulacion[];

  // Meta semanal: 15. La semana arranca el lunes.
  const [y, m, d] = hoy.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const lunes = sumarDias(hoy, dow === 0 ? -6 : -(dow - 1));
  const estaSemana = postulaciones.filter((p) => p.fecha >= lunes).length;
  const pct = Math.min(100, Math.round((estaSemana / 15) * 100));

  const vivas = postulaciones.filter((p) => p.estado === "en_proceso").length;

  return (
    <main
      className="mx-auto w-full max-w-lg overflow-x-hidden px-4 pb-24"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 2rem)" }}
    >
      <h1 className="mb-4 text-3xl font-semibold tracking-tight text-neutral-100">
        Postulaciones
      </h1>

      <Nav />

      <section className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              Esta semana
            </p>
            <p className="mt-0.5 text-2xl font-semibold text-neutral-100">
              {estaSemana}
              <span className="text-base font-normal text-neutral-600">
                {" "}
                / 15
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              En proceso
            </p>
            <p className="mt-0.5 text-sm font-medium text-lime-400">{vivas}</p>
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-lime-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <a
          href="/api/exportar"
          className="mt-3 inline-block font-mono text-[11px] text-neutral-500 underline active:text-neutral-300"
        >
          Exportar a CSV (Excel)
        </a>
      </section>

      <ListaPostulaciones postulaciones={postulaciones} hoy={hoy} />
    </main>
  );
}
