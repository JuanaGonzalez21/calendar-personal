"use client";

import { useState, useTransition } from "react";
import {
  registrarSesion,
  deshacerUltima,
  alternarActivo,
  crearCurso,
  actualizarCurso,
  eliminarCurso,
} from "@/app/cursos/acciones";
import {
  formatoTiempo,
  type CursoConTiempo,
  type DatosCurso,
} from "@/lib/tipos";
import GlassCard from "./GlassCard";

interface FormCurso {
  nombre: string;
  plataforma: string;
  url: string;
  prioridad: string;
  progreso: string;
}

const input =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-lima/40";
const label =
  "mb-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-600";

function Campos({
  form,
  setForm,
  conProgreso,
}: {
  form: FormCurso;
  setForm: (f: FormCurso) => void;
  conProgreso: boolean;
}) {
  return (
    <>
      <input
        autoFocus
        value={form.nombre}
        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        placeholder="Nombre *"
        className={input}
      />
      <input
        value={form.plataforma}
        onChange={(e) => setForm({ ...form, plataforma: e.target.value })}
        placeholder="Plataforma"
        className={input}
      />
      <input
        value={form.url}
        onChange={(e) => setForm({ ...form, url: e.target.value })}
        placeholder="Link"
        className={input}
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <p className={label}>Prioridad</p>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={form.prioridad}
            onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
            className={input}
          />
        </div>
        {conProgreso && (
          <div className="flex-1">
            <p className={label}>Progreso (%)</p>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={form.progreso}
              onChange={(e) => setForm({ ...form, progreso: e.target.value })}
              className={input}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default function ListaCursos({
  cursos,
}: {
  cursos: CursoConTiempo[];
}) {
  const [, startTransition] = useTransition();
  const [abierto, setAbierto] = useState<string | null>(null);
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [otro, setOtro] = useState("");
  const [creando, setCreando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState<FormCurso | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);

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

  const abrirCrear = () => {
    const siguiente = cursos.length
      ? Math.max(...cursos.map((c) => c.prioridad)) + 1
      : 1;
    setEditando(null);
    setConfirmandoBorrar(false);
    setForm({
      nombre: "",
      plataforma: "",
      url: "",
      prioridad: String(siguiente),
      progreso: "0",
    });
    setCreando(true);
  };

  const abrirEditar = (c: CursoConTiempo) => {
    setCreando(false);
    setConfirmandoBorrar(false);
    setForm({
      nombre: c.nombre,
      plataforma: c.plataforma ?? "",
      url: c.url ?? "",
      prioridad: String(c.prioridad),
      progreso: String(c.progreso),
    });
    setEditando(c.id);
  };

  const cerrarForm = () => {
    setCreando(false);
    setEditando(null);
    setForm(null);
    setConfirmandoBorrar(false);
  };

  const valido =
    form !== null &&
    form.nombre.trim() !== "" &&
    Number.isInteger(Number(form.prioridad || "0")) &&
    Number(form.prioridad || "0") >= 0 &&
    Number.isInteger(Number(form.progreso || "0")) &&
    Number(form.progreso || "0") >= 0 &&
    Number(form.progreso || "0") <= 100;

  const guardar = () => {
    if (!form || !valido || guardando) return;
    const id = editando;
    const datos: DatosCurso = {
      nombre: form.nombre.trim(),
      plataforma: form.plataforma.trim() || null,
      url: form.url.trim() || null,
      prioridad: Number(form.prioridad || "0"),
      progreso: Number(form.progreso || "0"),
    };
    setGuardando(true);
    startTransition(async () => {
      if (id) await actualizarCurso(id, datos);
      else await crearCurso(datos);
      setGuardando(false);
      cerrarForm();
    });
  };

  const borrar = (id: string) => {
    setBorrando(id);
    cerrarForm();
    setAbierto(null);
    startTransition(async () => {
      await eliminarCurso(id);
      setBorrando(null);
    });
  };

  const botonera = (
    <div className="flex gap-2 pt-1">
      <button
        type="button"
        onClick={cerrarForm}
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
  );

  return (
    <div className="w-full space-y-4">
      {/* ------------------------ Nuevo curso ------------------------ */}
      {creando && form ? (
        <GlassCard className="space-y-3 p-3">
          <Campos form={form} setForm={setForm} conProgreso={false} />
          {botonera}
        </GlassCard>
      ) : (
        <button
          type="button"
          onClick={abrirCrear}
          className="w-full rounded-2xl border border-dashed border-white/15 py-3 text-sm text-neutral-500 transition-colors active:border-white/30 active:text-neutral-300"
        >
          + Nuevo curso
        </button>
      )}

      {/* --------------------------- Lista --------------------------- */}
      <div className="space-y-1.5">
        {cursos.map((c) => {
          const expandido = abierto === c.id;
          const cargando = pendiente === c.id;
          const enEdicion = editando === c.id;
          const eliminando = borrando === c.id;

          return (
            <GlassCard
              key={c.id}
              className={`transition-all duration-300 ${
                eliminando ? "pointer-events-none scale-95 opacity-40" : ""
              } ${cargando ? "opacity-50" : ""}`}
            >
              <button
                type="button"
                onClick={() => setAbierto(expandido ? null : c.id)}
                className="flex w-full items-center gap-2 px-3 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-neutral-100">
                    {c.nombre}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatoTiempo(c.minutosTotal)} en total
                    {c.minutosSemana > 0 && (
                      <span className="text-lima">
                        {" "}
                        · {formatoTiempo(c.minutosSemana)} esta semana
                      </span>
                    )}
                    {c.progreso > 0 && ` · ${c.progreso}%`}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-neutral-600">
                  #{c.prioridad}
                </span>
              </button>

              {expandido && (
                <div className="space-y-3 border-t border-white/10 px-3 py-3">
                  {enEdicion && form ? (
                    <>
                      <Campos
                        form={form}
                        setForm={setForm}
                        conProgreso={true}
                      />
                      {botonera}
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() =>
                            confirmandoBorrar
                              ? borrar(c.id)
                              : setConfirmandoBorrar(true)
                          }
                          className="text-xs text-red-400/70 active:text-red-400"
                        >
                          {confirmandoBorrar
                            ? "¿Seguro? Borra también su tiempo"
                            : "Eliminar curso"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
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
                              className="rounded-lg border border-white/15 px-2.5 py-1.5 font-mono text-xs text-neutral-300 transition-colors active:border-lima active:text-lima disabled:opacity-40"
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
                            className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-lima/40"
                          />
                          <button
                            type="button"
                            onClick={() => sumarOtro(c.id)}
                            disabled={cargando || !otro}
                            className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs text-neutral-300 disabled:opacity-40"
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
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => abrirEditar(c)}
                            className="text-xs text-neutral-400 active:text-neutral-200"
                          >
                            Editar
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
                    </>
                  )}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {cursos.length === 0 && !creando && (
        <p className="py-8 text-center text-sm text-neutral-600">
          No hay cursos activos.
        </p>
      )}
    </div>
  );
}
