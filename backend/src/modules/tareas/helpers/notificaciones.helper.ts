import webpush from "web-push";
import { prisma } from "../../../config/db.js";
import { envs } from "../../../config/envs.js";

// Configuración inicial
webpush.setVapidDetails(
  envs.VAPID_SUBJECT,
  envs.VAPID_PUBLIC_KEY,
  envs.VAPID_PRIVATE_KEY
);

interface NotificationOptions {
  printReport?: boolean; // Opción para activar los logs detallados del Cron
}

export const sendNotificationToUsers = async (
  userIds: number[],
  title: string,
  body: string,
  url: string = "/mis-tareas", // Default URL
  options: NotificationOptions = { printReport: false }
) => {
  // Limpiar IDs duplicados (Set)
  const uniqueIds = [...new Set(userIds)];

  try {
    // 1. Busca suscripciones
    const suscripciones = await prisma.pushSubscription.findMany({
      where: {
        usuarioId: { in: uniqueIds },
      },
    });

    if (suscripciones.length === 0) {
      if (options.printReport) {
        console.log(`ℹ️ [Push] No hay dispositivos para: [${uniqueIds.join(', ')}]`);
      }
      return;
    }

    // 2. Payload
    const payload = JSON.stringify({
      title,
      body,
      icon: "/img/01_Cuadra.webp",
      data: { url },
    });

    // Contadores
    let enviados = 0;
    let fallidos = 0;
    let eliminados = 0;

    // 3. Envío Paralelo
    const promesasEnvio = suscripciones.map((sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      return webpush.sendNotification(pushConfig, payload)
        .then(() => {
          enviados++;
        })
        .catch(async (err) => {
          fallidos++;
          // 410 Gone / 404 Not Found = Suscripción muerta
          if (err.statusCode === 410 || err.statusCode === 404) {
            eliminados++;
            await prisma.pushSubscription.delete({ where: { id: sub.id } });
          } else {
            console.error(`⚠️ Error envío (Usuario ${sub.usuarioId}):`, err.message);
          }
        });
    });

    await Promise.all(promesasEnvio);

    // 4. Reporte (Solo si se pide, útil para Cron)
    if (options.printReport) {
      console.log(`📊 PUSH REPORT ["${title}"]`);
      console.log(`   ├─ 👥 Usuarios: ${uniqueIds.length}`);
      console.log(`   ├─ 📡 Enviados: ${enviados}`);
      console.log(`   ├─ ❌ Fallos: ${fallidos}`);
      console.log(`   └─ 🗑️ Limpiados: ${eliminados}`);
      console.log('--------------------------------------------------');
    }

  } catch (error) {
    console.error("❌ Error CRÍTICO en notificaciones:", error);
  }
};