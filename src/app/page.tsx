import { obtenerDia } from "@/lib/dia";
import { formatoLargo, hoyBogota, horaBogota } from "@/lib/fechas";
import { NOMBRE_TIPO } from "@/lib/tipos";
import ListaTareas from "@/components/ListaTareas";
import ControlesDia from "@/components/ControlesDia";

export const dynamic = "force-dynamic";

export default async function Hoy() {
  const fecha = hoyBogota();
  const hora = horaBogota();
  const { dia, tareas } = await obtenerDia(fecha);

  if (!dia) {
    return (
      <main className="mx-auto w-full max-w-lg overflow-x-hidden px-4 py-10 pb-24">
        <p className="text-neutral-400">
          No se pudo cargar el día. Recarga la página.
        </p>
      </main>
    );
  }

  // Progreso: peso de lo hecho sobre el peso total (las comidas pesan 0)
  const pesoTotal = tareas.reduce((s, t) => s + Number(t.peso), 0);
  const pesoHecho = tareas
    .filter((t) => t.hecha)
    .reduce((s, t) => s + Number(t.peso), 0);
  const pct = pesoTotal > 0 ? Math.round((pesoHecho / pesoTotal) * 100) : 0;

  const minimos = tareas.filter((t) => t.es_minimo);
  const minimosHechos = minimos.filter((t) => t.hecha).length;
  const minimoCumplido = minimos.length > 0 && minimosHechos === minimos.length;

  return (
    <main className="mx-auto max-w-lg px-5 py-10 pb-24">
      <header className="mb-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
            {formatoLargo(fecha)}
          </p>
          <p className="font-mono text-xs text-neutral-600">{hora}</p>
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-100">
          Día {NOMBRE_TIPO[dia.tipo]}
        </h1>
      </header>

      {/* Progreso */}
      <section className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-neutral-500">
              Progreso del día
            </p>
            <p className="mt-1 text-2xl font-semibold text-neutral-100">
              {pct}%
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs uppercase tracking-wider text-neutral-500">
              Mínimo viable
            </p>
            <p
              className={`mt-1 text-sm font-medium ${
                minimoCumplido ? "text-lime-400" : "text-neutral-300"
              }`}
            >
              {minimosHechos} / {minimos.length}
              {minimoCumplido && " ✓"}
            </p>
          </div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-800">
          <div
            className="h-full rounded-full bg-lime-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        {dia.es_roto && (
          <p className="mt-3 text-xs text-neutral-500">
            Día roto: no entra en el cálculo semanal.
          </p>
        )}
      </section>

      <section className="mb-6">
        <ControlesDia dayId={dia.id} tipo={dia.tipo} />
      </section>

      <ListaTareas tareas={tareas} dayId={dia.id} horaActual={hora} />

      <footer className="mt-10 flex justify-center">
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-xs text-neutral-700 transition-colors hover:text-neutral-500"
          >
            Cerrar sesión
          </button>
        </form>
      </footer>
    </main>
  );
}
