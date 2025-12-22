import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { paramsSchema, actualizarUsuarioSchema } from "../schemas/usuario.schema.js";

export const actualizarUsuario = safeAsync(async (req: Request, res: Response) => {
  const paramsParseResult = paramsSchema.safeParse(req.params);
  if (!paramsParseResult.success) {
    return res.status(400).json({
      error: "ID de URL inválido",
      detalles: paramsParseResult.error.flatten().fieldErrors,
    });
  }
  const { id } = paramsParseResult.data;

  const bodyParseResult = actualizarUsuarioSchema.safeParse(req.body);
  if (!bodyParseResult.success) {
    return res.status(400).json({
      error: "Datos de entrada inválidos",
      detalles: bodyParseResult.error.flatten().fieldErrors,
    });
  }
  const validatedBody = bodyParseResult.data;

  const usuarioActual = await prisma.usuario.findUnique({ where: { id } });

  if (!usuarioActual) {
    return res.status(404).json({ error: "Usuario no encontrado" });
  }

  if (usuarioActual.estatus === "INACTIVO" && validatedBody.estatus !== "ACTIVO") {
    return res.status(403).json({ error: "No se puede modificar un usuario inactivo" });
  }

  const datosFusionados = {
    rol: validatedBody.rol ?? usuarioActual.rol,
    departamentoId: validatedBody.departamentoId !== undefined ? validatedBody.departamentoId : usuarioActual.departamentoId,
    estatus: validatedBody.estatus ?? usuarioActual.estatus,
  };

  if ((datosFusionados.rol === "SUPER_ADMIN" || datosFusionados.rol === "INVITADO") && datosFusionados.departamentoId !== null) {
    return res.status(400).json({ error: "Conflicto de reglas", detalle: "Un SUPER_ADMIN o INVITADO no puede tener un departamentoId." });
  }

  if ((datosFusionados.rol === "ADMIN" || datosFusionados.rol === "ENCARGADO" || datosFusionados.rol === "USUARIO") && datosFusionados.departamentoId === null) {
    return res.status(400).json({ error: "Conflicto de reglas", detalle: `El rol ${datosFusionados.rol} debe tener un departamentoId.` });
  }

  if (datosFusionados.estatus === "INACTIVO" && usuarioActual.estatus === "ACTIVO") {
    return res.status(400).json({ error: "Acción incorrecta", detalle: "Para desactivar un usuario, usa la ruta PUT /:id/estatus" });
  }

  const dataParaActualizar: Prisma.UsuarioUpdateInput = { fechaEdicion: new Date() };

  if (validatedBody.nombre !== undefined) dataParaActualizar.nombre = validatedBody.nombre;
  if (validatedBody.username !== undefined) dataParaActualizar.username = validatedBody.username;
  if (validatedBody.rol !== undefined) dataParaActualizar.rol = validatedBody.rol;
  
  if (validatedBody.departamentoId !== undefined) {
    if (validatedBody.departamentoId === null) dataParaActualizar.departamento = { disconnect: true };
    else dataParaActualizar.departamento = { connect: { id: validatedBody.departamentoId } };
  }

  if (validatedBody.password !== undefined) {
    dataParaActualizar.password = await bcrypt.hash(validatedBody.password, 10);
  }

  const usuarioActualizado = await prisma.usuario.update({
    where: { id },
    data: dataParaActualizar,
    select: {
      id: true, nombre: true, username: true, rol: true, estatus: true, departamentoId: true, fechaEdicion: true,
    },
  });

  res.json(usuarioActualizado);
});