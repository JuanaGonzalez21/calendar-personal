import { createClient } from "@/lib/supabase/server";
import { hoyBogota } from "@/lib/fechas";
import { estaPendiente, ordenarPagos } from "@/lib/pagos";
import { formatoCOP, type Pago } from "@/lib/tipos";
import Nav from "@/components/Nav";
import GlassCard from "@/components/GlassCard";
import ListaPagos from "@/components/ListaPagos";

export const dynamic = "force-dynamic";

export default async function Pagos() {
  const supabase = await createClient();
  const hoy = hoyBogota();

  const { data } = await supabase.from("pagos").select("*");

  // numeric llega como string desde PostgREST.
  const pagos = ordenarPagos(
    ((data ?? []) as (Omit<Pago, "monto"> & { monto: string | null })[]).map(
      (p) => ({ ...p, monto: p.monto === null ? null : Number(p.monto) }),
    ),
    hoy,
  );

  const pendientes = pagos.filter((p) => estaPendiente(p, hoy));
  const totalPendiente = pendientes.reduce((n, p) => n + (p.monto ?? 0), 0);

  return (
    <main
      className="mx-auto w-full max-w-lg overflow-x-hidden px-4 pb-24"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 2rem)" }}
    >
      <h1 className="mb-4 text-3xl font-semibold tracking-tight text-neutral-100">
        Pagos
      </h1>

      <Nav />

      <GlassCard className="mb-6 p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
              Pendiente
            </p>
            <p className="mt-0.5 text-2xl font-semibold text-neutral-100">
              {formatoCOP(totalPendiente)}
            </p>
          </div>
          <p className="text-right font-mono text-xs text-neutral-500">
            {pendientes.length}{" "}
            {pendientes.length === 1 ? "pago pendiente" : "pagos pendientes"}
          </p>
        </div>
      </GlassCard>

      <ListaPagos pagos={pagos} hoy={hoy} />
    </main>
  );
}
