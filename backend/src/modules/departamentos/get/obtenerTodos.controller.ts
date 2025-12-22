import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js"; 
import { safeAsync } from "../../../utils/safeAsync.js"; 

export const obtenerTodos = safeAsync(async (req: Request, res: Response) => {
  const departamentos = await prisma.departamento.findMany({
    orderBy: { nombre: "asc" },
    select: {
      id: true,
      nombre: true,
      tipo: true,
      fechaCreacion: true,
    },
  });
  res.json(departamentos);
});