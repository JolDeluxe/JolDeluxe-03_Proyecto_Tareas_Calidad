import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { paramsSchema, historialSchema } from "../schemas/tarea.schema.js";

export const agregarHistorial = safeAsync(async (req: Request, res: Response) => {
  const { id: tareaId } = paramsSchema.parse(req.params);
  const bodyParse = historialSchema.safeParse(req.body);
  
  if (!bodyParse.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: bodyParse.error.flatten().fieldErrors });
  }

  const { fechaAnterior, nuevaFecha, motivo } = bodyParse.data;
  const user = req.user!;

  const tarea = await prisma.tarea.findUnique({ where: { id: tareaId } });
  if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

  const nuevoHistorial = await prisma.historialFecha.create({
    data: {
      fechaAnterior,
      nuevaFecha,
      motivo: motivo ?? null,
      tarea: { connect: { id: tareaId } },
      modificadoPor: { connect: { id: user.id } },
    },
    include: { modificadoPor: { select: { nombre: true } } },
  });

  res.status(201).json(nuevoHistorial);
});