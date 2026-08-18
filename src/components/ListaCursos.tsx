"use client";

import { useState, useTransition } from "react";
import {
  registrarSesion,
  deshacerUltima,
  alternarActivo,
} from "@/app/cursos/acciones";
import { formatoTiempo, type CursoConTiempo } from "@/lib/tipos";

export default function ListaCursos({
  cursos,
}: {
  cursos: CursoConTiempo[];
}) {
  const [, startTransition] = useTransition();
  const [abierto, setAbierto] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [otro, setOtro] = useState("");

  const sumar = (id: string, minutos: number) => {
    setPendiente(id);
    startTransition(async () => {
      await registrarSesion(id, minutos);
      setPendiente(null);
    });
  };

  const sumarOtro = (id: string) => {
    const n = parseInt(otro, 10);
    if (!n || n <= 0) return;
    setOtro("");
    sumar(id, n);
  };

  const deshacer = (id: string) => {
    setPendiente(id);
    startTransition(async () => {
      await deshacerUltima(id);
      setPendiente(null);
    });
  };

  const archivar = (id: string) => {
    startTransition(async () => {
      await alternarActivo(id, false);
    });
  };

  return (
    <div className="w-full space-y-1.5">
      {cursos.map((c) => {
        const expandido = abierto === c.id;
        const cargando = pendiente === c.id;

        return (
          <div
            key={c.id}
            className={`w-full rounded-xl border border-neutral-800 bg-neutral-900 transition-opacity ${
              cargando ? "opacity-50" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => setAbierto(expandido ? null : c.id)}
              className="flex w-full items-center gap-2 px-3 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-neutral-100">{c.nombre}</p>
                <p className="text-xs text-neutral-500">
                  {formatoTiempo(c.minutosTotal)} en total
                  {c.minutosSemana > 0 && (
                    <span className="text-lime-400">
                      {" "}
                      · {formatoTiempo(c.minutosSemana)} esta semana
                    </span>
                  )}
                </p>
              </div>
              <span className="shrink-0 font-mono text-xs text-neutral-600">
                #{c.prioridad}
              </span>
            </button>

            {expandido && (
              <div className="space-y-3 border-t border-neutral-800 px-3 py-3">
                <div>
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-600">
                    Registrar sesión
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[25, 50, 90].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => sumar(c.id, m)}
                        disabled={cargando}
                        className="rounded-lg border border-neutral-700 px-2.5 py-1.5 font-mono text-xs text-neutral-300 transition-colors active:border-lime-400 active:text-lime-400 disabled:opacity-40"
                      >
                        +{m} min
                      </button>
                    ))}
                    <input
                      type="number"
                      inputMode="numeric"
                      value={otro}
                      onChange={(e) => setOtro(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && sumarOtro(c.id)
                      }
                      placeholder="otro"
                      className="w-16 rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1.5 text-xs text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
                    />
                    <button
                      type="button"
                      onClick={() => sumarOtro(c.id)}
                      disabled={cargando || !otro}
                      className="rounded-lg bg-neutral-800 px-2.5 py-1.5 text-xs text-neutral-300 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => deshacer(c.id)}
                    disabled={cargando || c.minutosTotal === 0}
                    className="text-xs text-neutral-500 active:text-neutral-300 disabled:opacity-40"
                  >
                    Deshacer última
                  </button>
                  <button
                    type="button"
                    onClick={() => archivar(c.id)}
                    className="text-xs text-neutral-600 active:text-neutral-400"
                  >
                    Archivar
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {cursos.length === 0 && (
        <p className="py-8 text-center text-sm text-neutral-600">
          No hay cursos activos.
        </p>
      )}
    </div>
  );
}
