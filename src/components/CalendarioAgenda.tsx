"use client";

import { useState, useTransition } from "react";
import {
  Briefcase,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
import { diaSemana, formatoLargo, hora12, soloHoraMinuto } from "@/lib/fechas";
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

/** Los punticos del calendario (versión bg de COLOR_TIPO). */
const PUNTO_TIPO: Record<TipoEvento, string> = {
  entrevista: "bg-lima",
  medica: "bg-rose-400/80",
  familiar: "bg-violet-400/80",
  salida: "bg-teal-400/80",
  otro: "bg-neutral-500",
};

const DIAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];

interface FormEvento {
  titulo: string;
  tipo: TipoEvento;
  fecha: string;
  hora: string;
  duracion_min: string;
  nota: string;
  bloquea_dia: boolean;
}

/** "Septiembre de 2026" para el encabezado. */
function tituloMes(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  const s = new Intl.DateTimeFormat("es-CO", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
  return s.charAt(0).toUpperCase() + s.slice(1);
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
              form.bloquea_dia ? "border-lima bg-lima" : "border-white/20"
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

export default function CalendarioAgenda({
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
  const [mesVisible, setMesVisible] = useState(hoy.slice(0, 7));
  const [diaSeleccionado, setDiaSeleccionado] = useState(hoy);
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

  /* ------------------------- Rejilla del mes ------------------------- */

  const [anio, mes] = mesVisible.split("-").map(Number);
  const numDias = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  // diaSemana: 0 = domingo … 6 = sábado → columna con lunes primero.
  const offset = (diaSemana(`${mesVisible}-01`) + 6) % 7;
  const celdas: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from(
      { length: numDias },
      (_, i) => `${mesVisible}-${String(i + 1).padStart(2, "0")}`,
    ),
  ];

  const cambiarMes = (delta: number) => {
    const d = new Date(Date.UTC(anio, mes - 1 + delta, 1));
    setMesVisible(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
    );
  };

  // Vienen ordenados por fecha y hora desde el server.
  const eventosDe = (fecha: string) => eventos.filter((e) => e.fecha === fecha);
  const delDia = eventosDe(diaSeleccionado);

  /* --------------------------- Formulario ---------------------------- */

  const vacio = (): FormEvento => ({
    titulo: "",
    tipo: "otro",
    fecha: diaSeleccionado,
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

  const formulario = (
    <>
      {form && (
        <>
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
        </>
      )}
    </>
  );

  return (
    <div className="w-full space-y-4">
      {/* ------------------------- Calendario ------------------------- */}
      <GlassCard className="p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => cambiarMes(-1)}
            aria-label="Mes anterior"
            className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 transition-colors active:bg-white/5 active:text-neutral-200"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-medium text-neutral-100">
            {tituloMes(mesVisible)}
          </p>
          <button
            type="button"
            onClick={() => cambiarMes(1)}
            aria-label="Mes siguiente"
            className="grid h-8 w-8 place-items-center rounded-lg text-neutral-400 transition-colors active:bg-white/5 active:text-neutral-200"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7">
          {DIAS_SEMANA.map((d, i) => (
            <p
              key={i}
              className="text-center font-mono text-[10px] uppercase text-neutral-600"
            >
              {d}
            </p>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-0.5">
          {celdas.map((fecha, i) => {
            if (!fecha) return <div key={i} />;
            const sel = fecha === diaSeleccionado;
            const esHoy = fecha === hoy;
            const tipos = [
              ...new Set(eventosDe(fecha).map((e) => e.tipo)),
            ].slice(0, 3);

            return (
              <button
                key={fecha}
                type="button"
                onClick={() => setDiaSeleccionado(fecha)}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg text-[13px] transition-colors ${
                  sel
                    ? "bg-lima font-semibold text-neutral-950"
                    : esHoy
                      ? "border border-lima/50 font-medium text-lima"
                      : "text-neutral-300 active:bg-white/5"
                }`}
              >
                {Number(fecha.slice(8))}
                <span className="mt-0.5 flex h-1 gap-0.5">
                  {tipos.map((t) => (
                    <span
                      key={t}
                      className={`h-1 w-1 rounded-full ${
                        sel ? "bg-neutral-950/60" : PUNTO_TIPO[t]
                      }`}
                    />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* ---------------------- Día seleccionado ---------------------- */}
      <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
        {diaSeleccionado === hoy ? "Hoy" : formatoLargo(diaSeleccionado)}
      </p>

      {creando ? (
        <GlassCard className="space-y-3 p-3">{formulario}</GlassCard>
      ) : (
        <button
          type="button"
          onClick={abrirCrear}
          className="w-full rounded-2xl border border-dashed border-white/15 py-3 text-sm text-neutral-500 transition-colors active:border-white/30 active:text-neutral-300"
        >
          + Agendar evento
        </button>
      )}

      {delDia.length === 0 && !creando && (
        <p className="py-4 text-center text-sm text-neutral-600">
          Nada agendado este día.
        </p>
      )}

      <div className="space-y-1.5">
        {delDia.map((e) => {
          const abierto = editando === e.id;
          const eliminando = borrando === e.id;
          const Icono = ICONO_TIPO[e.tipo];
          const h12 = hora12(soloHoraMinuto(e.hora));

          return (
            <GlassCard
              key={e.id}
              className={`transition-all duration-300 ${
                eliminando ? "pointer-events-none scale-95 opacity-40" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => (abierto ? cerrar() : abrirEditar(e))}
                className="flex w-full items-center gap-2.5 px-3 py-3 text-left"
              >
                <Icono className={`h-4 w-4 shrink-0 ${COLOR_TIPO[e.tipo]}`} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-neutral-100">
                    {e.titulo}
                  </p>
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
                    <p className="truncate text-xs text-neutral-600">
                      {e.nota}
                    </p>
                  )}
                </div>

                <span className="shrink-0 font-mono text-[13px] text-neutral-400">
                  {h12 ? (
                    <>
                      {h12.texto}
                      <span className="ml-0.5 opacity-60">{h12.icono}</span>
                    </>
                  ) : (
                    <span className="text-neutral-600">—:—</span>
                  )}
                </span>
              </button>

              {abierto && (
                <div className="space-y-3 border-t border-white/10 px-3 py-3">
                  {formulario}
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        confirmandoBorrar
                          ? borrar(e.id)
                          : setConfirmandoBorrar(true)
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
        })}
      </div>
    </div>
  );
}
