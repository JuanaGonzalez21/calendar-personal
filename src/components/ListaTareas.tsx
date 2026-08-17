"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  alternarTarea,
  borrarTarea,
  moverHora,
  agregarTarea,
} from "@/app/acciones";
import { COLOR_CATEGORIA, type Tarea } from "@/lib/tipos";
import { soloHoraMinuto } from "@/lib/fechas";

interface Props {
  tareas: Tarea[];
  dayId: string;
  horaActual: string;
}

export default function ListaTareas({ tareas, dayId, horaActual }: Props) {
  const [, startTransition] = useTransition();
  const [editando, setEditando] = useState<string | null>(null);
  const [nueva, setNueva] = useState("");
  const [horaNueva, setHoraNueva] = useState("");

  const [optimistas, marcarOptimista] = useOptimistic(
    tareas,
    (estado: Tarea[], { id, hecha }: { id: string; hecha: boolean }) =>
      estado.map((t) => (t.id === id ? { ...t, hecha } : t))
  );

  const alternar = (t: Tarea) => {
    startTransition(async () => {
      marcarOptimista({ id: t.id, hecha: !t.hecha });
      await alternarTarea(t.id, !t.hecha);
    });
  };

  const guardarHora = (id: string, valor: string) => {
    setEditando(null);
    startTransition(async () => {
      await moverHora(id, valor);
    });
  };

  const crear = () => {
    if (!nueva.trim()) return;
    const titulo = nueva;
    const hora = horaNueva;
    setNueva("");
    setHoraNueva("");
    startTransition(async () => {
      await agregarTarea(dayId, titulo, hora);
    });
  };

  const eliminar = (id: string) => {
    startTransition(async () => {
      await borrarTarea(id);
    });
  };

  return (
    <div className="space-y-1.5">
      {optimistas.map((t) => {
        const hora = soloHoraMinuto(t.hora);
        const esPasada = hora !== null && hora < horaActual && !t.hecha;

        return (
          <div
            key={t.id}
            className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
              t.hecha
                ? "border-neutral-900 bg-neutral-950/60"
                : esPasada
                  ? "border-amber-900/40 bg-neutral-900/60"
                  : "border-neutral-800 bg-neutral-900"
            }`}
          >
            <button
              type="button"
              onClick={() => alternar(t)}
              aria-label={t.hecha ? "Desmarcar" : "Marcar como hecha"}
              className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors ${
                t.hecha
                  ? "border-lime-400 bg-lime-400"
                  : "border-neutral-700 hover:border-lime-400"
              }`}
            >
              {t.hecha && (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 text-neutral-950"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
            </button>

            <span
              className={`h-8 w-1 shrink-0 rounded-full ${
                COLOR_CATEGORIA[t.categoria]
              } ${t.hecha ? "opacity-30" : ""}`}
            />

            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-sm ${
                  t.hecha
                    ? "text-neutral-600 line-through"
                    : "text-neutral-100"
                }`}
              >
                {t.titulo}
                {t.es_minimo && !t.hecha && (
                  <span className="ml-2 rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
                    mín
                  </span>
                )}
              </p>
              {t.duracion_min ? (
                <p className="text-xs text-neutral-600">{t.duracion_min} min</p>
              ) : null}
            </div>

            {editando === t.id ? (
              <input
                type="time"
                defaultValue={hora ?? ""}
                autoFocus
                onBlur={(e) => guardarHora(t.id, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    guardarHora(t.id, (e.target as HTMLInputElement).value);
                  }
                  if (e.key === "Escape") setEditando(null);
                }}
                className="w-24 rounded-lg border border-lime-400 bg-neutral-950 px-2 py-1 text-sm text-neutral-100 outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditando(t.id)}
                className={`shrink-0 rounded-lg px-2 py-1 font-mono text-sm transition-colors hover:bg-neutral-800 ${
                  t.hecha
                    ? "text-neutral-700"
                    : esPasada
                      ? "text-amber-400"
                      : "text-neutral-400"
                }`}
              >
                {hora ?? "—:—"}
              </button>
            )}

            <button
              type="button"
              onClick={() => eliminar(t.id)}
              aria-label="Borrar tarea"
              className="shrink-0 text-neutral-800 transition-colors hover:text-red-400"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}

      {/* Agregar tarea suelta */}
      <div className="flex items-center gap-2 pt-2">
        <input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && crear()}
          placeholder="Agregar algo suelto…"
          className="min-w-0 flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-700"
        />
        <input
          type="time"
          value={horaNueva}
          onChange={(e) => setHoraNueva(e.target.value)}
          className="w-24 rounded-xl border border-neutral-800 bg-neutral-900 px-2 py-2.5 text-sm text-neutral-100 outline-none focus:border-neutral-700"
        />
        <button
          type="button"
          onClick={crear}
          className="shrink-0 rounded-xl bg-neutral-800 px-3 py-2.5 text-sm text-neutral-300 transition-colors hover:bg-neutral-700"
        >
          +
        </button>
      </div>
    </div>
  );
}
