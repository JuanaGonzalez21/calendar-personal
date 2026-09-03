"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Ellipsis,
  ListChecks,
  Plus,
  Wallet,
  type LucideIcon,
} from "lucide-react";

interface Pestana {
  href: string;
  label: string;
  Icono: LucideIcon;
  /** Rutas que "pertenecen" a la pestaña (para marcarla activa). */
  prefijos: string[];
}

const IZQUIERDA: Pestana[] = [
  { href: "/", label: "Hoy", Icono: ListChecks, prefijos: ["/"] },
  { href: "/pagos", label: "Pagos", Icono: Wallet, prefijos: ["/pagos"] },
];

const DERECHA: Pestana[] = [
  { href: "/agenda", label: "Agenda", Icono: CalendarDays, prefijos: ["/agenda"] },
  {
    href: "/mas",
    label: "Más",
    Icono: Ellipsis,
    prefijos: ["/mas", "/cursos", "/postulaciones", "/ajustes"],
  },
];

export default function TabBar() {
  const path = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [tecladoAbierto, setTecladoAbierto] = useState(false);

  // En iOS el teclado deja los elementos `fixed` flotando en medio de
  // la pantalla, así que la barra se esconde mientras esté abierto.
  useEffect(() => {
    const vv = window.visualViewport;

    if (vv) {
      // Detector principal: si el viewport visual encoge bastante
      // frente a la ventana, hay teclado.
      const medir = () => {
        setTecladoAbierto(window.innerHeight - vv.height > 150);
      };
      vv.addEventListener("resize", medir);
      vv.addEventListener("scroll", medir);
      return () => {
        vv.removeEventListener("resize", medir);
        vv.removeEventListener("scroll", medir);
      };
    }

    // Respaldo sin Visual Viewport API: foco en campos de texto.
    const esCampo = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      t.matches("input, textarea, select, [contenteditable]");
    const alEnfocar = (e: FocusEvent) => {
      if (esCampo(e.target)) setTecladoAbierto(true);
    };
    const alDesenfocar = (e: FocusEvent) => {
      if (esCampo(e.target)) setTecladoAbierto(false);
    };
    window.addEventListener("focusin", alEnfocar);
    window.addEventListener("focusout", alDesenfocar);
    return () => {
      window.removeEventListener("focusin", alEnfocar);
      window.removeEventListener("focusout", alDesenfocar);
    };
  }, []);

  // Sin barra en login ni rutas de auth, ni mientras se escribe.
  if (path.startsWith("/login") || path.startsWith("/auth") || tecladoAbierto)
    return null;

  const activa = (prefijos: string[]) =>
    prefijos.some((p) =>
      p === "/" ? path === "/" : path === p || path.startsWith(`${p}/`),
    );

  const pestana = (t: Pestana) => {
    const act = activa(t.prefijos);
    return (
      <Link
        key={t.href}
        href={t.href}
        onClick={() => setMenuAbierto(false)}
        className="flex flex-1 flex-col items-center gap-0.5 py-2"
      >
        <t.Icono
          className={`h-5 w-5 ${act ? "text-lima" : "text-neutral-500"}`}
        />
        <span
          className={`text-[10px] ${act ? "text-lima" : "text-neutral-500"}`}
        >
          {t.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      {menuAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 z-40 cursor-default"
        />
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50">
        <div
          className="relative mx-auto w-full max-w-lg border-t border-white/10 bg-neutral-950/85 backdrop-blur-md"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* ------------------ Acciones rápidas del "+" ------------------ */}
          {menuAbierto && (
            <div className="absolute bottom-full left-1/2 mb-3 w-56 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-neutral-950/95 backdrop-blur-md">
              <Link
                href="/pagos?nuevo=1"
                onClick={() => setMenuAbierto(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-100 active:bg-white/5"
              >
                <Wallet className="h-4 w-4 text-lima" />
                Nuevo pago
              </Link>
              <div className="border-t border-white/10" />
              <Link
                href="/agenda?nuevo=1"
                onClick={() => setMenuAbierto(false)}
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-neutral-100 active:bg-white/5"
              >
                <CalendarDays className="h-4 w-4 text-lima" />
                Nuevo evento
              </Link>
            </div>
          )}

          <div className="flex items-stretch">
            {IZQUIERDA.map(pestana)}

            <div className="flex flex-1 items-center justify-center">
              <button
                type="button"
                onClick={() => setMenuAbierto(!menuAbierto)}
                aria-label="Acciones rápidas"
                className="-mt-4 grid h-12 w-12 place-items-center rounded-full bg-lima text-neutral-950 shadow-lg shadow-lima/20 transition-transform active:scale-95"
              >
                <Plus
                  className={`h-6 w-6 transition-transform ${
                    menuAbierto ? "rotate-45" : ""
                  }`}
                />
              </button>
            </div>

            {DERECHA.map(pestana)}
          </div>
        </div>
      </nav>
    </>
  );
}
