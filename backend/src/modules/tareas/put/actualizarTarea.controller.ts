import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { paramsSchema, actualizarTareaSchema } from "../schemas/tarea.schema.js";
import { tareaConRelacionesInclude } from "../helpers/prisma.constants.js";
import { sendNotificationToUsers } from "../helpers/notificaciones.helper.js";

export const actualizarTarea = safeAsync(async (req: Request, res: Response) => {
  // 1. Validar ID y Body
  const paramsParse = paramsSchema.safeParse(req.params);
  if (!paramsParse.success) return res.status(400).json({ error: "ID inválido" });
  
  const bodyParse = actualizarTareaSchema.safeParse(req.body);
  if (!bodyParse.success) return res.status(400).json({ error: "Datos inválidos", detalles: bodyParse.error.flatten().fieldErrors });

  const { id: tareaId } = paramsParse.data;
  const validatedBody = bodyParse.data;
  const user = req.user!;

  // 2. Obtener tarea actual
  const tareaExistente = await prisma.tarea.findUnique({
    where: { id: tareaId },
    include: {
      responsables: { select: { usuarioId: true } },
      asignador: { select: { id: true, rol: true } },
    },
  });

  if (!tareaExistente) return res.status(404).json({ error: "Tarea no encontrada" });

  // 3. Permisos Generales
  const esSuperAdmin = user.rol === "SUPER_ADMIN";
  const esAdminDepto = user.rol === "ADMIN" && tareaExistente.departamentoId === user.departamentoId;
  const esEncargadoDepto = user.rol === "ENCARGADO" && tareaExistente.departamentoId === user.departamentoId;

  if (!esSuperAdmin && !esAdminDepto && !esEncargadoDepto) {
    return res.status(403).json({ error: "No tienes permiso para editar esta tarea." });
  }

  // 4. Restricciones específicas de ENCARGADO
  if (user.rol === "ENCARGADO") {
    const rolCreador = tareaExistente.asignador?.rol;
    if (rolCreador === "ADMIN" || rolCreador === "SUPER_ADMIN") {
      return res.status(403).json({ error: "No puedes editar tareas asignadas por un Administrador." });
    }
  }

  // 5. Preparar actualización
  const dataParaActualizar: any = { ...validatedBody };
  delete dataParaActualizar.responsables; // Lo manejamos aparte
  delete dataParaActualizar.departamentoId; // Lo manejamos aparte

  // Cambio de Estatus
  if (validatedBody.estatus) {
    if (validatedBody.estatus === "CONCLUIDA" && tareaExistente.estatus !== "CONCLUIDA") {
      dataParaActualizar.fechaConclusion = new Date();
    } else if (validatedBody.estatus !== "CONCLUIDA") {
      dataParaActualizar.fechaConclusion = null;
    }
  }

  // Cambio de Departamento (Solo Super Admin)
  if (validatedBody.departamentoId) {
    if (!esSuperAdmin) return res.status(403).json({ error: "Solo Super Admin cambia departamento." });
    dataParaActualizar.departamento = { connect: { id: validatedBody.departamentoId } };
  }

  // Cambio de Responsables (Transacción)
  if (validatedBody.responsables) {
    // Validar jerarquía aquí si es necesario (similar a crearTarea)
    dataParaActualizar.responsables = {
      deleteMany: {},
      create: validatedBody.responsables.map((uid) => ({ usuario: { connect: { id: uid } } })),
    };
  }

  // 6. Ejecutar Update
  const tareaActualizada = await prisma.tarea.update({
    where: { id: tareaId },
    data: dataParaActualizar,
    include: tareaConRelacionesInclude,
  });

  // 7. Notificar si hubo cambio de estatus importante
  if (validatedBody.estatus && validatedBody.estatus !== tareaExistente.estatus) {
    const ids = tareaExistente.responsables.map(r => r.usuarioId);
    if (ids.length > 0) {
      const titulo = validatedBody.estatus === "CONCLUIDA" ? "Tarea Concluida" : "Tarea Actualizada";
      sendNotificationToUsers(ids, titulo, `La tarea "${tareaActualizada.tarea}" ahora está ${validatedBody.estatus}`, "/mis-tareas");
    }
  }

  res.json({ ...tareaActualizada, responsables: tareaActualizada.responsables.map(r => r.usuario) });
});