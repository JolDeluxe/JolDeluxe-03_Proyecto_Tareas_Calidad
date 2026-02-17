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

  // 3. --- INMUTABILIDAD (El Candado) ---
  // Si la tarea ya finalizó o se canceló, NADIE la puede tocar.
  // TypeScript deduce aquí que si pasa este if, el estatus NO es CONCLUIDA ni CANCELADA.
  if (tareaExistente.estatus === "CONCLUIDA" || tareaExistente.estatus === "CANCELADA") {
    return res.status(400).json({ 
        error: `No se puede modificar una tarea con estatus ${tareaExistente.estatus}.` 
    });
  }

  // 4. Permisos Generales
  const esSuperAdmin = user.rol === "SUPER_ADMIN";
  const esAdminDepto = user.rol === "ADMIN" && tareaExistente.departamentoId === user.departamentoId;
  const esEncargadoDepto = user.rol === "ENCARGADO" && tareaExistente.departamentoId === user.departamentoId;

  if (!esSuperAdmin && !esAdminDepto && !esEncargadoDepto) {
    return res.status(403).json({ error: "No tienes permiso para editar esta tarea." });
  }

  // 5. Restricciones específicas de ENCARGADO
  if (user.rol === "ENCARGADO") {
    const rolCreador = tareaExistente.asignador?.rol;
    if (rolCreador === "ADMIN" || rolCreador === "SUPER_ADMIN") {
      return res.status(403).json({ error: "No puedes editar tareas asignadas por un Administrador." });
    }
  }

  // 6. Preparar actualización
  const { fechaLimite, responsables, ...restoDelBody } = validatedBody;
  
  const dataParaActualizar: any = { ...restoDelBody };
  delete dataParaActualizar.departamentoId; // Por seguridad

  // --- MANEJO DE FECHA LÍMITE (11:59:59 PM) ---
  if (fechaLimite) {
    const nuevaFecha = new Date(fechaLimite);
    // Si la hora es 00:00 (usuario seleccionó solo fecha), damos hasta el final del día.
    if (nuevaFecha.getHours() === 0 && nuevaFecha.getMinutes() === 0) {
        nuevaFecha.setHours(23, 59, 59, 999);
    }
    dataParaActualizar.fechaLimite = nuevaFecha;
  }
  // ---------------------------------------------

  // Cambio de Estatus
  if (validatedBody.estatus) {
    // ✅ CORRECCIÓN: Eliminamos la redundancia "&& tareaExistente.estatus !== 'CONCLUIDA'"
    // TypeScript ya sabe que NO está CONCLUIDA gracias al "Candado" del paso 3.
    if (validatedBody.estatus === "CONCLUIDA") {
      dataParaActualizar.fechaConclusion = new Date();
    } else {
      // Si cambia a PENDIENTE, EN_REVISION, etc., nos aseguramos de limpiar la fecha de conclusión.
      dataParaActualizar.fechaConclusion = null;
    }
  }

  // Cambio de Departamento (Solo Super Admin)
  if (validatedBody.departamentoId) {
    if (!esSuperAdmin) return res.status(403).json({ error: "Solo Super Admin cambia departamento." });
    dataParaActualizar.departamento = { connect: { id: validatedBody.departamentoId } };
  }

  // Cambio de Responsables (Lógica para transacción)
  let nuevosResponsablesIds: number[] = [];
  if (responsables) {
    nuevosResponsablesIds = responsables; // Guardamos para usar en notificaciones
    dataParaActualizar.responsables = {
      deleteMany: {},
      create: responsables.map((uid) => ({ usuario: { connect: { id: uid } } })),
    };
  }

  // 7. Ejecutar Update
  const tareaActualizada = await prisma.tarea.update({
    where: { id: tareaId },
    data: dataParaActualizar,
    include: tareaConRelacionesInclude,
  });

  // 8. Notificaciones y Logs
  
  // A. Si se asignaron NUEVOS responsables
  if (nuevosResponsablesIds.length > 0) {
     sendNotificationToUsers(
        nuevosResponsablesIds, 
        "🆕 Nueva Tarea Asignada", 
        `Se te ha asignado la tarea: "${tareaActualizada.tarea}".`,
        `/tarea/${tareaId}`
     );

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

  // B. Notificar cambio de estatus
  if (validatedBody.estatus && validatedBody.estatus !== tareaExistente.estatus) {
    const ids = tareaActualizada.responsables.map(r => r.usuario.id);
    
    const idsAFiltrar = nuevosResponsablesIds.length > 0 
        ? ids.filter(id => !nuevosResponsablesIds.includes(id)) 
        : ids;

    if (idsAFiltrar.length > 0) {
      const titulo = validatedBody.estatus === "CONCLUIDA" ? "Tarea Concluida" : "Tarea Actualizada";
      sendNotificationToUsers(idsAFiltrar, titulo, `La tarea "${tareaActualizada.tarea}" ahora está ${validatedBody.estatus}`, "/mis-tareas");
    }

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
  } else if (!nuevosResponsablesIds.length && !validatedBody.estatus) {
      // Log genérico de edición (si solo cambió texto o fechas sin cambiar estatus/responsables)
      await registrarBitacora(
        "ACTUALIZAR_TAREA",
        `${user.nombre} actualizó la tarea "${tareaActualizada.tarea}".`,
        user.id,
        { tareaId: tareaActualizada.id }
      );
  }

  res.json({ ...tareaActualizada, responsables: tareaActualizada.responsables.map(r => r.usuario) });
});