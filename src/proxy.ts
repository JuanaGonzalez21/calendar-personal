import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * proxy.ts — Next.js 16 (antes se llamaba middleware.ts)
 * Corre antes de renderizar cualquier ruta que coincida con el matcher.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Corre en todo MENOS:
     * - _next/static  (archivos estáticos)
     * - _next/image   (imágenes optimizadas)
     * - favicon.ico
     * - archivos de imagen sueltos
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
