import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js"; 
import { getPublicIdFromCloudinaryUrl, deleteImage } from "../../../utils/cloudinaryUtils.js";
import { paramsSchema } from "../schemas/tarea.schema.js";

export const eliminarImagen = safeAsync(async (req: Request, res: Response) => {
  const { id } = paramsSchema.parse(req.params);
  const imagenId = Number(id);
  const user = req.user!;

  const imagen = await prisma.imagenTarea.findUnique({
    where: { id: imagenId },
    include: { tarea: true },
  });

  if (!imagen) return res.status(404).json({ error: "Imagen no encontrada" });

  // Permisos
  const { tarea } = imagen;
  const esSuperAdmin = user.rol === "SUPER_ADMIN";
  const esAdminDepto = user.rol === "ADMIN" && tarea.departamentoId === user.departamentoId;
  const esEncargadoAsignador = user.rol === "ENCARGADO" && tarea.asignadorId === user.id;

  if (!esSuperAdmin && !esAdminDepto && !esEncargadoAsignador) {
    return res.status(403).json({ error: "No tienes permiso para borrar esta imagen." });
  }

  // --- BORRADO ---
  // Calculamos el ID desde la URL usando la carpeta CORRECTA "tareas-calidad"
  const publicId = getPublicIdFromCloudinaryUrl(imagen.url, "tareas-calidad"); 

  if (publicId) {
    await deleteImage(publicId).catch(err => console.error("Error borrando en Cloudinary:", err));
  } else {
    console.warn("No se pudo extraer el Public ID de la URL:", imagen.url);
  }

  // Borrar de BD
  await prisma.imagenTarea.delete({ where: { id: imagenId } });
  
  res.json({ message: "Imagen eliminada correctamente" });
});