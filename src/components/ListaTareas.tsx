"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  alternarTarea,
  borrarTarea,
  moverHora,
  agregarTarea,
} from "@/app/acciones";
import { COLOR_CATEGORIA, type Tarea } from "@/lib/tipos";
import { soloHoraMinuto, hora12 } from "@/lib/fechas";

interface Props {
  tareas: Tarea[];
  dayId: string;
  horaActual: string;
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ListaTareas({ tareas, dayId, horaActual }: Props) {
  const [, startTransition] = useTransition();
  const [editando, setEditando] = useState<string | null>(null);
  const [porBorrar, setPorBorrar] = useState<string | null>(null);
  const [borrando, setBorrando] = useState<Set<string>>(new Set());
  const [creando, setCreando] = useState(false);
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
    if (!nueva.trim() || creando) return;
    const titulo = nueva;
    const hora = horaNueva;
    setCreando(true);
    startTransition(async () => {
      await agregarTarea(dayId, titulo, hora);
      setNueva("");
      setHoraNueva("");
      setCreando(false);
    });
  };

  const confirmarBorrado = (id: string) => {
    setPorBorrar(null);
    setBorrando((s) => new Set(s).add(id));
    startTransition(async () => {
      await borrarTarea(id);
    });
  };

  return (
    <div className="w-full space-y-1.5">
      {optimistas.map((t) => {
        const hora = soloHoraMinuto(t.hora);
        const h12 = hora12(hora);
        const esPasada = hora !== null && hora < horaActual && !t.hecha;
        const seEstaBorrando = borrando.has(t.id);
        const preguntando = porBorrar === t.id;

        return (
          <div
            key={t.id}
            className={`flex w-full items-center gap-2 rounded-xl border px-2 py-2.5 transition-all duration-300 ${
              preguntando
                ? "border-red-900/70 bg-red-950/20"
                : t.hecha
                  ? "border-neutral-900 bg-neutral-950/60"
                  : esPasada
                    ? "border-amber-900/40 bg-neutral-900/60"
                    : "border-neutral-800 bg-neutral-900"
            } ${
              seEstaBorrando ? "pointer-events-none scale-95 opacity-40" : ""
            }`}
          >
            {preguntando ? (
              <>
                <p className="min-w-0 flex-1 truncate pl-1 text-sm text-neutral-300">
                  ¿Borrar?
                </p>
                <button
                  type="button"
                  onClick={() => setPorBorrar(null)}
                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm text-neutral-400 transition-colors active:bg-neutral-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => confirmarBorrado(t.id)}
                  className="shrink-0 rounded-lg bg-red-500/90 px-2.5 py-1.5 text-sm font-medium text-white transition-colors active:bg-red-600"
                >
                  Borrar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => alternar(t)}
                  aria-label={t.hecha ? "Desmarcar" : "Marcar como hecha"}
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border transition-colors ${
                    t.hecha
                      ? "border-lime-400 bg-lime-400"
                      : "border-neutral-700 active:border-lime-400"
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
                  className={`h-8 w-[3px] shrink-0 rounded-full ${
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
                      <span className="ml-1.5 rounded bg-neutral-800 px-1 py-0.5 font-mono text-[10px] text-neutral-400">
                        mín
                      </span>
                    )}
                  </p>
                  {t.duracion_min ? (
                    <p className="text-xs text-neutral-600">
                      {t.duracion_min} min
                    </p>
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
                    className="w-[78px] shrink-0 rounded-lg border border-lime-400 bg-neutral-950 px-1 py-1 text-xs text-neutral-100 outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditando(t.id)}
                    className={`shrink-0 rounded-lg px-1 py-1 text-right font-mono text-[13px] leading-tight transition-colors active:bg-neutral-800 ${
                      t.hecha
                        ? "text-neutral-700"
                        : esPasada
                          ? "text-amber-400"
                          : "text-neutral-400"
                    }`}
                  >
                    {h12 ? (
                      <>
                        {h12.texto}
                        <span className="ml-0.5 opacity-60">{h12.icono}</span>
                      </>
                    ) : (
                      "—:—"
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setPorBorrar(t.id)}
                  disabled={seEstaBorrando}
                  aria-label="Borrar tarea"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-neutral-700 transition-colors active:text-red-400"
                >
                  {seEstaBorrando ? (
                    <Spinner className="h-3.5 w-3.5 text-neutral-400" />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </>
            )}
          </div>
        );
      })}

      {/* Agregar tarea suelta */}
      <div className="flex w-full items-center gap-2 pt-2">
        <input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && crear()}
          disabled={creando}
          placeholder="Agregar algo suelto…"
          className="min-w-0 flex-1 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-700 disabled:opacity-50"
        />
        <input
          type="time"
          value={horaNueva}
          onChange={(e) => setHoraNueva(e.target.value)}
          disabled={creando}
          className="w-[78px] shrink-0 rounded-xl border border-neutral-800 bg-neutral-900 px-1 py-2.5 text-xs text-neutral-100 outline-none focus:border-neutral-700 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={crear}
          disabled={creando}
          aria-label="Agregar tarea"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neutral-800 text-lg text-neutral-300 transition-colors active:bg-neutral-700 disabled:opacity-50"
        >
          {creando ? <Spinner className="h-4 w-4" /> : "+"}
        </button>
      </div>
    </div>
  );
}
