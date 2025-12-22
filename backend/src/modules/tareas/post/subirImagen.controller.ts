import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { paramsSchema } from "../schemas/tarea.schema.js";

export const subirImagen = safeAsync(async (req: Request, res: Response) => {
  const { id: tareaId } = paramsSchema.parse(req.params);
  const user = req.user!;

  const tarea = await prisma.tarea.findUnique({ where: { id: tareaId } });
  if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

  // Permisos básicos
  const permitido = 
    user.rol === "SUPER_ADMIN" || 
    (tarea.departamentoId === user.departamentoId && ["ADMIN", "ENCARGADO"].includes(user.rol));

  if (!permitido) return res.status(403).json({ error: "No puedes subir imágenes aquí." });

  if (!req.files || (req.files as any[]).length === 0) {
    return res.status(400).json({ error: "No hay archivos" });
  }

  // Guardar referencias
  const imagenesData = (req.files as any[]).map((file: any) => ({
    url: file.path,
    tareaId: tareaId,
  }));

  const resultado = await prisma.imagenTarea.createMany({ data: imagenesData });
  res.status(201).json(resultado);
});