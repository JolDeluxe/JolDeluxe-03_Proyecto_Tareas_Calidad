import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { paramsSchema } from "../schemas/tarea.schema.js";
import { tareaDetalladaInclude } from "../helpers/prisma.constants.js";

export const obtenerDetalle = safeAsync(async (req: Request, res: Response) => {
  const { id: tareaId } = paramsSchema.parse(req.params);
  const user = req.user!;

  // Intentamos buscar la tarea
  // Aquí podríamos meter lógica compleja de permisos en el WHERE,
  // pero por simplicidad, traemos la tarea y luego verificamos si puede verla.
  const tarea = await prisma.tarea.findUnique({
    where: { id: tareaId },
    include: tareaDetalladaInclude,
  });

  if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

  // Lógica de Visibilidad (Simplificada del router original)
  let puedeVer = false;

  if (user.rol === "SUPER_ADMIN") puedeVer = true;
  else if (user.rol === "ADMIN" || user.rol === "ENCARGADO") {
    // Si es de su departamento
    if (tarea.departamentoId === user.departamentoId) puedeVer = true;
  } else {
    // Usuario o Invitado: Solo si es responsable
    const esResponsable = tarea.responsables.some(r => r.usuario.id === user.id);
    if (esResponsable) puedeVer = true;
  }

  if (!puedeVer) return res.status(403).json({ error: "No tienes permiso para ver esta tarea." });

  // Limpiar respuesta
  const tareaLimpia = {
    ...tarea,
    responsables: tarea.responsables.map((r) => r.usuario),
  };

  res.json(tareaLimpia);
});