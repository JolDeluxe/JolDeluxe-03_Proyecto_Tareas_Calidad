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

  // 2. VALIDACIÓN PREVIA: Verificar si el usuario ya existe
  // Esto evita el error P2002 de Prisma y da un mensaje claro al usuario
  const usuarioExistente = await prisma.usuario.findUnique({
    where: {
      username: parseResult.data.username
    }
  });

  if (usuarioExistente) {
    return res.status(400).json({
      error: "Datos de entrada inválidos",
      detalles: {
        // Usamos el mismo formato que Zod para que el frontend pinte el input en rojo
        username: ["Este nombre de usuario ya está registrado. Por favor elige otro."]
      }
    });
  }

  const { nombre, username, password, rol, departamentoId } = parseResult.data;
  const creador = req.user!; 

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

    // Regla 2: Un ADMIN solo puede crear usuarios para SU PROPIO departamento, 
    // EXCEPTO si es INVITADO, en cuyo caso el departamentoId debe ser NULL.
    if (rol === "INVITADO") {
      finalDepartamentoId = null;
    } else {
      if (!creador.departamentoId) {
        return res.status(500).json({ error: "Error de integridad: El ADMIN creador no tiene departamento asignado." });
      }
      finalDepartamentoId = creador.departamentoId;
    }
  }

  // REGLA PARA SUPER_ADMIN
  if (creador.rol === "SUPER_ADMIN") {
    if (["ADMIN", "ENCARGADO", "USUARIO"].includes(rol) && !finalDepartamentoId) {
        return res.status(400).json({ error: "Falta departamento", detalle: `El rol ${rol} requiere un departamentoId.` });
    }
    if (["INVITADO", "SUPER_ADMIN"].includes(rol)) {
        finalDepartamentoId = null;
    }
  }

  // =================================================================

  const hashedPassword = await bcrypt.hash(password, 10);

  // FIX: Spread operator para evitar el error de exactOptionalPropertyTypes
  const dataParaCrear: Prisma.UsuarioCreateInput = {
    nombre,
    username,
    password: hashedPassword,
    rol,
    ...(finalDepartamentoId 
      ? { departamento: { connect: { id: finalDepartamentoId } } } 
      : {}
    ),
  };

  const nuevoUsuario = await prisma.usuario.create({
    data: dataParaCrear,
    select: {
      id: true, nombre: true, username: true, rol: true, estatus: true, departamentoId: true, fechaCreacion: true,
    },
  });

  res.status(201).json(nuevoUsuario);
});