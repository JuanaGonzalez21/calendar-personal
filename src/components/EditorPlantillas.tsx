"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  actualizarTarea,
  agregarTarea,
  alternarTareaActiva,
  eliminarTarea,
  intercambiarOrden,
} from "@/app/ajustes/plantillas/acciones";
import {
  COLOR_CATEGORIA,
  NOMBRE_CATEGORIA,
  NOMBRE_GRUPO,
  ORDEN_CATEGORIAS,
  ORDEN_GRUPOS,
  esTituloProtegido,
  type CamposTareaPlantilla,
  type Categoria,
  type GrupoRacha,
  type PlantillaConTareas,
  type TareaPlantilla,
} from "@/lib/tipos";
import { soloHoraMinuto, hora12 } from "@/lib/fechas";

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

function Candado({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

interface FormTarea {
  titulo: string;
  hora: string;
  categoria: Categoria;
  grupo: GrupoRacha;
  peso: string;
  duracion_min: string;
  es_minimo: boolean;
}

const FORM_NUEVA: FormTarea = {
  titulo: "",
  hora: "",
  categoria: "otros",
  grupo: "general",
  peso: "1",
  duracion_min: "",
  es_minimo: false,
};

const input =
  "w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-lima/40";
const label =
  "mb-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-600";
const chip = (sel: boolean) =>
  `flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition-colors ${
    sel
      ? "border-lima bg-lima font-medium text-neutral-950"
      : "border-neutral-800 text-neutral-400 active:border-neutral-600"
  }`;

/**
 * Campos compartidos entre editar y agregar.
 * tituloBloqueado: el título fijo cuando la tarea es protegida (null = editable).
 * esBloque1: la categoría no se elige, la pisa ajustarBloque1 al generar.
 */
function Campos({
  form,
  setForm,
  tituloBloqueado,
  esBloque1,
}: {
  form: FormTarea;
  setForm: (f: FormTarea) => void;
  tituloBloqueado: string | null;
  esBloque1: boolean;
}) {
  const tituloReservado =
    tituloBloqueado === null && esTituloProtegido(form.titulo.trim());

  return (
    <>
      <div>
        <p className={label}>Título</p>
        {tituloBloqueado !== null ? (
          <>
            <div className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-400">
              <Candado className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
              <span className="truncate">{tituloBloqueado}</span>
            </div>
            <p className="mt-1 text-[11px] text-neutral-600">
              Este nombre no se puede cambiar: la generación del día depende
              de él.
            </p>
          </>
        ) : (
          <>
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Título *"
              className={input}
            />
            {tituloReservado && (
              <p className="mt-1 text-[11px] text-amber-400/80">
                Ese nombre está reservado: la generación del día lo maneja
                sola.
              </p>
            )}
          </>
        )}
      </div>

      <div>
        <p className={label}>Hora</p>
        <input
          type="time"
          value={form.hora}
          onChange={(e) => setForm({ ...form, hora: e.target.value })}
          className={input}
        />
        <p className="mt-1 text-[11px] text-neutral-600">
          Vacía = sin hora fija.
        </p>
      </div>

      <div>
        <p className={label}>Categoría</p>
        {esBloque1 ? (
          <p className="text-[11px] text-neutral-600">
            La categoría de este bloque alterna sola entre Estudio y Proyecto
            según el día de la semana.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {ORDEN_CATEGORIAS.map((c) => {
              const sel = c === form.categoria;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, categoria: c })}
                  className={chip(sel)}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${COLOR_CATEGORIA[c]} ${
                      sel ? "opacity-70" : ""
                    }`}
                  />
                  {NOMBRE_CATEGORIA[c]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <p className={label}>Grupo</p>
        <div className="flex flex-wrap gap-1.5">
          {ORDEN_GRUPOS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setForm({ ...form, grupo: g })}
              className={chip(g === form.grupo)}
            >
              {NOMBRE_GRUPO[g]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <p className={label}>Duración (min)</p>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={form.duracion_min}
            onChange={(e) =>
              setForm({ ...form, duracion_min: e.target.value })
            }
            placeholder="—"
            className={input}
          />
        </div>
        <div className="flex-1">
          <p className={label}>Peso</p>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.25}
            value={form.peso}
            onChange={(e) => setForm({ ...form, peso: e.target.value })}
            className={input}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setForm({ ...form, es_minimo: !form.es_minimo })}
        className="flex items-center gap-2"
      >
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border transition-colors ${
            form.es_minimo ? "border-lima bg-lima" : "border-neutral-700"
          }`}
        >
          {form.es_minimo && (
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
        <span className="text-sm text-neutral-300">
          Cuenta para el mínimo del día
        </span>
      </button>
    </>
  );
}

export default function EditorPlantillas({
  plantillas,
}: {
  plantillas: PlantillaConTareas[];
}) {
  const [, startTransition] = useTransition();
  const [plantillaAbierta, setPlantillaAbierta] = useState<string | null>(null);
  const [tareaAbierta, setTareaAbierta] = useState<string | null>(null);
  const [agregandoEn, setAgregandoEn] = useState<string | null>(null);
  const [form, setForm] = useState<FormTarea | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [pendiente, setPendiente] = useState<string | null>(null);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState<string | null>(
    null,
  );

  const cerrarForm = () => {
    setTareaAbierta(null);
    setAgregandoEn(null);
    setForm(null);
    setConfirmandoEliminar(null);
  };

  const alternarPlantilla = (id: string) => {
    setPlantillaAbierta(plantillaAbierta === id ? null : id);
    cerrarForm();
  };

  const abrirTarea = (t: TareaPlantilla) => {
    setAgregandoEn(null);
    setConfirmandoEliminar(null);
    setTareaAbierta(t.id);
    setForm({
      titulo: t.titulo,
      hora: soloHoraMinuto(t.hora) ?? "",
      categoria: t.categoria,
      grupo: t.grupo,
      peso: String(t.peso),
      duracion_min: t.duracion_min == null ? "" : String(t.duracion_min),
      es_minimo: t.es_minimo,
    });
  };

  const abrirAgregar = (templateId: string) => {
    setTareaAbierta(null);
    setConfirmandoEliminar(null);
    setForm(FORM_NUEVA);
    setAgregandoEn(templateId);
  };

  const esValido = (f: FormTarea, tituloLibre: boolean) => {
    const pesoNum = Number(f.peso);
    const duracionNum = Number(f.duracion_min);
    const tituloOk =
      !tituloLibre ||
      (f.titulo.trim() !== "" && !esTituloProtegido(f.titulo.trim()));
    return (
      tituloOk &&
      f.peso.trim() !== "" &&
      Number.isFinite(pesoNum) &&
      pesoNum >= 0 &&
      (f.duracion_min === "" ||
        (Number.isInteger(duracionNum) && duracionNum >= 1))
    );
  };

  const aCampos = (f: FormTarea): CamposTareaPlantilla => ({
    hora: f.hora || null,
    categoria: f.categoria,
    grupo: f.grupo,
    peso: Number(f.peso),
    es_minimo: f.es_minimo,
    duracion_min:
      f.duracion_min === "" ? null : parseInt(f.duracion_min, 10),
  });

  const guardarEdicion = (t: TareaPlantilla) => {
    const protegida = esTituloProtegido(t.titulo);
    if (!form || guardando || !esValido(form, !protegida)) return;
    const campos = aCampos(form);
    if (!protegida) campos.titulo = form.titulo.trim();
    setGuardando(true);
    startTransition(async () => {
      await actualizarTarea(t.id, campos);
      setGuardando(false);
      cerrarForm();
    });
  };

  const guardarNueva = (templateId: string) => {
    if (!form || guardando || !esValido(form, true)) return;
    const campos = aCampos(form);
    campos.titulo = form.titulo.trim();
    setGuardando(true);
    startTransition(async () => {
      await agregarTarea(templateId, campos);
      setGuardando(false);
      cerrarForm();
    });
  };

  const alternarActiva = (t: TareaPlantilla) => {
    setPendiente(t.id);
    cerrarForm();
    startTransition(async () => {
      await alternarTareaActiva(t.id, !t.activa);
      setPendiente(null);
    });
  };

  const eliminar = (id: string) => {
    setPendiente(id);
    cerrarForm();
    startTransition(async () => {
      await eliminarTarea(id);
      setPendiente(null);
    });
  };

  const mover = (t: TareaPlantilla, vecina: TareaPlantilla | undefined) => {
    if (!vecina || pendiente) return;
    setPendiente(t.id);
    startTransition(async () => {
      await intercambiarOrden(t.id, vecina.id);
      setPendiente(null);
    });
  };

  return (
    <div className="w-full space-y-4">
      {plantillas.map((p) => {
        const expandida = plantillaAbierta === p.id;
        const activas = p.tareas.filter((t) => t.activa).length;

        return (
          <div
            key={p.id}
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900"
          >
            <button
              type="button"
              onClick={() => alternarPlantilla(p.id)}
              className="flex w-full items-center gap-2 px-3 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-neutral-100">{p.nombre}</p>
                {p.descripcion && (
                  <p className="truncate text-xs text-neutral-500">
                    {p.descripcion}
                  </p>
                )}
              </div>
              <span className="shrink-0 font-mono text-xs text-neutral-600">
                {activas} {activas === 1 ? "tarea" : "tareas"}
              </span>
            </button>

            {expandida && (
              <div className="space-y-1.5 border-t border-neutral-800 px-2 py-2">
                {p.tareas.length === 0 && agregandoEn !== p.id && (
                  <p className="py-3 text-center text-xs text-neutral-600">
                    Esta plantilla no tiene tareas.
                  </p>
                )}

                {p.tareas.map((t, i) => {
                  const protegida = esTituloProtegido(t.titulo);
                  const esBloque1 = t.titulo.startsWith("Bloque 1");
                  const abierta = tareaAbierta === t.id;
                  const cargando = pendiente === t.id;
                  const hora = soloHoraMinuto(t.hora);
                  const h12 = hora12(hora);
                  const sub = [
                    t.duracion_min ? `${t.duracion_min} min` : null,
                    `peso ${t.peso}`,
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  const fila = (
                    <>
                      <span
                        className={`h-8 w-[3px] shrink-0 rounded-full ${
                          COLOR_CATEGORIA[t.categoria]
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`truncate text-sm ${
                              t.activa ? "text-neutral-100" : "text-neutral-400"
                            }`}
                          >
                            {t.titulo}
                          </p>
                          {protegida && (
                            <Candado className="h-3 w-3 shrink-0 text-neutral-500" />
                          )}
                          {t.es_minimo && (
                            <span className="shrink-0 rounded bg-neutral-800 px-1 py-0.5 font-mono text-[10px] text-neutral-400">
                              mín
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-600">{sub}</p>
                      </div>
                      {cargando && (
                        <Spinner className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                      )}
                      {!cargando && t.activa && (
                        <span className="shrink-0 font-mono text-[13px] text-neutral-400">
                          {h12 ? (
                            <>
                              {h12.texto}
                              <span className="ml-0.5 opacity-60">
                                {h12.icono}
                              </span>
                            </>
                          ) : (
                            "—:—"
                          )}
                        </span>
                      )}
                    </>
                  );

                  return (
                    <div
                      key={t.id}
                      className={`rounded-lg border border-neutral-800 bg-neutral-950 transition-opacity ${
                        cargando || !t.activa ? "opacity-50" : ""
                      }`}
                    >
                      {t.activa ? (
                        <button
                          type="button"
                          onClick={() =>
                            abierta ? cerrarForm() : abrirTarea(t)
                          }
                          className="flex w-full items-center gap-2 px-2.5 py-2.5 text-left"
                        >
                          {fila}
                        </button>
                      ) : (
                        <div className="flex w-full items-center gap-2 px-2.5 py-2.5">
                          {fila}
                          {!cargando && (
                            <>
                              <button
                                type="button"
                                onClick={() => alternarActiva(t)}
                                className="shrink-0 text-xs text-lima/80 active:text-lima"
                              >
                                Reactivar
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  confirmandoEliminar === t.id
                                    ? eliminar(t.id)
                                    : setConfirmandoEliminar(t.id)
                                }
                                className="shrink-0 text-xs text-red-400/70 active:text-red-400"
                              >
                                {confirmandoEliminar === t.id
                                  ? "¿Seguro?"
                                  : "Eliminar"}
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {abierta && form && (
                        <div className="space-y-3 border-t border-neutral-800 px-3 py-3">
                          <Campos
                            form={form}
                            setForm={setForm}
                            tituloBloqueado={protegida ? t.titulo : null}
                            esBloque1={esBloque1}
                          />

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={cerrarForm}
                              className="flex-1 rounded-xl border border-neutral-800 py-2.5 text-sm text-neutral-400 active:bg-neutral-800"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => guardarEdicion(t)}
                              disabled={
                                guardando || !esValido(form, !protegida)
                              }
                              className="flex-1 rounded-xl bg-lima py-2.5 text-sm font-medium text-neutral-950 disabled:opacity-40"
                            >
                              {guardando ? "Guardando…" : "Guardar"}
                            </button>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => mover(t, p.tareas[i - 1])}
                                disabled={i === 0 || pendiente !== null}
                                aria-label="Subir"
                                className="grid h-7 w-7 place-items-center rounded-lg border border-neutral-800 text-neutral-400 transition-colors active:border-neutral-600 disabled:opacity-30"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => mover(t, p.tareas[i + 1])}
                                disabled={
                                  i === p.tareas.length - 1 ||
                                  pendiente !== null
                                }
                                aria-label="Bajar"
                                className="grid h-7 w-7 place-items-center rounded-lg border border-neutral-800 text-neutral-400 transition-colors active:border-neutral-600 disabled:opacity-30"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  confirmandoEliminar === t.id
                                    ? eliminar(t.id)
                                    : setConfirmandoEliminar(t.id)
                                }
                                className="text-xs text-red-400/70 active:text-red-400"
                              >
                                {confirmandoEliminar === t.id
                                  ? "¿Seguro? Es definitivo"
                                  : "Eliminar"}
                              </button>
                              <button
                                type="button"
                                onClick={() => alternarActiva(t)}
                                className="text-xs text-neutral-400 active:text-neutral-200"
                              >
                                Quitar de la plantilla
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* --------------------- Agregar tarea --------------------- */}
                {agregandoEn === p.id && form ? (
                  <div className="space-y-3 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-3">
                    <Campos
                      form={form}
                      setForm={setForm}
                      tituloBloqueado={null}
                      esBloque1={false}
                    />
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={cerrarForm}
                        className="flex-1 rounded-xl border border-neutral-800 py-2.5 text-sm text-neutral-400 active:bg-neutral-800"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => guardarNueva(p.id)}
                        disabled={guardando || !esValido(form, true)}
                        className="flex-1 rounded-xl bg-lima py-2.5 text-sm font-medium text-neutral-950 disabled:opacity-40"
                      >
                        {guardando ? "Guardando…" : "Agregar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => abrirAgregar(p.id)}
                    className="w-full rounded-lg border border-dashed border-neutral-800 py-2.5 text-sm text-neutral-500 transition-colors active:border-neutral-600 active:text-neutral-300"
                  >
                    + Agregar tarea
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
