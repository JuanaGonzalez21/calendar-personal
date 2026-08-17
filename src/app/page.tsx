import { createClient } from "@/lib/supabase/server";

/**
 * Página temporal de la Fase 1.6.
 * Solo sirve para confirmar que el login funciona.
 * En la Fase 2 la reemplazamos por la pantalla "Hoy".
 */
export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6">
      <div className="w-full max-w-sm">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-neutral-500">
          Mi día
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-100">
          Sesión activa
        </h1>

        <div className="mt-6 space-y-1 rounded-xl border border-neutral-800 bg-neutral-900 p-4">
          <p className="text-sm text-neutral-400">Email</p>
          <p className="text-neutral-100">{String(claims?.email ?? "—")}</p>

          <p className="pt-3 text-sm text-neutral-400">user_id</p>
          <p className="break-all font-mono text-xs text-lime-400">
            {String(claims?.sub ?? "—")}
          </p>
        </div>

        <p className="mt-3 text-xs text-neutral-500">
          Guarda ese user_id: lo necesitas para el seed del paso 1.7.
        </p>

        <form action="/auth/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="w-full rounded-full border border-neutral-800 px-4 py-3 text-sm text-neutral-300 transition-colors hover:border-neutral-600"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
