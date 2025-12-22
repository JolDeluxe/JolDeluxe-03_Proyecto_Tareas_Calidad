import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { paramsSchema } from "../schemas/tarea.schema.js";
import { tareaConRelacionesInclude } from "../helpers/prisma.constants.js";
import { sendNotificationToUsers } from "../helpers/notificaciones.helper.js";

export const cancelarTarea = safeAsync(async (req: Request, res: Response) => {
  const { id: tareaId } = paramsSchema.parse(req.params);
  const user = req.user!;

  const tarea = await prisma.tarea.findUnique({
    where: { id: tareaId },
    include: { responsables: { select: { usuarioId: true } } },
  });

  if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

  const permitido = 
    user.rol === "SUPER_ADMIN" || 
    user.rol === "ADMIN" || 
    (user.rol === "ENCARGADO" && tarea.asignadorId === user.id);

  if (!permitido) return res.status(403).json({ error: "No tienes permiso para cancelar esta tarea." });

  const tareaActualizada = await prisma.tarea.update({
    where: { id: tareaId },
    data: { estatus: "CANCELADA", fechaConclusion: null },
    include: tareaConRelacionesInclude,
  });

  const ids = tarea.responsables.map((r) => r.usuarioId);
  sendNotificationToUsers(ids, `Tarea Cancelada`, `"${tarea.tarea}" ha sido CANCELADA.`, `/admin`);

  res.json({ ...tareaActualizada, responsables: tareaActualizada.responsables.map((r) => r.usuario) });
});