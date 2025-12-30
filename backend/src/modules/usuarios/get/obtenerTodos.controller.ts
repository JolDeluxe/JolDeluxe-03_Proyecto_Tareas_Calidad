import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { querySchema } from "../schemas/usuario.schema.js";

export const obtenerTodos = safeAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Usuario no autenticado" });

  const queryParseResult = querySchema.safeParse(req.query);
  if (!queryParseResult.success) {
    return res.status(400).json({
      error: "Query param inválido",
      detalles: queryParseResult.error.flatten().fieldErrors,
    });
  }

  const { departamentoId, estatus } = queryParseResult.data;

  const where: Prisma.UsuarioWhereInput = {
    estatus: estatus ?? "ACTIVO",
    // rol: { not: "INVITADO" },  <-- Si quieres ver a TODOS, comenta esto.
  };

  const andClauses: Prisma.UsuarioWhereInput[] = [];

  switch (user.rol) {
    case "SUPER_ADMIN":
      if (departamentoId) where.departamentoId = departamentoId;
      break;
    case "ADMIN":
      if (!user.departamentoId) return res.status(403).json({ error: "Usuario sin departamento." });
      andClauses.push({ departamentoId: user.departamentoId });
      break;
    case "ENCARGADO":
      if (!user.departamentoId) return res.status(403).json({ error: "Usuario sin departamento." });
      andClauses.push({
        AND: [{ rol: { in: ["USUARIO", "ENCARGADO"] } }, { departamentoId: user.departamentoId }],
      });
      break;
    case "USUARIO":
      if (!user.departamentoId) return res.status(403).json({ error: "Usuario sin departamento." });
      andClauses.push({ rol: "USUARIO", departamentoId: user.departamentoId });
      break;
    case "INVITADO":
      andClauses.push({ id: -1 });
      break;
    default:
      andClauses.push({ id: -1 });
  }

  if (andClauses.length > 0) where.AND = andClauses;

  const usuarios = await prisma.usuario.findMany({
    where: where,
    select: {
      id: true, 
      nombre: true, 
      username: true, 
      rol: true, 
      estatus: true, 
      fechaCreacion: true,
      
      departamentoId: true, 

      departamento: { select: { id: true, nombre: true } },
    },
    orderBy: { nombre: "asc" },
  });
  res.json(usuarios);
});