import Link from "next/link";
import {
  BookOpen,
  Briefcase,
  ChevronRight,
  Settings,
  type LucideIcon,
} from "lucide-react";

const SECCIONES: {
  href: string;
  titulo: string;
  descripcion: string;
  Icono: LucideIcon;
}[] = [
  {
    href: "/cursos",
    titulo: "Cursos",
    descripcion: "Tiempo de estudio por curso",
    Icono: BookOpen,
  },
  {
    href: "/postulaciones",
    titulo: "Postulaciones",
    descripcion: "Tracker de búsqueda de empleo",
    Icono: Briefcase,
  },
  {
    href: "/ajustes",
    titulo: "Ajustes",
    descripcion: "Plantillas de día y configuración",
    Icono: Settings,
  },
];

export default function Mas() {
  return (
    <main
      className="mx-auto w-full max-w-lg overflow-x-hidden px-4 pb-32"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 2rem)" }}
    >
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-neutral-100">
        Más
      </h1>

      <div className="space-y-1.5">
        {SECCIONES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur-md transition-colors active:bg-white/10"
          >
            <s.Icono className="h-5 w-5 shrink-0 text-lima" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-neutral-100">{s.titulo}</p>
              <p className="truncate text-xs text-neutral-500">
                {s.descripcion}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-600" />
          </Link>
        ))}
      </div>
    </main>
  );
}
