"use server";

import { createClient } from "@/lib/supabase/server";
import type { DatosSuscripcion } from "@/lib/push";

/**
 * Guarda (o refresca) la suscripción push de un dispositivo.
 * `user_id` lo pone la BD (default auth.uid()). No revalida rutas:
 * el estado de la suscripción vive en el navegador, no en el server.
 */
export async function guardarSuscripcion(datos: DatosSuscripcion) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !datos.endpoint || !datos.p256dh || !datos.auth) return;

  await supabase.from("push_subscriptions").upsert(
    {
      endpoint: datos.endpoint,
      p256dh: datos.p256dh,
      auth: datos.auth,
      user_agent: datos.user_agent,
    },
    { onConflict: "endpoint" },
  );
}

/** Borra la suscripción de un dispositivo que se desactivó. */
export async function eliminarSuscripcion(endpoint: string) {
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
