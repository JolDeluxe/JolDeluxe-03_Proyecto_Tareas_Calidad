// 📍 public/push-handler.js

// Escucha el evento 'push' que el servidor (web-push) envía
self.addEventListener("push", (event) => {
  // Asegúrate de que el payload se envíe como JSON
  const data = event.data.json();
  console.log("✅ Notificación Push recibida:", data);

  const options = {
    body: data.body,
    // Usamos el icono de Cuadra que ya está referenciado en tu backend
    icon: data.icon || "/img/01_Cuadra.webp",
    badge: data.icon || "/img/01_Cuadra.webp",
    data: {
      url: data.data.url || "/admin", // La URL a la que debe navegar
    },
    vibrate: [100, 50, 100],
  };

  // Muestra la notificación
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Escucha el evento 'notificationclick' para manejar la interacción del usuario
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  // Enfoca una ventana existente o abre una nueva
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        // Si encuentra una ventana de la PWA abierta, la enfoca
        if (client.url.includes(self.location.origin) && "focus" in client) {
          // Abre la URL específica en esa ventana
          if (client.url !== targetUrl) {
            return client.navigate(targetUrl).then((client) => client.focus());
          }
          return client.focus();
        }
      }
      // Si no hay ventanas de la PWA abiertas, abre una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
