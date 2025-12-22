import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../config/db.js";
import { safeAsync } from "../../../utils/safeAsync.js";
import { getTareasQuerySchema } from "../schemas/tarea.schema.js";
import { tareaConRelacionesInclude } from "../helpers/prisma.constants.js";

export const obtenerTodas = safeAsync(async (req: Request, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Usuario no autenticado" });

  // 1. Validar Query Params con Zod
  const queryParse = getTareasQuerySchema.safeParse(req.query);
  if (!queryParse.success) {
    return res.status(400).json({
      error: "Filtros inválidos",
      detalles: queryParse.error.flatten().fieldErrors,
    });
  }

  const { departamentoId, asignadorId, responsableId, estatus, viewType } = queryParse.data;

  // 2. Lógica de "Calidad" (Permite ver KAIZEN)
  let esDepartamentoCalidad = false;
  if (user.rol === "SUPER_ADMIN") {
    esDepartamentoCalidad = true;
  } else if (user.departamentoId) {
    const depto = await prisma.departamento.findUnique({
      where: { id: user.departamentoId },
      select: { nombre: true },
    });
    if (depto?.nombre?.toUpperCase().includes("CALIDAD")) {
      esDepartamentoCalidad = true;
    }
  }

  // 3. Construcción del Filtro (WHERE)
  const where: Prisma.TareaWhereInput = {};
  const andClauses: Prisma.TareaWhereInput[] = [];

  if (estatus) where.estatus = estatus;

  // --- LÓGICA DE PERMISOS POR ROL ---
  if (user.rol === "SUPER_ADMIN") {
    if (departamentoId) where.departamentoId = departamentoId;
    if (asignadorId) where.asignadorId = asignadorId;
    if (responsableId) andClauses.push({ responsables: { some: { usuarioId: responsableId } } });
  
  } else if (user.rol === "ADMIN") {
    if (!user.departamentoId) return res.status(403).json({ error: "Sin departamento." });
    where.departamentoId = user.departamentoId;
    if (asignadorId) where.asignadorId = asignadorId;
    if (responsableId) andClauses.push({ responsables: { some: { usuarioId: responsableId } } });

  } else if (user.rol === "ENCARGADO") {
    if (!user.departamentoId) return res.status(403).json({ error: "Sin departamento." });
    where.departamentoId = user.departamentoId;

    let filtroVisionNormal: Prisma.TareaWhereInput = {};

    if (viewType === "ASIGNADAS") {
      filtroVisionNormal = { asignadorId: user.id };
    } else if (viewType === "MIS_TAREAS") {
      filtroVisionNormal = { responsables: { some: { usuarioId: user.id } } };
    } else {
      // Ve todo excepto lo de los ADMINs
      filtroVisionNormal = { responsables: { none: { usuario: { rol: "ADMIN" } } } };
    }

    if (esDepartamentoCalidad) {
      andClauses.push({ OR: [filtroVisionNormal, { tarea: { startsWith: "KAIZEN" } }] });
    } else if (Object.keys(filtroVisionNormal).length > 0) {
      andClauses.push(filtroVisionNormal);
    }

  } else if (user.rol === "USUARIO" || user.rol === "INVITADO") {
    // Solo ve donde es responsable
    andClauses.push({ responsables: { some: { usuarioId: user.id } } });
  }

  // 4. Blindaje Anti-KAIZEN (Ocultar tareas sensibles a mortales)
  if (!esDepartamentoCalidad) {
    andClauses.push({
      OR: [
        { tarea: { not: { startsWith: "KAIZEN" } } },
        { AND: [{ tarea: { startsWith: "KAIZEN" } }, { responsables: { some: { usuarioId: user.id } } }] },
      ],
    });
  }

  if (andClauses.length > 0) where.AND = andClauses;

  // 5. Ejecución (Transacción)
  const [total, tareas] = await prisma.$transaction([
    prisma.tarea.count({ where }),
    prisma.tarea.findMany({
      where,
      include: tareaConRelacionesInclude, // 👈 Usamos el include limpio del helper
      orderBy: { id: "desc" },
    }),
  ]);

  // 6. Limpieza de respuesta
  const tareasLimpio = tareas.map((t) => ({
    ...t,
    responsables: t.responsables.map((r) => r.usuario),
  }));

  res.json({
    info: { total, count: tareas.length },
    data: tareasLimpio,
  });
});