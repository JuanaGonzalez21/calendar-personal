"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Check, Home, Receipt, Repeat, type LucideIcon } from "lucide-react";
import {
  actualizarPago,
  alternarPagado,
  crearPago,
  eliminarPago,
} from "@/app/pagos/acciones";
import {
  NOMBRE_CATEGORIA_PAGO,
  NOMBRE_RESPONSABLE,
  ORDEN_CATEGORIAS_PAGO,
  ORDEN_RESPONSABLES,
  formatoCOP,
  type CategoriaPago,
  type DatosPago,
  type Pago,
} from "@/lib/tipos";
import { estaPendiente, estaVencido } from "@/lib/pagos";
import GlassCard from "./GlassCard";

const ICONO_CATEGORIA: Record<CategoriaPago, LucideIcon> = {
  fijo: Home,
  suscripcion: Repeat,
  extra: Receipt,
};

interface FormPago {
  concepto: string;
  monto: string;
  categoria: CategoriaPago;
  recurrente: boolean;
  dia_mes: string;
  fecha_venc: string;
  responsable: Pago["responsable"];
  nota: string;
}

const FORM_VACIO: FormPago = {
  concepto: "",
  monto: "",
  categoria: "fijo",
  recurrente: true,
  dia_mes: "",
  fecha_venc: "",
  responsable: "compartido",
  nota: "",
};

/** "17 ago." — para la columna de vencimiento. */
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
  form: FormPago;
  setForm: (f: FormPago) => void;
}) {
  return (
    <>
      <input
        autoFocus
        value={form.concepto}
        onChange={(e) => setForm({ ...form, concepto: e.target.value })}
        placeholder="Concepto *"
        className={input}
      />
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={form.monto}
        onChange={(e) => setForm({ ...form, monto: e.target.value })}
        placeholder="Monto (COP) — opcional"
        className={input}
      />

      <div>
        <p className={label}>Tipo</p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setForm({ ...form, recurrente: true })}
            className={chip(form.recurrente)}
          >
            Recurrente
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, recurrente: false })}
            className={chip(!form.recurrente)}
          >
            Puntual
          </button>
        </div>
      </div>

      {form.recurrente ? (
        <div>
          <p className={label}>Día del mes</p>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={form.dia_mes}
            onChange={(e) => setForm({ ...form, dia_mes: e.target.value })}
            placeholder="1-31"
            className={input}
          />
        </div>
      ) : (
        <div>
          <p className={label}>Vence</p>
          <input
            type="date"
            value={form.fecha_venc}
            onChange={(e) => setForm({ ...form, fecha_venc: e.target.value })}
            className={input}
          />
        </div>
      )}

      <div>
        <p className={label}>Categoría</p>
        <div className="flex flex-wrap gap-1.5">
          {ORDEN_CATEGORIAS_PAGO.map((c) => {
            const Icono = ICONO_CATEGORIA[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => setForm({ ...form, categoria: c })}
                className={chip(c === form.categoria)}
              >
                <Icono className="h-3 w-3" />
                {NOMBRE_CATEGORIA_PAGO[c]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className={label}>Responsable</p>
        <div className="flex flex-wrap gap-1.5">
          {ORDEN_RESPONSABLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setForm({ ...form, responsable: r })}
              className={chip(r === form.responsable)}
            >
              {NOMBRE_RESPONSABLE[r]}
            </button>
          ))}
        </div>
      </div>

      <input
        value={form.nota}
        onChange={(e) => setForm({ ...form, nota: e.target.value })}
        placeholder="Nota"
        className={input}
      />
    </>
  );
}

