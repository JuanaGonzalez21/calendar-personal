"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  eliminarSuscripcion,
  guardarSuscripcion,
} from "@/app/ajustes/notificaciones/acciones";
import {
  desuscribirsePush,
  haySuscripcion,
  pushSoportado,
  suscribirsePush,
} from "@/lib/push";
import GlassCard from "./GlassCard";

type Estado =
  | "cargando"
  | "no-soportado"
  | "denegado"
  | "sin-clave"
  | "inactivo"
  | "activo";

const ETIQUETA: Record<Estado, { texto: string; clase: string }> = {
  cargando: { texto: "…", clase: "text-neutral-500 border-neutral-700" },
  "no-soportado": {
    texto: "No soportado",
    clase: "text-neutral-500 border-neutral-700",
  },
  denegado: { texto: "Denegado", clase: "text-red-400/80 border-red-400/30" },
  "sin-clave": {
    texto: "Sin configurar",
    clase: "text-amber-400/80 border-amber-400/30",
  },
  inactivo: { texto: "Inactivas", clase: "text-neutral-400 border-neutral-700" },
  activo: { texto: "Activas", clase: "text-lima border-lima/40" },
};

export default function AjustesNotificaciones() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [trabajando, setTrabajando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  // El estado real vive en el navegador; se detecta al montar.
  useEffect(() => {
    const detectar = async (): Promise<Estado> => {
      if (!pushSoportado()) return "no-soportado";
      if (Notification.permission === "denied") return "denegado";
      return (await haySuscripcion()) ? "activo" : "inactivo";
    };
    detectar().then(setEstado);
  }, []);

  const activar = async () => {
    setTrabajando(true);
    setResultado(null);
    try {
      const r = await suscribirsePush();
      if (r.ok) {
        await guardarSuscripcion(r.datos);
        setEstado("activo");
      } else if (r.motivo === "sin-clave") {
        setEstado("sin-clave");
      } else {
        setEstado(
          Notification.permission === "denied" ? "denegado" : "inactivo",
        );
      }
    } catch {
      setResultado("No se pudo activar. Intenta de nuevo.");
    }
    setTrabajando(false);
  };

  const desactivar = async () => {
    setTrabajando(true);
    setResultado(null);
    const endpoint = await desuscribirsePush();
    if (endpoint) await eliminarSuscripcion(endpoint);
    setEstado("inactivo");
    setTrabajando(false);
  };

  const probar = async () => {
    setTrabajando(true);
    setResultado(null);
    try {
      const res = await fetch("/api/notificaciones/test", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setResultado(json.error ?? "No se pudo enviar la prueba.");
      } else {
        const dispositivos =
          json.enviadas === 1 ? "1 dispositivo" : `${json.enviadas} dispositivos`;
        setResultado(
          `Enviada a ${dispositivos}${
            json.muertas
              ? ` (se limpiaron ${json.muertas} suscripciones muertas)`
              : ""
          }. Revisa el teléfono.`,
        );
      }
    } catch {
      setResultado("Error de red al enviar la prueba.");
    }
    setTrabajando(false);
  };

  const etiqueta = ETIQUETA[estado];

  return (
    <GlassCard className="p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <Bell
          className={`h-4 w-4 shrink-0 ${
            estado === "activo" ? "text-lima" : "text-neutral-500"
          }`}
        />
        <p className="min-w-0 flex-1 truncate text-sm text-neutral-100">
          Notificaciones push
        </p>
        <span
          className={`shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] ${etiqueta.clase}`}
        >
          {etiqueta.texto}
        </span>
      </div>

      {estado === "cargando" && (
        <p className="text-xs text-neutral-500">Comprobando este dispositivo…</p>
      )}

      {estado === "no-soportado" && (
        <p className="text-xs leading-relaxed text-neutral-400">
          Este navegador no puede recibir push. En iPhone las notificaciones
          solo funcionan desde la app instalada: abre la página en Safari →
          botón Compartir → «Añadir a pantalla de inicio», y activa desde esa
          app.
        </p>
      )}

      {estado === "denegado" && (
        <p className="text-xs leading-relaxed text-neutral-400">
          El permiso quedó denegado, así que el navegador ya no vuelve a
          preguntar. En iPhone: Ajustes del sistema → Notificaciones → Mi día
          → Permitir. Si «Mi día» no aparece ahí, elimina la app de la
          pantalla de inicio, añádela de nuevo y vuelve a activar.
        </p>
      )}

      {estado === "sin-clave" && (
        <p className="text-xs leading-relaxed text-neutral-400">
          Falta <span className="font-mono">NEXT_PUBLIC_VAPID_PUBLIC_KEY</span>{" "}
          en el entorno de este despliegue. En Vercel: Settings → Environment
          Variables, y redespliega.
        </p>
      )}

      {estado === "inactivo" && (
        <button
          type="button"
          onClick={activar}
          disabled={trabajando}
          className="w-full rounded-xl bg-lima py-2.5 text-sm font-medium text-neutral-950 disabled:opacity-40"
        >
          {trabajando ? "Activando…" : "Activar en este dispositivo"}
        </button>
      )}

      {estado === "activo" && (
        <div className="space-y-2">
          <p className="text-xs text-neutral-500">
            Este dispositivo recibirá avisos.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={desactivar}
              disabled={trabajando}
              className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-neutral-400 active:bg-white/5 disabled:opacity-40"
            >
              Desactivar
            </button>
            <button
              type="button"
              onClick={probar}
              disabled={trabajando}
              className="flex-1 rounded-xl bg-lima py-2.5 text-sm font-medium text-neutral-950 disabled:opacity-40"
            >
              {trabajando ? "Enviando…" : "Enviar prueba"}
            </button>
          </div>
        </div>
      )}

      {resultado && (
        <p className="mt-2 text-xs text-neutral-400">{resultado}</p>
      )}
    </GlassCard>
  );
}
