import cron from 'node-cron';
import { prisma } from '../config/db.js'; // Usa tu instancia global
import { sendNotificationToUsers } from '../modules/tareas/helpers/notificaciones.helper.js'; // Reutiliza la lógica

export const iniciarCronJobs = () => {
  console.log("⏰ Servicio de Cron Jobs iniciado (Horario: America/Mexico_City)...");

  const timezone = "America/Mexico_City";

  // JOB 1: 09:00 AM (Lunes a Viernes)
  cron.schedule('0 9 * * 1-5', async () => {
    console.log("☀️ [09:00 AM] Ejecutando revisión matutina...");
    await procesarNotificacionesGeneral("MAÑANA");
  }, { timezone });

  // JOB 2: 04:30 PM (Lunes a Viernes)
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
    // 1. TAREAS QUE VENCEN HOY
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
            
            // ✅ LLAMADA AL HELPER UNIFICADO (Con reporte activado)
            await sendNotificationToUsers(ids, titulo, cuerpo, '/mis-tareas', { printReport: true });
        }
    }

    // 2. TAREAS YA VENCIDAS
    const tareasVencidas = await prisma.tarea.findMany({
      where: { estatus: 'PENDIENTE', fechaLimite: { lt: hoyStart } },
      include: { responsables: { select: { usuarioId: true } } }
    });

    for (const tarea of tareasVencidas) {
        const ids = tarea.responsables.map(r => r.usuarioId);
        if (ids.length > 0) {
            const titulo = "⚠️ TAREA VENCIDA";
            const cuerpo = momento === "MAÑANA"
                ? `"${tarea.tarea}" lleva días de retraso. Priorízala.`
                : `"${tarea.tarea}" sigue pendiente. ¡No olvides cerrarla!`;

            // ✅ LLAMADA AL HELPER UNIFICADO
            await sendNotificationToUsers(ids, titulo, cuerpo, '/mis-tareas', { printReport: true });
        }
    }
  } catch (error) {
    console.error(`❌ Error procesando cron (${momento}):`, error);
  }
};