import { createClient } from "@/lib/supabase/server";
import { hoyBogota } from "@/lib/fechas";
import { NOMBRE_ESTADO, NOMBRE_FASE, type Postulacion } from "@/lib/tipos";

/**
 * Descarga las postulaciones como CSV listo para Excel en español.
 *
 * Dos detalles que importan:
 *  - Separador ";" — el Excel en configuración regional española usa
 *    punto y coma. Con coma, todo cae en una sola columna.
 *  - BOM al inicio (\uFEFF) — sin esto Excel lee el archivo como
 *    Latin-1 y las tildes salen como símbolos raros.
 */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("No autorizada", { status: 401 });
  }

  const { data } = await supabase
    .from("applications")
    .select("*")
    .order("fecha", { ascending: false });

  const filas = (data ?? []) as Postulacion[];

  const escapar = (v: string | null) => {
    const s = (v ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };

  const cabecera = [
    "Fecha",
    "Empresa",
    "Cargo",
    "Fuente",
    "Fase",
    "Estado",
    "Último movimiento",
    "Link",
    "Nota",
  ].join(";");

  const cuerpo = filas.map((p) =>
    [
      escapar(p.fecha),
      escapar(p.empresa),
      escapar(p.cargo),
      escapar(p.fuente),
      escapar(NOMBRE_FASE[p.fase]),
      escapar(NOMBRE_ESTADO[p.estado]),
      escapar(p.ultimo_movimiento),
      escapar(p.url),
      escapar(p.nota),
    ].join(";")
  );

  const csv = "\uFEFF" + [cabecera, ...cuerpo].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="postulaciones-${hoyBogota()}.csv"`,
    },
  });
}
