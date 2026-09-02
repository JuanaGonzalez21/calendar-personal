"use client";

import { useState, useTransition } from "react";
import {
  Briefcase,
  CalendarDays,
  MapPin,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  actualizarEvento,
  crearEvento,
  eliminarEvento,
} from "@/app/agenda/acciones";
import {
  NOMBRE_TIPO_EVENTO,
  ORDEN_TIPOS_EVENTO,
  type DatosEvento,
  type Evento,
  type TipoEvento,
} from "@/lib/tipos";
import { formatoLargo, hora12, soloHoraMinuto, sumarDias } from "@/lib/fechas";
import GlassCard from "./GlassCard";

const ICONO_TIPO: Record<TipoEvento, LucideIcon> = {
  medica: Stethoscope,
  entrevista: Briefcase,
  familiar: Users,
  salida: MapPin,
  otro: CalendarDays,
};

/** Entrevista en lima (que resalte); el resto en tonos sobrios. */
const COLOR_TIPO: Record<TipoEvento, string> = {
  entrevista: "text-lima",
  medica: "text-rose-400/80",
  familiar: "text-violet-400/80",
  salida: "text-teal-400/80",
  otro: "text-neutral-500",
};

interface FormEvento {
  titulo: string;
  tipo: TipoEvento;
  fecha: string;
  hora: string;
  duracion_min: string;
  nota: string;
  bloquea_dia: boolean;
}

