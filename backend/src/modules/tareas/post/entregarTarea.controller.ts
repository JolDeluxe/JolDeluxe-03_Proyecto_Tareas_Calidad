import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { paramsSchema } from "../schemas/tarea.schema.js";
import { sendNotificationToUsers } from "../helpers/notificaciones.helper.js";

export const entregarTarea = safeAsync(async (req: Request, res: Response) => {
  const { id: tareaId } = paramsSchema.parse(req.params);
  const user = req.user!;

  const tarea = await prisma.tarea.findUnique({
    where: { id: tareaId },
    include: { responsables: { select: { usuarioId: true } } },
  });

  if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

  // Validar si es responsable o SuperAdmin
  const esResponsable = tarea.responsables.some((r) => r.usuarioId === user.id);
  if (!esResponsable && user.rol !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "No puedes entregar esta tarea." });
  }

  if (tarea.estatus !== "PENDIENTE") {
    return res.status(400).json({ error: `No se puede entregar. Estatus actual: ${tarea.estatus}` });
  }

  // Procesar imágenes (req.files viene de multer)
  let imagenesData: any[] = [];
  if (req.files && (req.files as any[]).length > 0) {
    imagenesData = (req.files as any[]).map((file: any) => ({
      url: file.path,
      tareaId: tareaId,
    }));
  }

  const comentario = req.body.comentarioEntrega || "Tarea marcada como entregada.";

  // Transacción: Guardar fotos + Actualizar Tarea
  const tareaActualizada = await prisma.$transaction(async (tx) => {
    if (imagenesData.length > 0) {
      await tx.imagenTarea.createMany({ data: imagenesData });
    }
    return await tx.tarea.update({
      where: { id: tareaId },
      data: {
        estatus: "EN_REVISION",
        fechaEntrega: new Date(),
        comentarioEntrega: comentario,
      },
    });
  });

  sendNotificationToUsers([tarea.asignadorId], `Tarea Entregada 📩`, `${user.nombre} entregó evidencias: "${tarea.tarea}".`, `/admin`);

  res.json({ message: "Enviada a revisión", tarea: tareaActualizada });
});