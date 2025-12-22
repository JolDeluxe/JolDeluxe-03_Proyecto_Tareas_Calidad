import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { paramsSchema } from "../schemas/usuario.schema.js";

export const obtenerPorId = safeAsync(async (req: Request, res: Response) => {
  const paramsParseResult = paramsSchema.safeParse(req.params);
  if (!paramsParseResult.success) {
    return res.status(400).json({
      error: "ID de URL inválido",
      detalles: paramsParseResult.error.flatten().fieldErrors,
    });
  }
  const { id: targetUsuarioId } = paramsParseResult.data;
  
  const requester = req.user;
  if (!requester) return res.status(401).json({ error: "Usuario no autenticado" });

  const where: Prisma.UsuarioWhereInput = {
    id: targetUsuarioId,
    estatus: "ACTIVO",
  };

  if (requester.id !== targetUsuarioId) {
    const andClauses: Prisma.UsuarioWhereInput[] = [];

    switch (requester.rol) {
      case "SUPER_ADMIN":
        break;
      case "ADMIN":
        if (!requester.departamentoId) return res.status(403).json({ error: "Usuario sin departamento." });
        andClauses.push({ OR: [{ departamentoId: requester.departamentoId }, { rol: "INVITADO" }] });
        break;
      case "ENCARGADO":
        if (!requester.departamentoId) return res.status(403).json({ error: "Usuario sin departamento." });
        andClauses.push({
          OR: [
            { AND: [{ rol: { in: ["USUARIO", "ENCARGADO"] } }, { departamentoId: requester.departamentoId }] },
            { rol: "INVITADO" },
          ],
        });
        break;
      case "USUARIO":
        if (!requester.departamentoId) return res.status(403).json({ error: "Usuario sin departamento." });
        andClauses.push({ rol: "USUARIO", departamentoId: requester.departamentoId });
        break;
      case "INVITADO":
        andClauses.push({ id: -1 });
        break;
      default:
        andClauses.push({ id: -1 });
    }
    if (andClauses.length > 0) where.AND = andClauses;
  }

  const usuario = await prisma.usuario.findFirst({
    where: where,
    select: {
      id: true, nombre: true, username: true, rol: true, estatus: true, fechaCreacion: true, fechaEdicion: true,
      departamento: { select: { id: true, nombre: true } },
    },
  });

  if (!usuario) {
    return res.status(404).json({ error: "Usuario no encontrado, inactivo, o no tienes permiso para verlo." });
  }

  res.json(usuario);
});