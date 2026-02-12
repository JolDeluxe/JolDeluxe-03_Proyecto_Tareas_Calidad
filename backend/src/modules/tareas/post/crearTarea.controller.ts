import type { Request, Response } from "express";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { crearTareaSchema } from "../schemas/tarea.schema.js"; 
import { 
  tareaConRelacionesInclude 
} from "../helpers/prisma.constants.js";
import { sendNotificationToUsers } from "../helpers/notificaciones.helper.js";
import { registrarBitacora } from "../../../services/logger.service.js"; 

export const crearTarea = safeAsync(async (req: Request, res: Response) => {
  const user = req.user!;
  
  // 1. Validar Body con Zod
  const bodyParse = crearTareaSchema.safeParse(req.body);
  if (!bodyParse.success) {
    return res.status(400).json({
      error: "Datos inválidos",
      detalles: bodyParse.error.flatten().fieldErrors,
    });
  }

  const { departamentoId, responsables, observaciones, ...data } = bodyParse.data;

  // 2. Reglas de Negocio (Permisos de asignación)
  if (user.rol !== "SUPER_ADMIN" && departamentoId !== user.departamentoId) {
    return res.status(403).json({ error: "Solo puedes asignar tareas a tu departamento." });
  }

  // Verificar existencia de responsables
  const usuariosResponsables = await prisma.usuario.findMany({
    where: { id: { in: responsables }, estatus: "ACTIVO" },
    select: { id: true, rol: true, departamentoId: true, nombre: true }, 
  });

  if (usuariosResponsables.length !== responsables.length) {
    return res.status(400).json({ error: "Uno o más responsables no existen o están inactivos." });
  }

  // Validación jerárquica
  for (const responsable of usuariosResponsables) {
    if (user.rol === "ADMIN") {
      const valido = 
        (responsable.departamentoId === user.departamentoId && ["ENCARGADO", "USUARIO"].includes(responsable.rol)) ||
        responsable.rol === "INVITADO";
      
      if (!valido) return res.status(403).json({ error: `No puedes asignar al usuario ID ${responsable.id} por reglas de jerarquía.` });
    }
  }

  // 🚀 CAMBIO CLAVE: Ya NO forzamos la hora a 23:59:59.
  // Respetamos la fecha/hora exacta que envía el Frontend.
  const fechaLimiteFinal = new Date(data.fechaLimite);

  // 4. Crear en BD
  const nuevaTarea = await prisma.tarea.create({
    data: {
      ...data,
      fechaLimite: fechaLimiteFinal, // 👈 Usamos la fecha tal cual viene
      observaciones: observaciones ?? null,
      fechaRegistro: new Date(),
      asignador: { connect: { id: user.id } },
      departamento: { connect: { id: departamentoId } },
      responsables: {
        create: responsables.map((id) => ({ usuario: { connect: { id } } })),
      },
    },
    include: {
        ...tareaConRelacionesInclude,
        departamento: { select: { nombre: true } }
    },
  });

  // 5. Notificar
  sendNotificationToUsers(
    responsables,
    `Nueva Tarea: ${nuevaTarea.tarea}`,
    `Asignada por ${user.nombre}`,
    `/admin`
  );

  // --- LOG DE BITÁCORA ---
  const nombresAsignados = usuariosResponsables.map(u => u.nombre).join(", ");
  await registrarBitacora(
    "CREAR_TAREA",
    `${user.nombre} creó la tarea "${nuevaTarea.tarea}" y la asignó a: ${nombresAsignados}.`,
    user.id,
    { 
        tareaId: nuevaTarea.id, 
        departamento: nuevaTarea.departamento.nombre,
        responsablesIds: responsables 
    }
  );

  // 6. Respuesta limpia
  const tareaLimpia = {
    ...nuevaTarea,
    responsables: nuevaTarea.responsables.map((r) => r.usuario),
  };

  res.status(201).json(tareaLimpia);
});