import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const prisma = new PrismaClient();

// Configuración VAPID
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:coordinador.procesostecnologicos@cuadra.com.mx',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Helper para enviar notificaciones con LOGS DETALLADOS para PM2
 */
const sendNotificationBatch = async (
  userIds: number[],
  title: string,
  body: string,
  url: string = '/mis-tareas'
) => {
  const uniqueIds = [...new Set(userIds)];

  try {
    const suscripciones = await prisma.pushSubscription.findMany({
      where: { usuarioId: { in: uniqueIds } },
    });

    if (suscripciones.length === 0) {
        console.log(`ℹ️ CRON: No hay dispositivos registrados para los usuarios: [${uniqueIds.join(', ')}]`);
        return;
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: "/img/01_Cuadra.webp",
      data: { url },
    });

    // Contadores para el reporte en PM2
    let enviados = 0;
    let fallidos = 0;
    let eliminados = 0;

    const promesas = suscripciones.map((sub) => {
      return webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
      .then(() => {
          enviados++;
          // Si quieres ver cada envío individual en el log, descomenta la siguiente línea:
          // console.log(`✅ Push OK -> Usuario ${sub.usuarioId}`);
      })
      .catch(async (err) => {
        fallidos++;
        // Errores 410 (Gone) o 404 (Not Found) significan que la suscripción ya no es válida
        if (err.statusCode === 410 || err.statusCode === 404) {
          eliminados++;
          console.warn(`🗑️ Limpiando suscripción muerta (Usuario ${sub.usuarioId}): ${err.statusCode}`);
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          console.error(`⚠️ Error de envío (Usuario ${sub.usuarioId}):`, err.message || err);
        }
      });
    });

    await Promise.all(promesas);

    // --- REPORTE FINAL PARA PM2 ---
    console.log(`📊 REPORTE CRON ["${title}"]`);
    console.log(`   ├─ 👥 Usuarios objetivo: ${uniqueIds.length}`);
    console.log(`   ├─ 📡 Dispositivos notificados: ${enviados}`);
    console.log(`   ├─ ❌ Fallos: ${fallidos}`);
    console.log(`   └─ 🗑️ Suscripciones limpiadas: ${eliminados}`);
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error("❌ CRITICAL ERROR en sendNotificationBatch:", error);
  }
};

export const iniciarCronJobs = () => {
  console.log("⏰ Servicio de Cron Jobs iniciado (Horario: America/Mexico_City)...");

  const timezone = "America/Mexico_City";

  // ===========================================================================
  // JOB 1: REVISIÓN MATUTINA (09:00 AM) - LUNES A VIERNES (1-5)
  // ===========================================================================
  cron.schedule('0 9 * * 1-5', async () => {
    console.log("☀️ [09:00 AM] Ejecutando revisión matutina...");
    await procesarNotificacionesGeneral("MAÑANA");
  }, { timezone });

  // ===========================================================================
  // JOB 2: ALERTA DE SALIDA (04:30 PM) - LUNES A VIERNES (1-5)
  // ===========================================================================
  cron.schedule('30 16 * * 1-5', async () => {
    console.log("🌇 [04:30 PM] Ejecutando alerta de salida...");
    await procesarNotificacionesGeneral("TARDE");
  }, { timezone });
};

// --- Lógica de Negocio ---
const procesarNotificacionesGeneral = async (momento: "MAÑANA" | "TARDE") => {
  const hoyStart = new Date(); hoyStart.setHours(0, 0, 0, 0);
  const hoyEnd = new Date(); hoyEnd.setHours(23, 59, 59, 999);

  try {
    // 1. Tareas que vencen HOY (Recordatorio)
    const tareasHoy = await prisma.tarea.findMany({
      where: { estatus: 'PENDIENTE', fechaLimite: { gte: hoyStart, lte: hoyEnd } },
      include: { responsables: { select: { usuarioId: true } } }
    });

    for (const tarea of tareasHoy) {
        const ids = tarea.responsables.map(r => r.usuarioId);
        if (ids.length > 0) {
            const titulo = momento === "MAÑANA" ? "📅 Vence Hoy" : "⏳ Cierre de día";
            const cuerpo = momento === "MAÑANA" 
                ? `La tarea "${tarea.tarea}" vence hoy. ¡Organiza tu día!`
                : `Tienes una tarea ("${tarea.tarea}") que vence hoy. ¿Crees terminarla?`;
            
            await sendNotificationBatch(ids, titulo, cuerpo);
        }
    }

    // 2. Tareas YA VENCIDAS (Insistencia hasta que se completen)
    const tareasVencidas = await prisma.tarea.findMany({
      where: { estatus: 'PENDIENTE', fechaLimite: { lt: hoyStart } },
      include: { responsables: { select: { usuarioId: true } } }
    });

    for (const tarea of tareasVencidas) {
        const ids = tarea.responsables.map(r => r.usuarioId);
        if (ids.length > 0) {
            const titulo = "⚠️ TAREA VENCIDA";
            // Mensaje ligeramente diferente según la hora para no ser tan repetitivo
            const cuerpo = momento === "MAÑANA"
                ? `"${tarea.tarea}" lleva días de retraso. Por favor priorízala.`
                : `"${tarea.tarea}" sigue pendiente. ¡No olvides cerrarla!`;

            await sendNotificationBatch(ids, titulo, cuerpo);
        }
    }
  } catch (error) {
    console.error(`Error procesando cron (${momento}):`, error);
  }
};