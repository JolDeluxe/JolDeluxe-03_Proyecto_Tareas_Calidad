import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { crearUsuarioSchema } from "../schemas/usuario.schema.js";

export const crearUsuario = safeAsync(async (req: Request, res: Response) => {
  const parseResult = crearUsuarioSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: "Datos de entrada inválidos",
      detalles: parseResult.error.flatten().fieldErrors,
    });
  }

  const { nombre, username, password, rol, departamentoId } = parseResult.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const dataParaCrear: Prisma.UsuarioCreateInput = {
    nombre,
    username,
    password: hashedPassword,
    rol,
    ...(departamentoId !== undefined && { departamentoId: departamentoId }),
  };

  const nuevoUsuario = await prisma.usuario.create({
    data: dataParaCrear,
    select: {
      id: true, nombre: true, username: true, rol: true, estatus: true, departamentoId: true, fechaCreacion: true,
    },
  });

  res.status(201).json(nuevoUsuario);
});