"use client";

import { useState, useTransition } from "react";
import {
  crearPostulacion,
  cambiarFase,
  cambiarEstado,
  borrarPostulacion,
} from "@/app/postulaciones/acciones";
import {
  FASE_CORTA,
  NOMBRE_ESTADO,
  NOMBRE_FASE,
  ORDEN_FASES,
  type EstadoProceso,
  type Fase,
  type Postulacion,
} from "@/lib/tipos";

interface Props {
  postulaciones: Postulacion[];
  /** Fecha de hoy en Bogotá, para calcular los 14 días. */
  hoy: string;
}

function diasDesde(desde: string, hasta: string): number {
  const [y1, m1, d1] = desde.split("-").map(Number);
  const [y2, m2, d2] = hasta.split("-").map(Number);
  return Math.round(
    (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000
  );
}

const COLOR_ESTADO: Record<EstadoProceso, string> = {
  en_proceso: "text-lime-400 border-lime-400/40 bg-lime-400/10",
  cerrada: "text-neutral-500 border-neutral-700 bg-neutral-800/50",
  sin_respuesta: "text-amber-400 border-amber-400/40 bg-amber-400/10",
};

export default function ListaPostulaciones({ postulaciones, hoy }: Props) {
  const [, startTransition] = useTransition();
  const [abierta, setAbierta] = useState<string | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    empresa: "",
    cargo: "",
    fuente: "",
    url: "",
  });

  const guardar = () => {
    if (!form.empresa.trim() || guardando) return;
    setGuardando(true);
    const datos = { ...form };
    startTransition(async () => {
      await crearPostulacion(datos);
      setForm({ empresa: "", cargo: "", fuente: "", url: "" });
      setMostrarForm(false);
      setGuardando(false);
    });
  };

  const avanzar = (id: string, fase: Fase) => {
    startTransition(async () => {
      await cambiarFase(id, fase);
    });
  };

  const marcarEstado = (id: string, estado: EstadoProceso) => {
    startTransition(async () => {
      await cambiarEstado(id, estado);
    });
  };

  const eliminar = (id: string) => {
    setAbierta(null);
    startTransition(async () => {
      await borrarPostulacion(id);
    });
  };

  const input =
    "w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-neutral-700";

  return (
    <div className="w-full space-y-4">
      {/* ------------------------- Formulario ------------------------- */}
      {mostrarForm ? (
        <div className="space-y-2 rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3">
          <input
            autoFocus
            value={form.empresa}
            onChange={(e) => setForm({ ...form, empresa: e.target.value })}
            placeholder="Empresa *"
            className={input}
          />
          <input
            value={form.cargo}
            onChange={(e) => setForm({ ...form, cargo: e.target.value })}
            placeholder="Cargo"
            className={input}
          />
          <div className="flex gap-2">
            <input
              value={form.fuente}
              onChange={(e) => setForm({ ...form, fuente: e.target.value })}
              placeholder="Fuente"
              className={input}
            />
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="Link"
              className={input}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="flex-1 rounded-xl border border-neutral-800 py-2.5 text-sm text-neutral-400 active:bg-neutral-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || !form.empresa.trim()}
              className="flex-1 rounded-xl bg-lime-400 py-2.5 text-sm font-medium text-neutral-950 disabled:opacity-40"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setMostrarForm(true)}
          className="w-full rounded-xl border border-dashed border-neutral-800 py-3 text-sm text-neutral-500 transition-colors active:border-neutral-600 active:text-neutral-300"
        >
          + Registrar postulación
        </button>
      )}

      {/* --------------------------- Lista ---------------------------- */}
      {postulaciones.length === 0 && !mostrarForm && (
        <p className="py-8 text-center text-sm text-neutral-600">
          Todavía no hay postulaciones registradas.
        </p>
      )}

      <div className="space-y-1.5">
        {postulaciones.map((p) => {
          const dias = diasDesde(p.ultimo_movimiento, hoy);
          // "Sin respuesta" se deduce al leer: 14 días quieta y sigue en proceso.
          const estadoReal: EstadoProceso =
            p.estado === "en_proceso" && dias >= 14
              ? "sin_respuesta"
              : p.estado;

          const expandida = abierta === p.id;
          const idx = ORDEN_FASES.indexOf(p.fase);

          return (
            <div
              key={p.id}
              className="w-full rounded-xl border border-neutral-800 bg-neutral-900"
            >
              <button
                type="button"
                onClick={() => setAbierta(expandida ? null : p.id)}
                className="flex w-full items-center gap-2 px-3 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-neutral-100">
                    {p.empresa}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {p.cargo ?? "—"}
                    {p.fuente ? ` · ${p.fuente}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-neutral-800 px-1.5 py-0.5 font-mono text-[10px] text-neutral-300">
                  {FASE_CORTA[p.fase]}
                </span>
                <span
                  className={`shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] ${COLOR_ESTADO[estadoReal]}`}
                >
                  {estadoReal === "en_proceso"
                    ? `${dias}d`
                    : estadoReal === "cerrada"
                      ? "cerrada"
                      : "sin resp."}
                </span>
              </button>

              {expandida && (
                <div className="space-y-3 border-t border-neutral-800 px-3 py-3">
                  <div>
                    <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-600">
                      Fase
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ORDEN_FASES.map((f, i) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => avanzar(p.id, f)}
                          className={`rounded-lg border px-2 py-1 text-xs transition-colors ${
                            f === p.fase
                              ? "border-lime-400 bg-lime-400 font-medium text-neutral-950"
                              : i < idx
                                ? "border-neutral-700 text-neutral-500"
                                : "border-neutral-800 text-neutral-400 active:border-neutral-600"
                          }`}
                        >
                          {NOMBRE_FASE[f]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-600">
                      Estado
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        ["en_proceso", "cerrada", "sin_respuesta"] as const
                      ).map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => marcarEstado(p.id, e)}
                          className={`rounded-lg border px-2 py-1 text-xs transition-colors ${
                            e === p.estado
                              ? "border-neutral-500 bg-neutral-800 text-neutral-100"
                              : "border-neutral-800 text-neutral-500 active:border-neutral-600"
                          }`}
                        >
                          {NOMBRE_ESTADO[e]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="font-mono text-[10px] text-neutral-600">
                      {p.fecha} · {dias}d sin movimiento
                    </p>
                    <div className="flex gap-3">
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-neutral-400 underline"
                        >
                          Abrir
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => eliminar(p.id)}
                        className="text-xs text-red-400/70 active:text-red-400"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
