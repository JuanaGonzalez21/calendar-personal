"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hoyBogota } from "@/lib/fechas";
import type { EstadoProceso, Fase } from "@/lib/tipos";

export async function crearPostulacion(datos: {
  empresa: string;
  cargo: string;
  fuente: string;
  url: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !datos.empresa.trim()) return;

  const hoy = hoyBogota();

  await supabase.from("applications").insert({
    user_id: user.id,
    empresa: datos.empresa.trim(),
    cargo: datos.cargo.trim() || null,
    fuente: datos.fuente.trim() || null,
    url: datos.url.trim() || null,
    fecha: hoy,
    ultimo_movimiento: hoy,
  });

  revalidatePath("/postulaciones");
}

/** Avanzar de fase cuenta como movimiento: reinicia el reloj de 14 días. */
export async function cambiarFase(id: string, fase: Fase) {
  const supabase = await createClient();

  await supabase
    .from("applications")
    .update({
      fase,
      estado: "en_proceso",
      ultimo_movimiento: hoyBogota(),
    })
    .eq("id", id);

  revalidatePath("/postulaciones");
}

export async function cambiarEstado(id: string, estado: EstadoProceso) {
  const supabase = await createClient();

  await supabase
    .from("applications")
    .update({ estado, ultimo_movimiento: hoyBogota() })
    .eq("id", id);

  revalidatePath("/postulaciones");
}

export async function borrarPostulacion(id: string) {
  const supabase = await createClient();
  await supabase.from("applications").delete().eq("id", id);
  revalidatePath("/postulaciones");
}
