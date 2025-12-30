import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { paramsSchema, estatusSchema } from "../schemas/usuario.schema.js";

export const cambiarEstatus = safeAsync(async (req: Request, res: Response) => {
  const paramsParseResult = paramsSchema.safeParse(req.params);
  if (!paramsParseResult.success) {
    return res.status(400).json({
      error: "ID de URL inválido",
      detalles: paramsParseResult.error.flatten().fieldErrors,
    });
  }
  const { id } = paramsParseResult.data;
  const creador = req.user!;

  const bodyParseResult = estatusSchema.safeParse(req.body);
  if (!bodyParseResult.success) {
    return res.status(400).json({
      error: "Datos de entrada inválidos",
      detalles: bodyParseResult.error.flatten().fieldErrors,
    });
  }
  const { estatus } = bodyParseResult.data;

  // =================================================================
  // 🛡️ LÓGICA DE SEGURIDAD
  // =================================================================
  
  // Si soy ADMIN, verifico que el usuario sea de mi equipo antes de borrarlo/reactivarlo
  if (creador.rol === "ADMIN") {
      const usuarioTarget = await prisma.usuario.findUnique({ 
          where: { id },
          select: { departamentoId: true } 
      });

      if (!usuarioTarget) return res.status(404).json({ error: "Usuario no encontrado" });

      if (usuarioTarget.departamentoId !== creador.departamentoId) {
          return res.status(403).json({ error: "No tienes permiso para cambiar el estatus de usuarios de otro departamento." });
      }
  }
  // =================================================================

  const usuarioActualizado = await prisma.usuario.update({
    where: { id },
    data: { estatus: estatus, fechaEdicion: new Date() },
    select: { id: true, nombre: true, estatus: true, fechaEdicion: true },
  });

  res.json(usuarioActualizado);
});