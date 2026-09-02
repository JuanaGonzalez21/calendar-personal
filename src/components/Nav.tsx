"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const RUTAS = [
  { href: "/", label: "Hoy" },
  { href: "/cursos", label: "Cursos" },
  { href: "/postulaciones", label: "Postulaciones" },
  { href: "/pagos", label: "Pagos" },
  { href: "/agenda", label: "Agenda" },
  { href: "/ajustes", label: "Ajustes" },
];

export default function Nav() {
  const path = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-1.5">
      {RUTAS.map((r) => {
        // "/" solo exacta; las demás también marcan sus subrutas (/ajustes/...).
        const activa =
          r.href === "/"
            ? path === "/"
            : path === r.href || path.startsWith(`${r.href}/`);
        return (
          <Link
            key={r.href}
            href={r.href}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              activa
                ? "bg-neutral-800 font-medium text-neutral-100"
                : "text-neutral-500 active:bg-neutral-900"
            }`}
          >
            {r.label}
          </Link>
        );
      })}
    </nav>
  );
}
