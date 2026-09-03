import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";
import {
  horaBogota,
  hoyBogota,
  hora12,
  soloHoraMinuto,
  sumarMinutos,
} from "@/lib/fechas";
import { estaPendiente } from "@/lib/pagos";
import { formatoCOP } from "@/lib/tipos";

// web-push necesita crypto de Node; no corre en edge.
export const runtime = "nodejs";

/** Cuántos minutos antes del evento se avisa. */
const AVISO_EVENTO_MIN = 30;
/** Hora (Bogotá) a la que se avisan los pagos que vencen hoy. */
const HORA_AVISO_PAGOS = "08:00";
/** Ventana de gracia: si el disparo pasó hace más de esto, ya no se avisa. */
const GRACIA_MIN = 180;

interface Candidato {
  user_id: string;
  /** Única por usuario en notificaciones_log; evita repetir. */
  clave: string;
  disparo: string; // "HH:MM" Bogotá
  title: string;
  body: string;
}

const aMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const textoHora = (hora: string | null) => {
  const h12 = hora12(soloHoraMinuto(hora));
  return h12 ? `${h12.texto} ${h12.icono}` : "";
};

/**
 * Revisa qué toca avisar AHORA y lo manda. Lo llama un cron externo
 * cada ~15 min con el secreto en el header. Idempotente: cada aviso
 * se registra en notificaciones_log (clave única por usuario) antes
 * de enviarse, así el mismo cron corriendo dos veces no repite.
 */
export async function POST(peticion: Request) {
  const secreto = process.env.NOTIF_CRON_SECRET;
  if (!secreto) {
    return Response.json(
      { error: "Falta NOTIF_CRON_SECRET en el entorno" },
      { status: 500 },
    );
  }
  if (peticion.headers.get("authorization") !== `Bearer ${secreto}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  const sujeto = process.env.VAPID_SUBJECT;
  if (!url || !serviceRole || !publica || !privada || !sujeto) {
    return Response.json(
      { error: "Faltan variables de entorno (service role o VAPID)" },
      { status: 500 },
    );
  }
  webpush.setVapidDetails(sujeto, publica, privada);

  // El cron no tiene sesión: cliente admin (service role) solo-servidor.
  const admin = createClient(url, serviceRole, {
    auth: { persistSession: false },
  });

  const hoy = hoyBogota();
  const ahora = horaBogota();

  // Solo importan los usuarios con algún dispositivo suscrito.
  const { data: subsData } = await admin
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth");
  const subsPorUsuario = new Map<
    string,
    { endpoint: string; p256dh: string; auth: string }[]
  >();
  for (const s of subsData ?? []) {
    const lista = subsPorUsuario.get(s.user_id) ?? [];
    lista.push(s);
    subsPorUsuario.set(s.user_id, lista);
  }
  if (subsPorUsuario.size === 0) {
    return Response.json({ avisos: 0, motivo: "sin suscripciones" });
  }

  const candidatos: Candidato[] = [];

  /* ----------------------- Tareas de hoy ------------------------ */
  const { data: diasHoy } = await admin
    .from("days")
    .select("id")
    .eq("fecha", hoy);
  if (diasHoy?.length) {
    const { data: tareas } = await admin
      .from("day_tasks")
      .select("id, user_id, titulo, hora, aviso_min")
      .in(
        "day_id",
        diasHoy.map((d) => d.id),
      )
      .eq("hecha", false)
      .not("hora", "is", null)
      .not("aviso_min", "is", null);
    for (const t of tareas ?? []) {
      candidatos.push({
        user_id: t.user_id,
        clave: `tarea:${t.id}`,
        disparo: sumarMinutos(t.hora, -t.aviso_min),
        title: t.titulo,
        body: `En ${t.aviso_min} min · ${textoHora(t.hora)}`,
      });
    }
  }

  /* ----------------------- Eventos de hoy ----------------------- */
  const { data: eventos } = await admin
    .from("events")
    .select("id, user_id, titulo, hora")
    .eq("fecha", hoy)
    .not("hora", "is", null);
  for (const e of eventos ?? []) {
    candidatos.push({
      user_id: e.user_id,
      clave: `evento:${e.id}`,
      disparo: sumarMinutos(e.hora, -AVISO_EVENTO_MIN),
      title: e.titulo,
      body: `Hoy ${textoHora(e.hora)}`,
    });
  }

  /* -------------------- Pagos que vencen hoy -------------------- */
  const diaDeHoy = Number(hoy.slice(8, 10));
  const { data: pagos } = await admin
    .from("pagos")
    .select("id, user_id, concepto, monto, recurrente, dia_mes, pagado_at")
    .or(`fecha_venc.eq.${hoy},and(recurrente.eq.true,dia_mes.eq.${diaDeHoy})`);
  for (const p of pagos ?? []) {
    if (!estaPendiente(p, hoy)) continue;
    candidatos.push({
      user_id: p.user_id,
      // Con el mes en la clave, el recurrente vuelve a avisar el próximo.
      clave: `pago:${p.id}:${hoy.slice(0, 7)}`,
      disparo: HORA_AVISO_PAGOS,
      title: `Vence hoy: ${p.concepto}`,
      body: p.monto === null ? "Pendiente de pago" : formatoCOP(Number(p.monto)),
    });
  }

  /* ----------------------- Enviar lo que toca ------------------- */
  const min = aMinutos(ahora);
  let avisos = 0;
  let muertas = 0;

  for (const c of candidatos) {
    const subs = subsPorUsuario.get(c.user_id);
    if (!subs) continue;

    const dif = min - aMinutos(c.disparo);
    if (dif < 0 || dif > GRACIA_MIN) continue;

    // Anti-repetición atómica: reservar la clave ANTES de enviar.
    // Si ya existe (unique user_id+clave), otro tick ya avisó.
    const { error } = await admin.from("notificaciones_log").insert({
      user_id: c.user_id,
      clave: c.clave,
      enviado_at: new Date().toISOString(),
    });
    if (error) continue;

    const carga = JSON.stringify({ title: c.title, body: c.body, url: "/" });
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          carga,
        );
      } catch (e) {
        const codigo = (e as { statusCode?: number }).statusCode;
        if (codigo === 404 || codigo === 410) {
          await admin
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", s.endpoint);
          muertas++;
        }
      }
    }
    avisos++;
  }

  return Response.json({ avisos, muertas, candidatos: candidatos.length });
}
