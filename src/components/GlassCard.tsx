import type { ReactNode } from "react";

/**
 * Tarjeta "glass" del estilo nuevo (piloto en Pagos): fondo translúcido,
 * blur sutil y borde blanco al 10%. La legibilidad manda: nada encima
 * de ella debe bajar de text-neutral-500.
 */
export default function GlassCard({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}
