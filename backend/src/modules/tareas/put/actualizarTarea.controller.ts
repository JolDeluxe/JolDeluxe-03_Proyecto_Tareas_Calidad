import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { paramsSchema, actualizarTareaSchema } from "../schemas/tarea.schema.js";
import { tareaConRelacionesInclude } from "../helpers/prisma.constants.js";
import { sendNotificationToUsers } from "../helpers/notificaciones.helper.js";
import { registrarBitacora } from "../../../services/logger.service.js"; 

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
      departamento: { select: { nombre: true } } // Obtenemos Depto
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
  delete dataParaActualizar.responsables; 
  delete dataParaActualizar.departamentoId; 

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
  let nuevosResponsablesIds: number[] = [];
  if (validatedBody.responsables) {
    nuevosResponsablesIds = validatedBody.responsables; // Guardamos para usar en notificaciones
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

  // 7. Notificaciones y Logs (MEJORADA)
  
  // A. Si se asignaron NUEVOS responsables
  if (nuevosResponsablesIds.length > 0) {
     sendNotificationToUsers(
        nuevosResponsablesIds, 
        "🆕 Nueva Tarea Asignada", 
        `Se te ha asignado la tarea: "${tareaActualizada.tarea}".`,
        `/tarea/${tareaId}`
     );

     // LOG Reasignación (Con Depto)
     await registrarBitacora(
       "ACTUALIZAR_TAREA",
       `${user.nombre} re-asignó responsables en la tarea "${tareaActualizada.tarea}".`,
       user.id,
       { 
           tareaId, 
           departamento: tareaExistente.departamento.nombre,
           nuevosResponsables: nuevosResponsablesIds 
       }
     );
  }

  // B. Notificar cambio de estatus (Solo si NO es una reasignación masiva)
  if (validatedBody.estatus && validatedBody.estatus !== tareaExistente.estatus) {
    const ids = tareaActualizada.responsables.map(r => r.usuario.id);
    
    const idsAFiltrar = nuevosResponsablesIds.length > 0 
        ? ids.filter(id => !nuevosResponsablesIds.includes(id)) 
        : ids;

    if (idsAFiltrar.length > 0) {
      const titulo = validatedBody.estatus === "CONCLUIDA" ? "Tarea Concluida" : "Tarea Actualizada";
      sendNotificationToUsers(idsAFiltrar, titulo, `La tarea "${tareaActualizada.tarea}" ahora está ${validatedBody.estatus}`, "/mis-tareas");
    }

    // LOG Cambio Estatus (Con Depto)
    await registrarBitacora(
       "CAMBIO_ESTATUS",
       `${user.nombre} cambió el estatus de "${tareaActualizada.tarea}" a ${validatedBody.estatus}.`,
       user.id,
       { 
           tareaId, 
           departamento: tareaExistente.departamento.nombre,
           anterior: tareaExistente.estatus, 
           nuevo: validatedBody.estatus 
       }
     );
  }

  res.json({ ...tareaActualizada, responsables: tareaActualizada.responsables.map(r => r.usuario) });
});