/** "17 ago" — para la columna de fecha en pasados. */
function fechaCortita(fecha: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

const input =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-lima/40";
const label =
  "mb-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-600";
const chip = (sel: boolean) =>
  `flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition-colors ${
    sel
      ? "border-lima bg-lima font-medium text-neutral-950"
      : "border-white/10 text-neutral-400 active:border-white/30"
  }`;

function Campos({
  form,
  setForm,
}: {
  form: FormEvento;
  setForm: (f: FormEvento) => void;
}) {
  return (
    <>
      <input
        autoFocus
        value={form.titulo}
        onChange={(e) => setForm({ ...form, titulo: e.target.value })}
        placeholder="Título *"
        className={input}
      />

      <div>
        <p className={label}>Tipo</p>
        <div className="flex flex-wrap gap-1.5">
          {ORDEN_TIPOS_EVENTO.map((t) => {
            const Icono = ICONO_TIPO[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, tipo: t })}
                className={chip(t === form.tipo)}
              >
                <Icono className="h-3 w-3" />
                {NOMBRE_TIPO_EVENTO[t]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <p className={label}>Fecha *</p>
          <input
            type="date"
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            className={input}
          />
        </div>
        <div className="flex-1">
          <p className={label}>Hora</p>
          <input
            type="time"
            value={form.hora}
            onChange={(e) => setForm({ ...form, hora: e.target.value })}
            className={input}
          />
        </div>
      </div>

      <div>
        <p className={label}>Duración (min)</p>
        <input
          type="number"
          inputMode="numeric"
          min={1}
          value={form.duracion_min}
          onChange={(e) => setForm({ ...form, duracion_min: e.target.value })}
          placeholder="—"
          className={input}
        />
      </div>

      <input
        value={form.nota}
        onChange={(e) => setForm({ ...form, nota: e.target.value })}
        placeholder="Nota"
        className={input}
      />

      <div>
        <button
          type="button"
          onClick={() => setForm({ ...form, bloquea_dia: !form.bloquea_dia })}
          className="flex items-center gap-2"
        >
          <span
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border transition-colors ${
              form.bloquea_dia
                ? "border-lima bg-lima"
                : "border-white/20"
            }`}
          >
            {form.bloquea_dia && (
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
          </span>
          <span className="text-sm text-neutral-300">Bloquea el día</span>
        </button>
        <p className="mt-1 text-[11px] text-neutral-600">
          Aún no cambia la generación del día; por ahora solo se guarda la
          intención de marcarlo como roto.
        </p>
      </div>
    </>
  );
}

export default function ListaAgenda({
  eventos,
  hoy,
  abrirNuevo = false,
}: {
  eventos: Evento[];
  hoy: string;
  /** Abre el formulario de agendar al llegar con ?nuevo=1 (el "+" de la TabBar). */
  abrirNuevo?: boolean;
}) {
  const [, startTransition] = useTransition();
  const [creando, setCreando] = useState(abrirNuevo);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState<FormEvento | null>(() =>
    abrirNuevo
      ? {
          titulo: "",
          tipo: "otro",
          fecha: hoy,
          hora: "",
          duracion_min: "",
          nota: "",
          bloquea_dia: false,
        }
      : null,
  );
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [verPasados, setVerPasados] = useState(false);

  // Vienen ordenados por fecha y hora desde el server.
  const futuros = eventos.filter((e) => e.fecha >= hoy);
  const pasados = eventos.filter((e) => e.fecha < hoy).reverse();

  const vacio = (): FormEvento => ({
    titulo: "",
    tipo: "otro",
    fecha: hoy,
    hora: "",
    duracion_min: "",
    nota: "",
    bloquea_dia: false,
  });

  const abrirCrear = () => {
    setEditando(null);
    setConfirmandoBorrar(false);
    setForm(vacio());
    setCreando(true);
  };

  const abrirEditar = (e: Evento) => {
    setCreando(false);
    setConfirmandoBorrar(false);
    setForm({
      titulo: e.titulo,
      tipo: e.tipo,
      fecha: e.fecha,
      hora: soloHoraMinuto(e.hora) ?? "",
      duracion_min: e.duracion_min === null ? "" : String(e.duracion_min),
      nota: e.nota ?? "",
      bloquea_dia: e.bloquea_dia,
    });
    setEditando(e.id);
  };

  const cerrar = () => {
    setCreando(false);
    setEditando(null);
    setForm(null);
    setConfirmandoBorrar(false);
  };

  const valido =
    form !== null &&
    form.titulo.trim() !== "" &&
    form.fecha !== "" &&
    (form.duracion_min === "" ||
      (Number.isInteger(Number(form.duracion_min)) &&
        Number(form.duracion_min) >= 1));

  const guardar = () => {
    if (!form || !valido || guardando) return;
    const id = editando;
    const datos: DatosEvento = {
      titulo: form.titulo.trim(),
      tipo: form.tipo,
      fecha: form.fecha,
      hora: form.hora || null,
      duracion_min:
        form.duracion_min === "" ? null : parseInt(form.duracion_min, 10),
      nota: form.nota.trim() || null,
      bloquea_dia: form.bloquea_dia,
    };
    setGuardando(true);
    startTransition(async () => {
      if (id) await actualizarEvento(id, datos);
      else await crearEvento(datos);
      setGuardando(false);
      cerrar();
    });
  };

  const borrar = (id: string) => {
    setBorrando(id);
    cerrar();
    startTransition(async () => {
      await eliminarEvento(id);
      setBorrando(null);
    });
  };

  const tituloFecha = (fecha: string) => {
    if (fecha === hoy) return "Hoy";
    if (fecha === sumarDias(hoy, 1)) return "Mañana";
    return formatoLargo(fecha);
  };

  const tarjeta = (e: Evento, pasado: boolean) => {
    const abierto = editando === e.id;
    const eliminando = borrando === e.id;
    const Icono = ICONO_TIPO[e.tipo];
    const h12 = hora12(soloHoraMinuto(e.hora));

    return (
      <GlassCard
        key={e.id}
        className={`transition-all duration-300 ${
          eliminando ? "pointer-events-none scale-95 opacity-40" : ""
        } ${pasado && !abierto ? "opacity-50" : ""}`}
      >
        <button
          type="button"
          onClick={() => (abierto ? cerrar() : abrirEditar(e))}
          className="flex w-full items-center gap-2.5 px-3 py-3 text-left"
        >
          <Icono className={`h-4 w-4 shrink-0 ${COLOR_TIPO[e.tipo]}`} />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-neutral-100">{e.titulo}</p>
            <p className="truncate text-xs text-neutral-500">
              {NOMBRE_TIPO_EVENTO[e.tipo]}
              {e.duracion_min ? ` · ${e.duracion_min} min` : ""}
              {e.bloquea_dia && (
                <span className="ml-1.5 rounded bg-white/5 px-1 py-0.5 font-mono text-[10px] text-red-400/70">
                  bloquea el día
                </span>
              )}
            </p>
            {e.nota && (
              <p className="truncate text-xs text-neutral-600">{e.nota}</p>
            )}
          </div>

          <div className="shrink-0 text-right font-mono text-[13px] text-neutral-400">
            {pasado && (
              <p className="text-[11px] text-neutral-500">
                {fechaCortita(e.fecha)}
              </p>
            )}
            {h12 ? (
              <p>
                {h12.texto}
                <span className="ml-0.5 opacity-60">{h12.icono}</span>
              </p>
            ) : (
              <p className="text-neutral-600">—:—</p>
            )}
          </div>
        </button>

        {abierto && form && (
          <div className="space-y-3 border-t border-white/10 px-3 py-3">
            <Campos form={form} setForm={setForm} />
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={cerrar}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-neutral-400 active:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardar}
                disabled={guardando || !valido}
                className="flex-1 rounded-xl bg-lima py-2.5 text-sm font-medium text-neutral-950 disabled:opacity-40"
              >
                {guardando ? "Guardando…" : "Guardar"}
              </button>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() =>
                  confirmandoBorrar ? borrar(e.id) : setConfirmandoBorrar(true)
                }
                className="text-xs text-red-400/70 active:text-red-400"
              >
                {confirmandoBorrar ? "¿Seguro? Toca otra vez" : "Borrar"}
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* ------------------------- Registrar ------------------------- */}
      {creando && form ? (
        <GlassCard className="space-y-3 p-3">
          <Campos form={form} setForm={setForm} />
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={cerrar}
              className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-neutral-400 active:bg-white/5"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || !valido}
              className="flex-1 rounded-xl bg-lima py-2.5 text-sm font-medium text-neutral-950 disabled:opacity-40"
            >
              {guardando ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </GlassCard>
      ) : (
        <button
          type="button"
          onClick={abrirCrear}
          className="w-full rounded-2xl border border-dashed border-white/15 py-3 text-sm text-neutral-500 transition-colors active:border-white/30 active:text-neutral-300"
        >
          + Agendar evento
        </button>
      )}

      {futuros.length === 0 && !creando && (
        <p className="py-8 text-center text-sm text-neutral-600">
          No hay eventos próximos.
        </p>
      )}

      {/* ------------------------- Próximos -------------------------- */}
      <div className="space-y-1.5">
        {futuros.map((e, i) => {
          const conEncabezado = i === 0 || futuros[i - 1].fecha !== e.fecha;
          return (
            <div key={e.id} className="space-y-1.5">
              {conEncabezado && (
                <p className="pt-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                  {tituloFecha(e.fecha)}
                </p>
              )}
              {tarjeta(e, false)}
            </div>
          );
        })}
      </div>

      {/* -------------------------- Pasados -------------------------- */}
      {pasados.length > 0 && (
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => setVerPasados(!verPasados)}
            className="w-full py-1 text-center text-xs text-neutral-600 transition-colors active:text-neutral-400"
          >
            {verPasados
              ? "Ocultar pasados"
              : `Ver pasados (${pasados.length})`}
          </button>
          {verPasados && pasados.map((e) => tarjeta(e, true))}
        </div>
      )}
    </div>
  );
}
