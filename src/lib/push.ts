/**
 * Helpers de navegador para notificaciones push. Corren SOLO en el
 * cliente (usan navigator/window); llamarlos desde componentes client.
 */

export interface DatosSuscripcion {
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string;
}

export function pushSoportado(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** La clave VAPID pública viene en base64url; subscribe quiere bytes. */
function aUint8Array(base64url: string): Uint8Array<ArrayBuffer> {
  const relleno = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const crudo = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(crudo.length));
  for (let i = 0; i < crudo.length; i++) bytes[i] = crudo.charCodeAt(i);
  return bytes;
}

/** Registra el SW, pide permiso y suscribe este dispositivo. */
export async function suscribirsePush(): Promise<
  | { ok: true; datos: DatosSuscripcion }
  | { ok: false; motivo: "denegado" | "sin-clave" }
> {
  const clave = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!clave) return { ok: false, motivo: "sin-clave" };

  const registro = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const permiso = await Notification.requestPermission();
  if (permiso !== "granted") return { ok: false, motivo: "denegado" };

  const sub =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: aUint8Array(clave),
    }));

  const json = sub.toJSON();
  return {
    ok: true,
    datos: {
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
      user_agent: navigator.userAgent,
    },
  };
}

/** Cancela la suscripción local. Devuelve el endpoint cancelado, o null. */
export async function desuscribirsePush(): Promise<string | null> {
  const registro = await navigator.serviceWorker.getRegistration();
  const sub = await registro?.pushManager.getSubscription();
  if (!sub) return null;
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  return endpoint;
}

/** ¿Este dispositivo ya tiene una suscripción activa? */
export async function haySuscripcion(): Promise<boolean> {
  if (!pushSoportado()) return false;
  const registro = await navigator.serviceWorker.getRegistration();
  const sub = await registro?.pushManager.getSubscription();
  return !!sub;
}
