import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { getPublicIdFromCloudinaryUrl } from "../../../utils/cloudinaryUtils.js";
import { cloudinary } from "../../../middleware/upload.js"; // Importa tu instancia configurada
import { paramsSchema } from "../schemas/tarea.schema.js";

export const eliminarImagen = safeAsync(async (req: Request, res: Response) => {
  const { id: imagenId } = paramsSchema.parse(req.params);
  const user = req.user!;

  const imagen = await prisma.imagenTarea.findUnique({
    where: { id: imagenId },
    include: { tarea: true },
  });

  if (!imagen) return res.status(404).json({ error: "Imagen no encontrada" });

  // Permisos (incluye regla de Encargado dueño)
  const { tarea } = imagen;
  const esSuperAdmin = user.rol === "SUPER_ADMIN";
  const esAdminDepto = user.rol === "ADMIN" && tarea.departamentoId === user.departamentoId;
  const esEncargadoAsignador = user.rol === "ENCARGADO" && tarea.asignadorId === user.id;

  if (!esSuperAdmin && !esAdminDepto && !esEncargadoAsignador) {
    return res.status(403).json({ error: "No tienes permiso para borrar esta imagen." });
  }

  // Borrar de Cloudinary
  const publicId = getPublicIdFromCloudinaryUrl(imagen.url, "tareas");
  if (publicId) {
    await cloudinary.uploader.destroy(publicId).catch(err => console.error("Error Cloudinary:", err));
  }

  // Borrar de BD
  await prisma.imagenTarea.delete({ where: { id: imagenId } });
  res.json({ message: "Imagen eliminada" });
});