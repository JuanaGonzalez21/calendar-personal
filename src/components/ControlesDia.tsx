"use client";

import { useState, useTransition } from "react";
import { cambiarTipoDia, correrDia } from "@/app/acciones";
import { NOMBRE_TIPO, type TipoDia } from "@/lib/tipos";

const TIPOS: TipoDia[] = ["A_cocina", "B_gym", "B_libre", "roto"];

export default function ControlesDia({
  dayId,
  tipo,
}: {
  dayId: string;
  tipo: TipoDia;
}) {
  const [pendiente, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState<TipoDia | null>(null);

  const cambiar = (nuevo: TipoDia) => {
    if (nuevo === tipo) return;
    setConfirmando(null);
    startTransition(async () => {
      await cambiarTipoDia(dayId, nuevo);
    });
  };

  const correr = (minutos: number) => {
    startTransition(async () => {
      await correrDia(dayId, minutos);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {TIPOS.map((t) => (
          <button
            key={t}
            type="button"
            disabled={pendiente}
            onClick={() =>
              t === tipo ? null : confirmando === t ? cambiar(t) : setConfirmando(t)
            }
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${
              t === tipo
                ? "border-lime-400 bg-lime-400 font-medium text-neutral-950"
                : confirmando === t
                  ? "border-lime-400 text-lime-400"
                  : "border-neutral-800 text-neutral-400 hover:border-neutral-600"
            }`}
          >
            {confirmando === t && t !== tipo
              ? "¿Seguro?"
              : NOMBRE_TIPO[t]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs uppercase tracking-wider text-neutral-600">
          Correr el día
        </span>
        {[30, 60, 120].map((m) => (
          <button
            key={m}
            type="button"
            disabled={pendiente}
            onClick={() => correr(m)}
            className="rounded-lg border border-neutral-800 px-2.5 py-1 font-mono text-xs text-neutral-400 transition-colors hover:border-neutral-600 hover:text-neutral-200 disabled:opacity-50"
          >
            +{m >= 60 ? `${m / 60}h` : `${m}m`}
          </button>
        ))}
      </div>
    </div>
  );
}
