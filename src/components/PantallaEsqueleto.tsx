/**
 * Esqueleto de pantalla para los loading.tsx: título + tarjetas glass
 * pulsando. Mismo layout base que las páginas reales para que el paso
 * de "cargando" a "cargada" no salte.
 */

export function Caja({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-white/10 bg-white/5 ${className}`}
    />
  );
}

export default function PantallaEsqueleto({
  conResumen = false,
  filas = 6,
}: {
  /** Tarjeta grande arriba (los resúmenes de Pagos, Cursos, etc.). */
  conResumen?: boolean;
  filas?: number;
}) {
  return (
    <main
      className="mx-auto w-full max-w-lg overflow-x-hidden px-4 pb-32"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 2rem)" }}
    >
      <Caja className="mb-6 h-9 w-40 rounded-xl" />
      {conResumen && <Caja className="mb-6 h-24" />}
      <div className="space-y-1.5">
        {Array.from({ length: filas }, (_, i) => (
          <Caja key={i} className="h-16" />
        ))}
      </div>
    </main>
  );
}
