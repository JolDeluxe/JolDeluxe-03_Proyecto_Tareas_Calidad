import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { paramsSchema, revisionTareaSchema } from "../schemas/tarea.schema.js";
import { sendNotificationToUsers } from "../helpers/notificaciones.helper.js";

export const revisionTarea = safeAsync(async (req: Request, res: Response) => {
  const { id: tareaId } = paramsSchema.parse(req.params);
  const bodyParse = revisionTareaSchema.safeParse(req.body);
  if (!bodyParse.success) return res.status(400).json({ error: "Datos inválidos" });

  const { decision, feedback, nuevaFechaLimite } = bodyParse.data;
  const user = req.user!;

  const tarea = await prisma.tarea.findUnique({
    where: { id: tareaId },
    include: { responsables: { select: { usuarioId: true } } },
  });

  if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

  // Permisos
  const permitido = 
    user.rol === "SUPER_ADMIN" || 
    (user.rol === "ADMIN" && tarea.departamentoId === user.departamentoId) ||
    tarea.asignadorId === user.id;

  if (!permitido) return res.status(403).json({ error: "No tienes permiso para revisar." });

  if (tarea.estatus !== "EN_REVISION") return res.status(400).json({ error: "La tarea no está en revisión." });

  let tareaActualizada;
  const ids = tarea.responsables.map((r) => r.usuarioId);

  if (decision === "APROBAR") {
    tareaActualizada = await prisma.tarea.update({
      where: { id: tareaId },
      data: {
        estatus: "CONCLUIDA",
        fechaConclusion: new Date(),
        fechaRevision: new Date(),
        feedbackRevision: feedback ?? "Aprobada.",
      },
    });
    sendNotificationToUsers(ids, "✅ Tarea Aprobada", `Tu entrega de "${tarea.tarea}" fue validada.`, `/mis-tareas`);
  
  } else {
    // RECHAZO
    if (nuevaFechaLimite) {
      await prisma.historialFecha.create({
        data: {
          fechaAnterior: tarea.fechaLimite,
          nuevaFecha: nuevaFechaLimite,
          motivo: `Rechazo: ${feedback || "Correcciones"}`,
          tareaId: tareaId,
          modificadoPorId: user.id,
        },
      });
    }

    tareaActualizada = await prisma.tarea.update({
      where: { id: tareaId },
      data: {
        estatus: "PENDIENTE",
        fechaEntrega: null,
        fechaRevision: new Date(),
        feedbackRevision: feedback ?? null,
        ...(nuevaFechaLimite && { fechaLimite: nuevaFechaLimite }),
      },
    });
    sendNotificationToUsers(ids, "⚠️ Tarea Rechazada", `Se requiere corrección: ${feedback}`, `/mis-tareas`);
  }

  res.json({ message: `Tarea ${decision}`, tarea: tareaActualizada });
});