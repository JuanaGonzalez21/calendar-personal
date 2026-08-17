import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Rutas que se pueden ver sin haber iniciado sesión. */
const RUTAS_PUBLICAS = ["/login", "/auth"];

/**
 * Refresca el token de sesión en cada request y bloquea el acceso
 * a quien no sea la dueña de la app.
 *
 * Dos capas de seguridad:
 *   1. ¿Hay sesión válida?         → getClaims() verifica la firma del JWT
 *   2. ¿El email está autorizado?  → allowlist con ALLOWED_EMAIL
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          if (headers) {
            Object.entries(headers).forEach(([key, value]) =>
              supabaseResponse.headers.set(key, value)
            );
          }
        },
      },
    }
  );

  // No metas código entre createServerClient y getClaims().
  // Un error acá provoca cierres de sesión aleatorios muy difíciles de depurar.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const emailSesion =
    typeof claims?.email === "string" ? claims.email.toLowerCase() : null;
  const emailPermitido = process.env.ALLOWED_EMAIL?.toLowerCase();

  const esRutaPublica = RUTAS_PUBLICAS.some((ruta) =>
    request.nextUrl.pathname.startsWith(ruta)
  );

  const autorizada =
    Boolean(claims) &&
    (!emailPermitido || emailSesion === emailPermitido);

  if (!autorizada && !esRutaPublica) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // IMPORTANTE: devolver supabaseResponse tal cual.
  // Si creas otra respuesta, copia las cookies o la sesión se rompe.
  return supabaseResponse;
}
