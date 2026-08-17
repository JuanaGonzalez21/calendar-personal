import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente para Server Components, Server Actions y Route Handlers.
 * Lee la sesión desde las cookies.
 *
 * OJO: es async. Siempre `const supabase = await createClient()`.
 * (En Next 15+ la función cookies() se volvió asíncrona.)
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Los Server Components no pueden escribir cookies.
            // Se ignora sin problema porque el proxy refresca la sesión.
          }
        },
      },
    }
  );
}
