// backend/src/services/cron.service.ts
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import webpush from 'web-push';

const prisma = new PrismaClient();

// Configuración VAPID (Asegúrate de que tus variables de entorno estén cargadas)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@tuempresa.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Helper para enviar notificaciones a una lista de usuarios
 */
const sendNotificationBatch = async (
  userIds: number[],
  title: string,
  body: string,
  url: string = '/mis-tareas'
) => {
  const uniqueIds = [...new Set(userIds)]; // Evitar duplicados

  try {
    const suscripciones = await prisma.pushSubscription.findMany({
      where: { usuarioId: { in: uniqueIds } },
    });

    if (suscripciones.length === 0) return;

    const payload = JSON.stringify({
      title,
      body,
      icon: "/img/01_Cuadra.webp",
      data: { url },
    });

    const promesas = suscripciones.map((sub) => {
      return webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      ).catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
      });
    });

    await Promise.all(promesas);
    console.log(`📨 Cron Notificación enviada a ${uniqueIds.length} usuarios: "${title}"`);
  } catch (error) {
    console.error("❌ Error enviando notificaciones cron:", error);
  }
};

export const iniciarCronJobs = () => {
  console.log("⏰ Servicio de Cron Jobs iniciado...");

  // Configuración de Zona Horaria (Ajusta 'America/Mexico_City' si estás en otra zona)
  const timezone = "America/Mexico_City";

  // ===========================================================================
  // JOB 1: REVISIÓN MATUTINA (09:00 AM)
  // ===========================================================================
  cron.schedule('0 9 * * *', async () => {
    console.log("☀️ Ejecutando revisión matutina (09:00 AM)...");
    await procesarNotificacionesMatutinas();
  }, { timezone });

  // ===========================================================================
  // JOB 2: ALERTA DE SALIDA (04:30 PM) - ¡TU NUEVO REQUERIMIENTO!
  // ===========================================================================
  cron.schedule('30 16 * * *', async () => {
    console.log("🌇 Ejecutando alerta de salida (04:30 PM)...");
    await procesarAlertaSalida();
  }, { timezone });
};

// --- Lógica del Job de las 09:00 AM ---
const procesarNotificacionesMatutinas = async () => {
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
            await sendNotificationBatch(ids, "📅 Vence Hoy", `La tarea "${tarea.tarea}" vence hoy. ¡Organiza tu día!`);
        }
    }

    // 2. Tareas YA VENCIDAS (Insistencia diaria)
    const tareasVencidas = await prisma.tarea.findMany({
      where: { estatus: 'PENDIENTE', fechaLimite: { lt: hoyStart } },
      include: { responsables: { select: { usuarioId: true } } }
    });

    for (const tarea of tareasVencidas) {
        const ids = tarea.responsables.map(r => r.usuarioId);
        if (ids.length > 0) {
            await sendNotificationBatch(ids, "⚠️ TAREA VENCIDA", `"${tarea.tarea}" requiere atención inmediata.`);
        }
    }
  } catch (error) {
    console.error("Error en cron matutino:", error);
  }
};

// --- Lógica del Job de las 04:30 PM ---
const procesarAlertaSalida = async () => {
  const hoyStart = new Date(); hoyStart.setHours(0, 0, 0, 0);
  const hoyEnd = new Date(); hoyEnd.setHours(23, 59, 59, 999);

  try {
    // Buscar tareas que vencen HOY y siguen PENDIENTES
    const tareasPorVencerHoy = await prisma.tarea.findMany({
      where: {
        estatus: 'PENDIENTE',
        fechaLimite: { gte: hoyStart, lte: hoyEnd }
      },
      include: { responsables: { select: { usuarioId: true } } }
    });

    for (const tarea of tareasPorVencerHoy) {
      const ids = tarea.responsables.map(r => r.usuarioId);
      
      if (ids.length > 0) {
        // EL MENSAJE ESPECÍFICO QUE PEDISTE 👇
        await sendNotificationBatch(
          ids,
          "⏳ Cierre de día", 
          `Tienes una tarea ("${tarea.tarea}") que vence hoy. ¿Crees terminarla? O pide cambio de fecha para no afectar tu rendimiento.`,
          `/mis-tareas`
        );
      }
    }
  } catch (error) {
    console.error("Error en cron de la tarde:", error);
  }
};
