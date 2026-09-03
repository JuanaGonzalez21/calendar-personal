import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

// web-push necesita crypto de Node; no corre en edge.
export const runtime = "nodejs";

/** Envía una notificación de prueba a todos los dispositivos de la usuaria. */
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "No autorizada" }, { status: 401 });
  }

  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  const sujeto = process.env.VAPID_SUBJECT;
  if (!publica || !privada || !sujeto) {
    return Response.json(
      { error: "Faltan las variables VAPID en el entorno del servidor" },
      { status: 500 },
    );
  }
  webpush.setVapidDetails(sujeto, publica, privada);

  // RLS ya filtra: solo las suscripciones de la usuaria logueada.
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth");
  if (!subs?.length) {
    return Response.json(
      { error: "No hay dispositivos suscritos" },
      { status: 404 },
    );
  }

  const carga = JSON.stringify({
    title: "Mi día",
    body: "¡Funciona! 🎉",
    url: "/",
  });

  let enviadas = 0;
  let muertas = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        carga,
      );
      enviadas++;
    } catch (e) {
      const codigo = (e as { statusCode?: number }).statusCode;
      // 404/410 = el navegador canceló esa suscripción; ya no sirve.
      if (codigo === 404 || codigo === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", s.endpoint);
        muertas++;
      }
    }
  }

  return Response.json({ enviadas, muertas });
}
