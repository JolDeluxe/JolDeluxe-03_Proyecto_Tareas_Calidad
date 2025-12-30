import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { crearUsuarioSchema } from "../schemas/usuario.schema.js";

export const crearUsuario = safeAsync(async (req: Request, res: Response) => {
  // 1. Validar datos de entrada con Zod
  const parseResult = crearUsuarioSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: "Datos de entrada inválidos",
      detalles: parseResult.error.flatten().fieldErrors,
    });
  }

  const { nombre, username, password, rol, departamentoId } = parseResult.data;
  const creador = req.user!; // Asumimos que verifyToken ya pobló esto

  // =================================================================
  // 🛡️ LÓGICA DE PERMISOS JERÁRQUICOS
  // =================================================================
  
  let finalDepartamentoId = departamentoId;

  // REGLAS PARA ADMIN DE DEPARTAMENTO
  if (creador.rol === "ADMIN") {
    // Regla 1: Un ADMIN no puede crear SUPER_ADMIN ni otros ADMIN
    if (rol === "SUPER_ADMIN" || rol === "ADMIN") {
      return res.status(403).json({ 
        error: "Permiso denegado", 
        detalle: "Como ADMIN solo puedes crear ENCARGADOS, USUARIOS o INVITADOS." 
      });
    }

    // Regla 2: Un ADMIN solo puede crear usuarios para SU PROPIO departamento
    // Forzamos el ID del departamento del creador, ignorando lo que envíe el body.
    if (!creador.departamentoId) {
        return res.status(500).json({ error: "Error de integridad: El ADMIN creador no tiene departamento asignado." });
    }
    finalDepartamentoId = creador.departamentoId;
  }

  // REGLA PARA SUPER_ADMIN (Validación de consistencia)
  if (creador.rol === "SUPER_ADMIN") {
    // Si crea un ADMIN, ENCARGADO o USUARIO, debe especificar departamento
    if (["ADMIN", "ENCARGADO", "USUARIO"].includes(rol) && !finalDepartamentoId) {
        return res.status(400).json({ error: "Falta departamento", detalle: `El rol ${rol} requiere un departamentoId.` });
    }
  }

  // =================================================================

  const hashedPassword = await bcrypt.hash(password, 10);

  const dataParaCrear: Prisma.UsuarioCreateInput = {
    nombre,
    username,
    password: hashedPassword,
    rol,
    // Usamos la variable procesada finalDepartamentoId
    ...(finalDepartamentoId !== undefined && finalDepartamentoId !== null && { departamentoId: finalDepartamentoId }),
  };

  const nuevoUsuario = await prisma.usuario.create({
    data: dataParaCrear,
    select: {
      id: true, nombre: true, username: true, rol: true, estatus: true, departamentoId: true, fechaCreacion: true,
    },
  });

  res.status(201).json(nuevoUsuario);
});