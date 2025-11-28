// 📍 public/push-handler.js

self.addEventListener("push", (event) => {
  const data = event.data.json();
  console.log("✅ Notificación Push recibida:", data);

  const options = {
    body: data.body,
    icon: data.icon || "/img/01_Cuadra.webp",
    badge: "/img/01_Cuadra.webp", // El badge debe ser monocromático en Android, pero usar el logo está bien por ahora
    data: {
      url: data.data?.url || "/admin", // Guardamos la URL destino
    },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Ver Tarea' } // Opcional: añade un botón explícito
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // Cierra la notificación al tocarla

  // 1. Obtener la URL relativa y convertirla a absoluta para comparar bien
  const relativeUrl = event.notification.data?.url || "/";
  const targetUrl = new URL(relativeUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // 2. Buscar si ya hay una pestaña abierta de nuestra app
      for (const client of clientList) {
        // Verificar si la URL base coincide (para no tomar otras webs)
        if (client.url.includes(self.location.origin) && "focus" in client) {
          
          // A. Si ya está en la pantalla correcta, solo enfocar
          if (client.url === targetUrl) {
            return client.focus();
          }
          // B. Si está en la app pero en otra pantalla, navegar y enfocar
          return client.navigate(targetUrl).then((c) => c?.focus());
        }
      }

      // 3. Si no hay ninguna ventana abierta, abrir una nueva
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});