export default function ListaPagos({
  pagos,
  hoy,
  abrirNuevo = false,
}: {
  pagos: Pago[];
  hoy: string;
  /** Abre el formulario de registrar al llegar con ?nuevo=1 (el "+" de la TabBar). */
  abrirNuevo?: boolean;
}) {
  const [, startTransition] = useTransition();
  const [creando, setCreando] = useState(abrirNuevo);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState<FormPago>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);

  const [optimistas, alternarOptimista] = useOptimistic(
    pagos,
    (estado: Pago[], id: string) =>
      estado.map((p) =>
        p.id === id
          ? {
              ...p,
              pagado_at: estaPendiente(p, hoy)
                ? new Date().toISOString()
                : null,
            }
          : p,
      ),
  );

  const marcar = (p: Pago) => {
    startTransition(async () => {
      alternarOptimista(p.id);
      await alternarPagado(p.id);
    });
  };

  const abrirCrear = () => {
    setEditando(null);
    setConfirmandoBorrar(false);
    setForm(FORM_VACIO);
    setCreando(true);
  };

  const abrirEditar = (p: Pago) => {
    setCreando(false);
    setConfirmandoBorrar(false);
    setForm({
      concepto: p.concepto,
      monto: p.monto === null ? "" : String(p.monto),
      categoria: p.categoria,
      recurrente: p.recurrente,
      dia_mes: p.dia_mes === null ? "" : String(p.dia_mes),
      fecha_venc: p.fecha_venc ?? "",
      responsable: p.responsable,
      nota: p.nota ?? "",
    });
    setEditando(p.id);
  };

  const cerrar = () => {
    setCreando(false);
    setEditando(null);
    setConfirmandoBorrar(false);
  };

  const aDatos = (f: FormPago): DatosPago => ({
    concepto: f.concepto.trim(),
    monto: f.monto.trim() === "" ? null : Number(f.monto),
    categoria: f.categoria,
    recurrente: f.recurrente,
    dia_mes:
      f.recurrente && f.dia_mes !== "" ? parseInt(f.dia_mes, 10) : null,
    fecha_venc: !f.recurrente && f.fecha_venc ? f.fecha_venc : null,
    responsable: f.responsable,
    nota: f.nota.trim() || null,
  });

  const montoNum = Number(form.monto);
  const diaNum = Number(form.dia_mes);
  const valido =
    form.concepto.trim() !== "" &&
    (form.monto.trim() === "" ||
      (Number.isFinite(montoNum) && montoNum >= 0)) &&
    (!form.recurrente ||
      form.dia_mes === "" ||
      (Number.isInteger(diaNum) && diaNum >= 1 && diaNum <= 31));

  const guardar = () => {
    if (!valido || guardando) return;
    const id = editando;
    const datos = aDatos(form);
    setGuardando(true);
    startTransition(async () => {
      if (id) await actualizarPago(id, datos);
      else await crearPago(datos);
      setGuardando(false);
      cerrar();
    });
  };

  const borrar = (id: string) => {
    setBorrando(id);
    cerrar();
    startTransition(async () => {
      await eliminarPago(id);
      setBorrando(null);
    });
  };

  return (
    <div className="w-full space-y-4">
      {/* ------------------------- Registrar ------------------------- */}
      {creando ? (
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
          + Registrar pago
        </button>
      )}

      {optimistas.length === 0 && !creando && (
        <p className="py-8 text-center text-sm text-neutral-600">
          Todavía no hay pagos registrados.
        </p>
      )}

      {/* --------------------------- Lista --------------------------- */}
      <div className="space-y-1.5">
        {optimistas.map((p) => {
          const pendiente = estaPendiente(p, hoy);
          const vencido = estaVencido(p, hoy);
          const abierto = editando === p.id;
          const eliminando = borrando === p.id;
          const Icono = ICONO_CATEGORIA[p.categoria];

          return (
            <GlassCard
              key={p.id}
              className={`transition-all duration-300 ${
                eliminando ? "pointer-events-none scale-95 opacity-40" : ""
              } ${!pendiente && !abierto ? "opacity-50" : ""}`}
            >
              <div className="flex w-full items-center gap-2 px-3 py-3">
                <button
                  type="button"
                  onClick={() => marcar(p)}
                  aria-label={pendiente ? "Marcar pagado" : "Desmarcar"}
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border transition-colors ${
                    pendiente
                      ? "border-white/20 active:border-lima"
                      : "border-lima bg-lima"
                  }`}
                >
                  {!pendiente && (
                    <Check className="h-4 w-4 text-neutral-950" strokeWidth={3} />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => (abierto ? cerrar() : abrirEditar(p))}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm ${
                        pendiente
                          ? "text-neutral-100"
                          : "text-neutral-500 line-through"
                      }`}
                    >
                      {p.concepto}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-neutral-500">
                      <Icono className="h-3 w-3 shrink-0" />
                      <span className="truncate">
                        {NOMBRE_CATEGORIA_PAGO[p.categoria]} ·{" "}
                        {NOMBRE_RESPONSABLE[p.responsable]}
                      </span>
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-medium ${
                        pendiente ? "text-neutral-100" : "text-neutral-500"
                      }`}
                    >
                      {p.monto === null ? (
                        <span className="text-xs font-normal text-neutral-600">
                          — sin monto
                        </span>
                      ) : (
                        formatoCOP(p.monto)
                      )}
                    </p>
                    <p
                      className={`font-mono text-[11px] ${
                        vencido ? "text-red-400/80" : "text-neutral-500"
                      }`}
                    >
                      {p.recurrente
                        ? p.dia_mes
                          ? `día ${p.dia_mes}`
                          : "cada mes"
                        : p.fecha_venc
                          ? vencido
                            ? `venció ${fechaCortita(p.fecha_venc)}`
                            : fechaCortita(p.fecha_venc)
                          : "sin fecha"}
                    </p>
                  </div>
                </button>
              </div>

              {abierto && (
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
                        confirmandoBorrar
                          ? borrar(p.id)
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
