/**
 * Service worker de Mi día.
 * Por ahora solo hace dos cosas: mostrar la notificación cuando llega
 * un push, y abrir/enfocar la app cuando la tocas.
 */

self.addEventListener("push", (event) => {
  let datos = {};
  try {
    datos = event.data ? event.data.json() : {};
  } catch {
    datos = { body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(datos.title || "Mi día", {
      body: datos.body || "",
      data: { url: datos.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((ventanas) => {
        for (const ventana of ventanas) {
          if ("focus" in ventana) return ventana.focus();
        }
        return clients.openWindow(url);
      }),
  );
});
