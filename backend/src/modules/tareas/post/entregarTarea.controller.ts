import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { paramsSchema } from "../schemas/tarea.schema.js";
import { sendNotificationToUsers } from "../helpers/notificaciones.helper.js";
import { uploadImageBuffer } from "../../../utils/cloudinaryUtils.js"; // Importamos la optimización

export const entregarTarea = safeAsync(async (req: Request, res: Response) => {
  const { id: tareaId } = paramsSchema.parse(req.params);
  const user = req.user!;

  const tarea = await prisma.tarea.findUnique({
    where: { id: tareaId },
    include: { responsables: { select: { usuarioId: true } } },
  });

  if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

  // Validar si es responsable o SuperAdmin (Tu lógica original)
  const esResponsable = tarea.responsables.some((r) => r.usuarioId === user.id);
  if (!esResponsable && user.rol !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "No puedes entregar esta tarea." });
  }

  // Validación estricta de estatus (Tu lógica original para evitar el error de TS)
  if (tarea.estatus !== "PENDIENTE") {
    return res.status(400).json({ error: `No se puede entregar. Estatus actual: ${tarea.estatus}` });
  }

  // --- AQUÍ ESTÁ EL CAMBIO (OPTIMIZACIÓN) ---
  let imagenesData: any[] = [];
  const files = req.files as Express.Multer.File[]; // Multer en memoria devuelve esto

  if (files && files.length > 0) {
    // 1. Enviamos cada archivo a optimizar y subir
    const promesasSubida = files.map(file => 
      uploadImageBuffer(file.buffer, "tareas-calidad")
    );

    // 2. Esperamos a que todas se procesen
    const resultados = await Promise.all(promesasSubida);

    // 3. Preparamos datos para la BD
    imagenesData = resultados.map(result => ({
      url: result.secure_url,
      // publicId omitido porque no tienes la columna
      tareaId: tareaId,
    }));
  }
  // --------------------------------------------

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

  // Notificación (Tu lógica original)
  if (tarea.asignadorId) {
    sendNotificationToUsers(
        [tarea.asignadorId], 
        `Tarea Entregada 📩`, 
        `${user.nombre} entregó evidencias: "${tarea.tarea}".`, 
        `/admin`
    );
  }

  res.json({ message: "Enviada a revisión", tarea: tareaActualizada });
});