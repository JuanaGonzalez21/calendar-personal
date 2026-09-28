"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { actualizarSecuencia } from "@/app/ajustes/plantillas/acciones";
import { ORDEN_TIPOS, type NombresTipo, type TipoDia } from "@/lib/tipos";

const chip =
  "flex items-center gap-1.5 rounded-lg border border-neutral-800 px-2 py-1 text-xs text-neutral-400 transition-colors active:border-neutral-600";

/**
 * Editor de la secuencia de rotación: el orden (con repetidos permitidos)
 * en que se sugiere un tipo de día. Guardar resetea el ciclo a partir de
 * hoy — así el primer paso de la lista aplica desde el momento en que
 * guardas.
 */
export default function EditorSecuencia({
  secuencia,
  nombres,
}: {
  secuencia: TipoDia[];
  nombres: NombresTipo;
}) {
  const [, startTransition] = useTransition();
  const [pasos, setPasos] = useState<TipoDia[]>(secuencia);
  const [agregando, setAgregando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cambiada =
    pasos.length !== secuencia.length ||
    pasos.some((t, i) => t !== secuencia[i]);

  const mover = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= pasos.length) return;
    const copia = [...pasos];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    setPasos(copia);
  };

  const quitar = (i: number) => {
    if (pasos.length <= 1) return;
    setPasos(pasos.filter((_, idx) => idx !== i));
  };

  const agregar = (tipo: TipoDia) => {
    setPasos([...pasos, tipo]);
    setAgregando(false);
  };

  const deshacer = () => {
    setPasos(secuencia);
    setAgregando(false);
  };

  const guardar = () => {
    if (guardando || !cambiada) return;
    setGuardando(true);
    startTransition(async () => {
      await actualizarSecuencia(pasos);
      setGuardando(false);
    });
  };

  return (
    <div className="mb-4 w-full rounded-xl border border-neutral-800 bg-neutral-900 p-3">
      <p className="mb-1 text-sm text-neutral-100">Secuencia de rotación</p>
      <p className="mb-3 text-xs text-neutral-500">
        El orden en que se sugiere el tipo de día. Se repite en ciclo y
        admite pasos repetidos. Al guardar, hoy pasa a ser el primer paso.
      </p>

      <ol className="space-y-1.5">
        {pasos.map((tipo, i) => (
          <li
            key={`${tipo}-${i}`}
            className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-2"
          >
            <span className="w-4 shrink-0 font-mono text-[11px] text-neutral-600">
              {i + 1}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm text-neutral-100">
              {nombres[tipo]}
            </span>
            <button
              type="button"
              onClick={() => mover(i, -1)}
              disabled={i === 0}
              aria-label="Subir"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-neutral-800 text-neutral-400 disabled:opacity-30"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => mover(i, 1)}
              disabled={i === pasos.length - 1}
              aria-label="Bajar"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-neutral-800 text-neutral-400 disabled:opacity-30"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => quitar(i)}
              disabled={pasos.length <= 1}
              aria-label="Quitar paso"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-neutral-800 text-neutral-400 disabled:opacity-30"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ol>

      {agregando ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ORDEN_TIPOS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => agregar(t)}
              className={chip}
            >
              {nombres[t]}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAgregando(false)}
            className="text-xs text-neutral-500 active:text-neutral-300"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAgregando(true)}
          className="mt-2 flex items-center gap-1 text-xs text-neutral-400 active:text-neutral-200"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar paso
        </button>
      )}

      {cambiada && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={deshacer}
            className="flex-1 rounded-xl border border-neutral-800 py-2.5 text-sm text-neutral-400 active:bg-neutral-800"
          >
            Deshacer
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="flex-1 rounded-xl bg-lima py-2.5 text-sm font-medium text-neutral-950 disabled:opacity-40"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      )}
    </div>
  );
}
