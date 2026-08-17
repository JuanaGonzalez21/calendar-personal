import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente para Client Components (corre en el navegador).
 * Se usa cuando necesitas Supabase desde un componente con "use client".
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
