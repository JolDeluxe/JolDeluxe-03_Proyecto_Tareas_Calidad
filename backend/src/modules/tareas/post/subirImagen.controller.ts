import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js"; 
import { paramsSchema } from "../schemas/tarea.schema.js";
import { uploadImageBuffer } from "../../../utils/cloudinaryUtils.js"; 

export const subirImagen = safeAsync(async (req: Request, res: Response) => {
  const { id } = paramsSchema.parse(req.params);
  const tareaId = Number(id);
  const user = req.user!;

  const tarea = await prisma.tarea.findUnique({ where: { id: tareaId } });
  if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

  // Permisos básicos
  const permitido = 
    user.rol === "SUPER_ADMIN" || 
    (tarea.departamentoId === user.departamentoId && ["ADMIN", "ENCARGADO"].includes(user.rol));

  if (!permitido) return res.status(403).json({ error: "No puedes subir imágenes aquí." });

  // Validación de archivos
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return res.status(400).json({ error: "No hay archivos para subir" });
  }

  // --- OPTIMIZACIÓN Y SUBIDA ---
  // IMPORTANTE: Usamos la misma carpeta "tareas-calidad" que en el eliminar
  const promesasDeSubida = files.map(file => 
    uploadImageBuffer(file.buffer, "tareas-calidad") 
  );

  const resultados = await Promise.all(promesasDeSubida);

  // Preparamos los datos para Prisma
  // CORRECCIÓN: Quitamos 'publicId' porque no existe en tu tabla ImagenTarea
  const imagenesData = resultados.map(result => ({
    url: result.secure_url,
    // publicId: result.public_id, <--- ELIMINADO PARA EVITAR ERROR
    tareaId: tareaId,
  }));

  // Guardamos en Base de Datos
  const resultadoBD = await prisma.imagenTarea.createMany({ data: imagenesData });
  
  res.status(201).json({
    message: "Imágenes optimizadas y subidas",
    count: resultadoBD.count,
    data: imagenesData
  });
});