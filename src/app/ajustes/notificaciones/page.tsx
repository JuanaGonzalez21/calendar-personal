import Link from "next/link";
import AjustesNotificaciones from "@/components/AjustesNotificaciones";

export default function Notificaciones() {
  return (
    <main
      className="mx-auto w-full max-w-lg overflow-x-hidden px-4 pb-32"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 2rem)" }}
    >
      <Link
        href="/ajustes"
        className="mb-2 inline-block text-sm text-neutral-500 transition-colors active:text-neutral-300"
      >
        ← Ajustes
      </Link>

      <h1 className="mb-4 text-3xl font-semibold tracking-tight text-neutral-100">
        Notificaciones
      </h1>

      <p className="mb-4 text-xs text-neutral-500">
        Los avisos llegan a cada dispositivo donde actives las
        notificaciones. Los recordatorios automáticos de tareas vienen después;
        por ahora esto activa el canal y lo prueba.
      </p>

      <AjustesNotificaciones />
    </main>
  );
}
