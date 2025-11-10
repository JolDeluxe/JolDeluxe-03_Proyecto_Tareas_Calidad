// 📍 frontend/src/push-subscription.ts

import { usuariosService } from "./api/usuarios.service";
import type { PushSubscriptionPayload } from "./api/usuarios.service";
import { toast } from "react-toastify";

// 1. Traemos la clave VAPID desde el .env del frontend
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/**
 * Convierte la clave VAPID de base64 a Uint8Array.
 * Es un paso estándar necesario para la API de Push.
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Lógica principal para suscribir al usuario.
 * Se llama después de que el usuario inicia sesión.
 */
export const subscribeUser = async (userId: number) => {
  // 1. Verifica si el navegador soporta Service Workers y Push API
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Push Messaging no es soportado por este navegador.");
    toast.warn("Tu navegador no soporta notificaciones push.");
    return;
  }

  try {
    // 2. Espera a que el Service Worker (registrado por vite-plugin-pwa) esté listo
    const registration = await navigator.serviceWorker.ready;

    // 3. Comprueba si ya existe una suscripción
    let existingSubscription = await registration.pushManager.getSubscription();

    if (existingSubscription) {
      console.log("El usuario ya está suscrito.");
      // Opcional: Re-enviar la suscripción al backend para asegurar consistencia
      const subJSON = existingSubscription.toJSON();

      // Usamos el tipo que definiste en tu servicio
      const payload: PushSubscriptionPayload = {
        endpoint: subJSON.endpoint!,
        keys: {
          p256dh: subJSON.keys!.p256dh!,
          auth: subJSON.keys!.auth!,
        },
      };
      await usuariosService.subscribeToPush(userId, payload);
      return;
    }

    // 4. Si no hay suscripción, solicita permiso al usuario
    console.log("Solicitando permiso para notificaciones...");
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.warn("Permiso de notificaciones denegado.");
      toast.info("Has denegado las notificaciones. Puedes activarlas luego.");
      return;
    }

    // 5. Si el permiso es concedido, crea la suscripción
    console.log("Creando nueva suscripción...");
    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // Requerido
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY), // La clave VAPID
    });

    // 6. Envía la nueva suscripción al backend
    const subJSON = newSubscription.toJSON();
    if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) {
      console.error("Suscripción generada es inválida:", subJSON);
      toast.error("Hubo un error al generar la suscripción.");
      return;
    }

    // Usamos el tipo de tu servicio
    const payload: PushSubscriptionPayload = {
      endpoint: subJSON.endpoint,
      keys: {
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth,
      },
    };

    // 💡 Llamamos a la función que TÚ definiste en tu servicio
    await usuariosService.subscribeToPush(userId, payload);

    toast.success("¡Suscrito a notificaciones correctamente!");
  } catch (error) {
    console.error("Error al suscribir al usuario:", error);
    toast.error("No se pudo suscribir a las notificaciones.");
  }
};
