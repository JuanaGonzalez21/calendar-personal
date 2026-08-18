import { createClient } from "@/lib/supabase/server";
import { hoyBogota, sumarDias } from "@/lib/fechas";
import { formatoTiempo, type Curso, type CursoConTiempo } from "@/lib/tipos";
import Nav from "@/components/Nav";
import ListaCursos from "@/components/ListaCursos";

export const dynamic = "force-dynamic";

export default async function Cursos() {
  const supabase = await createClient();
  const hoy = hoyBogota();

  // Lunes de esta semana
  const [y, m, d] = hoy.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const lunes = sumarDias(hoy, dow === 0 ? -6 : -(dow - 1));

  const { data: cursosData } = await supabase
    .from("courses")
    .select("*")
    .eq("activo", true)
    .order("prioridad");

  const { data: sesiones } = await supabase
    .from("course_sessions")
    .select("course_id, fecha, minutos");

  const cursos: CursoConTiempo[] = ((cursosData ?? []) as Curso[]).map((c) => {
    const propias = (sesiones ?? []).filter((s) => s.course_id === c.id);
    return {
      ...c,
      minutosTotal: propias.reduce((n, s) => n + s.minutos, 0),
      minutosSemana: propias
        .filter((s) => s.fecha >= lunes)
        .reduce((n, s) => n + s.minutos, 0),
    };
  });

  const totalSemana = cursos.reduce((n, c) => n + c.minutosSemana, 0);
  const totalGeneral = cursos.reduce((n, c) => n + c.minutosTotal, 0);

  return (
    <main
      className="mx-auto w-full max-w-lg overflow-x-hidden px-4 pb-24"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 2rem)" }}
    >
      <h1 className="mb-4 text-3xl font-semibold tracking-tight text-neutral-100">
        Cursos
      </h1>

      <Nav />

      <section className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              Esta semana
            </p>
            <p className="mt-0.5 text-2xl font-semibold text-neutral-100">
              {formatoTiempo(totalSemana)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              Acumulado
            </p>
            <p className="mt-0.5 text-sm font-medium text-neutral-300">
              {formatoTiempo(totalGeneral)}
            </p>
          </div>
        </div>
      </section>

      <ListaCursos cursos={cursos} />

      <p className="mt-6 text-center text-xs text-neutral-700">
        El orden es la prioridad acordada. Empieza por el #1.
      </p>
    </main>
  );
}
