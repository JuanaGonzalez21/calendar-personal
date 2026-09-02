import Link from "next/link";
import Nav from "@/components/Nav";

// Más adelante: metas, Bellaface, etc. Agregar aquí y listo.
const OPCIONES = [
  {
    href: "/ajustes/plantillas",
    titulo: "Plantillas de día",
    descripcion: "Edita las tareas base de cada tipo de día",
  },
];

export default function Ajustes() {
  return (
    <main
      className="mx-auto w-full max-w-lg overflow-x-hidden px-4 pb-24"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 2rem)" }}
    >
      <h1 className="mb-4 text-3xl font-semibold tracking-tight text-neutral-100">
        Ajustes
      </h1>

      <Nav />

      <div className="space-y-1.5">
        {OPCIONES.map((o) => (
          <Link
            key={o.href}
            href={o.href}
            className="flex w-full items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-3 transition-colors active:bg-neutral-800"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-neutral-100">{o.titulo}</p>
              <p className="truncate text-xs text-neutral-500">
                {o.descripcion}
              </p>
            </div>
            <span className="shrink-0 text-neutral-600">›</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
