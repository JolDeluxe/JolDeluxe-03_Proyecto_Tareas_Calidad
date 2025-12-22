// import { Router } from "express";
// import type { Request, Response, NextFunction } from "express"; // Importación de solo tipo
// import { PrismaClient, Prisma, Estatus, Urgencia } from "@prisma/client";
// import { z } from "zod";
// import { verifyToken } from "../middleware/verifyToken.js";
// import path from "path";
// import { fileURLToPath } from "url";
// import webpush from "web-push";

// import { 
//   uploadImagenesMiddleware, 
//   uploadEvidenciasMiddleware,
//   cloudinary // Esta es la instancia única que usaremos
// } from "../middleware/upload.js"; // 👈 ¡El .js es OBLIGATORIO!

// // Configuración para __dirname en ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const router = Router();
// const prisma = new PrismaClient();

// webpush.setVapidDetails(
//   process.env.VAPID_SUBJECT!,
//   process.env.VAPID_PUBLIC_KEY!,
//   process.env.VAPID_PRIVATE_KEY!
// );

// /**
//  * Envía una notificación push a una lista de IDs de usuario.
//  * @param userIds Array de IDs de usuarios (los responsables).
//  * @param title Título de la notificación.
//  * @param body Cuerpo/mensaje de la notificación.
//  * @param url URL a la que se redirigirá al hacer clic (ej. /admin).
//  */

// const sendNotificationToUsers = async (
//   userIds: number[],
//   title: string,
//   body: string,
//   url: string
// ) => {
//   try {
//     // 1. Busca todas las suscripciones de esos usuarios
//     const suscripciones = await prisma.pushSubscription.findMany({
//       where: {
//         usuarioId: { in: userIds },
//       },
//     });

//     if (suscripciones.length === 0) {
//       console.log(
//         "No hay suscripciones para notificar a los usuarios:",
//         userIds
//       );
//       return;
//     }

//     // 2. Prepara el payload (el mensaje)
//     const payload = JSON.stringify({
//       title,
//       body,
//       icon: "/img/01_Cuadra.webp", // Ícono que se mostrará
//       data: {
//         url: url,
//       },
//     });

//     // 3. Envía todas las notificaciones en paralelo
//     const promesasEnvio = suscripciones.map((sub) => {
//       const pushConfig = {
//         endpoint: sub.endpoint,
//         keys: { p256dh: sub.p256dh, auth: sub.auth },
//       };

//       return webpush.sendNotification(pushConfig, payload).catch((err) => {
//         console.warn(`Falló envío a ${sub.endpoint}. Error: ${err.message}`);
//         // Si el error es 410 (Gone), la suscripción expiró y la borramos
//         if (err.statusCode === 410) {
//           return prisma.pushSubscription.delete({ where: { id: sub.id } });
//         }
//       });
//     });

//     await Promise.all(promesasEnvio);
//     console.log(`✅ Notificaciones enviadas a ${userIds.length} usuarios.`);
//   } catch (error) {
//     // Importante: No fallar la API si las notificaciones fallan
//     console.error("❌ Error en la función sendNotificationToUsers:", error);
//   }
// };

// /* 🧱 Helper genérico para capturar errores async */
// const safeAsync =
//   (
//     fn: (
//       req: Request,
//       res: Response,
//       next: NextFunction
//     ) => Promise<void | Response> | void
//   ) =>
//   async (
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ): Promise<void | Response> => {
//     try {
//       await fn(req, res, next);
//     } catch (error: any) {
//       console.error("❌ Error inesperado:", error);

//       if (error instanceof Prisma.PrismaClientKnownRequestError) {
//         if (error.code === "P2002") {
//           const target = (error.meta?.target as string[])?.join(", ");
//           return res.status(409).json({
//             error: "Conflicto de datos",
//             detalle: `El campo '${target}' ya existe y debe ser único.`,
//           });
//         }
//         if (error.code === "P2025") {
//           return res.status(404).json({ error: "Recurso no encontrado" });
//         }
//       }

//       if (!res.headersSent) {
//         res.status(500).json({
//           error: "Ocurrió un error inesperado en el servidor",
//           detalle: error?.message ?? error,
//         });
//       }
//     }
//   };

// // 1. Definimos el 'include' fuera para reutilizarlo
// const tareaConRelacionesInclude = {
//   departamento: { select: { id: true, nombre: true } },
//   asignador: { select: { id: true, nombre: true } },
//   responsables: {
//     select: {
//       usuario: { select: { id: true, nombre: true } },
//     },
//   },
// };

// // 2. Creamos el tipo exacto que Prisma devolverá (usando el 'include' de arriba)
// type TareaCreadaConRelaciones = Prisma.TareaGetPayload<{
//   include: typeof tareaConRelacionesInclude;
// }>;

// // 3. Definimos el 'include' para una TAREA DETALLADA (GET /:id)
// // ESTO DEBE INCLUIR TODO, porque es para ver el detalle completo.
// const tareaDetalladaInclude = {
//   departamento: { select: { id: true, nombre: true } },
//   asignador: { select: { id: true, nombre: true } },
//   responsables: {
//     select: {
//       usuario: { select: { id: true, nombre: true } },
//     },
//   },
//   // ✅ DESCOMENTADO: Necesitamos ver el historial en el detalle
//   historialFechas: {
//     include: {
//       modificadoPor: { select: { id: true, nombre: true } },
//     },
//     orderBy: {
//       fechaCambio: Prisma.SortOrder.desc,
//     },
//   },
//   // ✅ DESCOMENTADO: Necesitamos ver las fotos en el detalle
//   imagenes: {
//     select: {
//       id: true,
//       url: true,
//       fechaSubida: true,
//     },
//   },
// };

// // 4. Tipo exacto
// type TareaDetallada = Prisma.TareaGetPayload<{
//   include: typeof tareaDetalladaInclude;
// }>;

// // ===================================================================
// // ESQUEMAS DE VALIDACIÓN (ZOD)
// // ===================================================================

// /**
//  * Esquema para validar el 'id' de los parámetros de la URL
//  */
// const paramsSchema = z.object({
//   id: z
//     .string()
//     .regex(/^\d+$/, "El ID debe ser un número")
//     .transform(Number)
//     .refine((num) => num > 0, "El ID debe ser positivo"),
// });

// /**
//  * Esquema para validar el query de la ruta GET /
//  */
// const getTareasQuerySchema = z.object({
//   departamentoId: z.coerce.number().int().positive().optional(),
//   asignadorId: z.coerce.number().int().positive().optional(),
//   responsableId: z.coerce.number().int().positive().optional(),
//   estatus: z.nativeEnum(Estatus).optional(),
//   // 🆕 Añadir viewType al esquema para consistencia, aunque las rutas dedicadas no lo usan
//   viewType: z
//     .union([
//       z.literal("MIS_TAREAS"),
//       z.literal("ASIGNADAS"),
//       z.literal("TODAS"),
//     ])
//     .optional(),
// });

// /**
//  * Esquema para CREAR una tarea
//  */
// const crearTareaSchema = z.object({
//   tarea: z.string().trim().nonempty("El nombre de la tarea es requerido"),
//   fechaLimite: z.coerce.date({
//     message: "Fecha límite inválida",
//   }),
//   estatus: z.nativeEnum(Estatus).default("PENDIENTE"),
//   urgencia: z.nativeEnum(Urgencia).default("BAJA"),
//   observaciones: z.string().trim().optional().nullable(),
//   departamentoId: z
//     .number()
//     .int()
//     .positive("El ID de departamento es requerido"),
//   responsables: z
//     .array(z.number().int().positive())
//     .min(1, "Se requiere al menos un responsable"),
// });

// /**
//  * Esquema para ACTUALIZAR una tarea
//  */
// const actualizarTareaSchema = z
//   .object({
//     tarea: z
//       .string()
//       .trim()
//       .nonempty("El nombre de la tarea es requerido")
//       .optional(),
//     // 🔽 =================== CORRECCIÓN ZOD =================== 🔽
//     fechaLimite: z.coerce
//       .date({
//         message: "Fecha límite inválida",
//       })
//       .optional(),
//     // 🔼 ======================================================== 🔼
//     estatus: z.nativeEnum(Estatus).optional(),
//     urgencia: z.nativeEnum(Urgencia).optional(),
//     observaciones: z.string().trim().nullable().optional(),
//     departamentoId: z
//       .number()
//       .int()
//       .positive("El ID de departamento es requerido")
//       .optional(),
//     responsables: z
//       .array(z.number().int().positive())
//       .min(1, "Se requiere al menos un responsable")
//       .optional(),
//   })
//   .refine((data) => Object.keys(data).length > 0, {
//     message: "Debe proporcionar al menos un campo para actualizar.",
//   });

// /**
//  * Esquema para registrar un cambio de fecha (historial)
//  */
// const historialSchema = z.object({
//   // 🔽 =================== CORRECCIÓN ZOD =================== 🔽
//   fechaAnterior: z.coerce.date({
//     message: "Fecha anterior inválida",
//   }),
//   nuevaFecha: z.coerce.date({ message: "Nueva fecha inválida" }),
//   // 🔼 ======================================================== 🔼
//   motivo: z.string().trim().optional().nullable(),
// });

// const revisionTareaSchema = z.object({
//   decision: z.enum(["APROBAR", "RECHAZAR"]), 
//   feedback: z.string().trim().optional(),
//   nuevaFechaLimite: z.coerce.date().optional(),
// });

// // --- Rutas de Tareas ---

// /* ✅ [GET] Obtener todas las tareas (Con filtros y seguridad por Rol) */
// router.get(
//   "/",
//   verifyToken(),
//   safeAsync(async (req: Request, res: Response) => {
//     const user = req.user;
//     if (!user) return res.status(401).json({ error: "Usuario no autenticado" });

//     const queryParse = getTareasQuerySchema.safeParse(req.query);
//     if (!queryParse.success) {
//       return res.status(400).json({
//         error: "Query params inválidos",
//         detalles: queryParse.error.flatten().fieldErrors,
//       });
//     }

//     const { departamentoId, asignadorId, responsableId, estatus, viewType } =
//       queryParse.data;

//     // 1. DETECCIÓN DE "CALIDAD"
//     let esDepartamentoCalidad = false;
//     if (user.rol === "SUPER_ADMIN") {
//       esDepartamentoCalidad = true;
//     } else if (user.departamentoId) {
//       const depto = await prisma.departamento.findUnique({
//         where: { id: user.departamentoId },
//         select: { nombre: true },
//       });
//       if (depto?.nombre?.toUpperCase().includes("CALIDAD")) {
//         esDepartamentoCalidad = true;
//       }
//     }

//     // 2. CONSTRUCCIÓN DEL FILTRO (WHERE)
//     const where: Prisma.TareaWhereInput = {};
//     const andClauses: Prisma.TareaWhereInput[] = [];

//     if (estatus) where.estatus = estatus;

//     // 3. LÓGICA DE ROLES (JERARQUÍA)

//     if (user.rol === "SUPER_ADMIN") {
//       // VE TODO
//       if (departamentoId) where.departamentoId = departamentoId;
//       if (asignadorId) where.asignadorId = asignadorId;
//       if (responsableId)
//         andClauses.push({
//           responsables: { some: { usuarioId: responsableId } },
//         });
//     } else if (user.rol === "ADMIN") {
//       // VE TODO DE SU DEPTO
//       if (!user.departamentoId)
//         return res.status(403).json({ error: "Sin departamento." });
//       where.departamentoId = user.departamentoId;

//       // Filtros opcionales
//       if (asignadorId) where.asignadorId = asignadorId;
//       if (responsableId)
//         andClauses.push({
//           responsables: { some: { usuarioId: responsableId } },
//         });
//     } else if (user.rol === "ENCARGADO") {
//       if (!user.departamentoId)
//         return res.status(403).json({ error: "Sin departamento." });
//       where.departamentoId = user.departamentoId;

//       let filtroVisionNormal: Prisma.TareaWhereInput = {};

//       if (viewType === "ASIGNADAS") {
//         filtroVisionNormal = { asignadorId: user.id };
//       } else if (viewType === "MIS_TAREAS") {
//         filtroVisionNormal = { responsables: { some: { usuarioId: user.id } } };
//       } else {
//         // 🚀 REGLA ENCARGADO (DEFAULT):
//         // Ve todo el departamento, EXCEPTO tareas donde un ADMIN sea responsable.
//         filtroVisionNormal = {
//           responsables: {
//             none: { usuario: { rol: "ADMIN" } },
//           },
//         };
//       }

//       if (esDepartamentoCalidad) {
//         // Si es Calidad, ve lo normal O las tareas KAIZEN
//         andClauses.push({
//           OR: [filtroVisionNormal, { tarea: { startsWith: "KAIZEN" } }],
//         });
//       } else {
//         if (Object.keys(filtroVisionNormal).length > 0) {
//           andClauses.push(filtroVisionNormal);
//         }
//       }
//     } else if (user.rol === "USUARIO") {
//       // ✅ REGLA ESTRICTA USUARIO:
//       // Sólo ve tareas donde él es responsable (incluye tareas compartidas).
//       // Se elimina el filtro de departamento para ver tareas asignadas por cualquier depto.
//       andClauses.push({
//         responsables: { some: { usuarioId: user.id } },
//       });
//     } else if (user.rol === "INVITADO") {
//       // ✅ REGLA ESTRICTA INVITADO:
//       // Sólo ve tareas donde él es responsable (incluye tareas compartidas).
//       // Se eliminan todos los filtros opcionales para mantener la visibilidad simple y estricta.
//       andClauses.push({
//         responsables: { some: { usuarioId: user.id } },
//       });
//     }

//     // 4. BLINDAJE ANTI-KAIZEN (Para todos menos Calidad/SuperAdmin)
//     if (!esDepartamentoCalidad) {
//       andClauses.push({
//         OR: [
//           { tarea: { not: { startsWith: "KAIZEN" } } },
//           {
//             AND: [
//               { tarea: { startsWith: "KAIZEN" } },
//               { responsables: { some: { usuarioId: user.id } } },
//             ],
//           },
//         ],
//       });
//     }

//     if (andClauses.length > 0) {
//       where.AND = andClauses;
//     }

//     // 5. EJECUCIÓN (Transacción para Count + Data)
//     // Usamos $transaction para que sea eficiente y atómico
//     const [total, tareas] = await prisma.$transaction([
//       prisma.tarea.count({ where }), // Cuenta total con los filtros aplicados
//       prisma.tarea.findMany({
//         where,
//         include: {
//           departamento: { select: { id: true, nombre: true } },
//           asignador: { select: { id: true, nombre: true, rol: true } },
//           responsables: {
//             select: {
//               usuario: { select: { id: true, nombre: true, rol: true } },
//             }, // Incluímos rol para verificar en frontend si quieres
//           },
//           imagenes: { select: { id: true, url: true, fechaSubida: true } },
//           historialFechas: {
//             include: { modificadoPor: { select: { id: true, nombre: true } } },
//             orderBy: { fechaCambio: "asc" },
//           },
//         },
//         orderBy: { id: "desc" },
//       }),
//     ]);

//     // Limpiar respuesta
//     const tareasLimpio = tareas.map((t) => ({
//       ...t,
//       responsables: t.responsables.map((r) => r.usuario),
//     }));

//     // 🚀 RESPUESTA CON CONTADOR
//     // Cambiamos la estructura para devolver { info, data }
//     res.json({
//       info: {
//         total: total,
//         count: tareas.length,
//       },
//       data: tareasLimpio,
//     });
//   })
// );

// /* 🆕 [GET /misTareas] Obtener solo tareas donde el usuario logueado es responsable */
// router.get(
//   "/misTareas",
//   verifyToken(),
//   safeAsync(async (req: Request, res: Response) => {
//     const user = req.user;
//     if (!user) return res.status(401).json({ error: "Usuario no autenticado" });

//     // 1. Validar los query params opcionales (ej. ?estatus=PENDIENTE)
//     const queryParse = getTareasQuerySchema.safeParse(req.query);
//     if (!queryParse.success) {
//       return res.status(400).json({
//         error: "Query params inválidos",
//         detalles: queryParse.error.flatten().fieldErrors,
//       });
//     }
//     // Solo necesitamos 'estatus' de la query
//     const { estatus } = queryParse.data;

//     // 2. CONSTRUCCIÓN DEL FILTRO
//     const where: Prisma.TareaWhereInput = {
//       // 🚀 Corrección: Aplica filtro de estatus SOLO si se proporciona
//       ...(estatus && { estatus: estatus }),
//       responsables: {
//         some: {
//           usuarioId: user.id, // Responsable directo
//         },
//       },
//     };

//     // 3. Transacción: total + datos
//     const [total, tareas] = await prisma.$transaction([
//       prisma.tarea.count({ where }),
//       prisma.tarea.findMany({
//         where,
//         include: {
//           departamento: { select: { id: true, nombre: true } },
//           asignador: { select: { id: true, nombre: true, rol: true } },
//           responsables: {
//             select: {
//               usuario: { select: { id: true, nombre: true, rol: true } },
//             },
//           },
//           imagenes: { select: { id: true, url: true, fechaSubida: true } },
//           historialFechas: {
//             include: { modificadoPor: { select: { id: true, nombre: true } } },
//             orderBy: { fechaCambio: "desc" },
//           },
//         },
//         orderBy: { id: "desc" },
//       }),
//     ]);

//     // 4. Limpiar responsables (aplanar arreglo)
//     const tareasLimpio = tareas.map((t) => ({
//       ...t,
//       responsables: t.responsables.map((r) => r.usuario),
//     }));

//     // 5. RESPUESTA
//     res.json({
//       info: { total, count: tareas.length },
//       data: tareasLimpio,
//     });
//   })
// );

// /* 🆕 [GET /asignadas] Obtener solo tareas que el usuario logueado asignó */
// router.get(
//   "/asignadas",
//   // Esta ruta requiere permisos de asignación
//   verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]),
//   safeAsync(async (req: Request, res: Response) => {
//     const user = req.user;
//     if (!user) return res.status(401).json({ error: "Usuario no autenticado" });

//     // 1. Validar los query params opcionales (ej. ?estatus=PENDIENTE)
//     const queryParse = getTareasQuerySchema.safeParse(req.query);
//     if (!queryParse.success) {
//       return res.status(400).json({
//         error: "Query params inválidos",
//         detalles: queryParse.error.flatten().fieldErrors,
//       });
//     }
//     // Solo necesitamos 'estatus' de la query
//     const { estatus } = queryParse.data;

//     // 2. CONSTRUCCIÓN DEL FILTRO
//     const where: Prisma.TareaWhereInput = {
//       // 🚀 Corrección: Aplica filtro de estatus SOLO si se proporciona
//       ...(estatus && { estatus: estatus }),
//       asignadorId: user.id, // Asignador directo
//     };

//     // 3. Transacción: total + datos
//     const [total, tareas] = await prisma.$transaction([
//       prisma.tarea.count({ where }),
//       prisma.tarea.findMany({
//         where,
//         include: {
//           departamento: { select: { id: true, nombre: true } },
//           asignador: { select: { id: true, nombre: true, rol: true } },
//           responsables: {
//             select: {
//               usuario: { select: { id: true, nombre: true, rol: true } },
//             },
//           },
//           imagenes: { select: { id: true, url: true, fechaSubida: true } },
//           historialFechas: {
//             include: { modificadoPor: { select: { id: true, nombre: true } } },
//             orderBy: { fechaCambio: "desc" },
//           },
//         },
//         orderBy: { id: "desc" },
//       }),
//     ]);

//     // 4. Limpiar responsables (aplanar arreglo)
//     const tareasLimpio = tareas.map((t) => ({
//       ...t,
//       responsables: t.responsables.map((r) => r.usuario),
//     }));

//     // 5. RESPUESTA
//     res.json({
//       info: { total, count: tareas.length },
//       data: tareasLimpio,
//     });
//   })
// );

// /* ✅ [GET /:id] Obtener una tarea por ID (Con Lógica de Permisos) */
// router.get(
//   "/:id",
//   verifyToken(),
//   safeAsync(async (req: Request, res: Response) => {
//     // 1. Validar el ID de la URL
//     const paramsParse = paramsSchema.safeParse(req.params);
//     if (!paramsParse.success) {
//       return res.status(400).json({
//         error: "ID de tarea inválido",
//         detalles: paramsParse.error.flatten().fieldErrors,
//       });
//     }
//     const { id: tareaId } = paramsParse.data;

//     // 2. Obtener el usuario del token
//     const user = req.user!;

//     // 3. Construir la cláusula 'where' base
//     const where: Prisma.TareaWhereInput = {
//       id: tareaId, // 🔹 Regla 1: El ID debe coincidir
//     };

//     // 4. 🔹 Aplicar lógica de permisos EXACTA de GET /
//     //    Creamos un array separado para las cláusulas 'AND' de seguridad.
//     const andClauses: Prisma.TareaWhereInput[] = [];

//     if (user.rol === "SUPER_ADMIN") {
//       // "Dios": Ve todo. No se añaden más filtros.
//     } else if (user.rol === "ADMIN") {
//       // ADMIN: Ve tareas de ENCARGADO, USUARIO, INVITADO en su depto.
//       if (!user.departamentoId) {
//         return res.status(403).json({ error: "Usuario sin departamento." });
//       }
//       andClauses.push({ departamentoId: user.departamentoId }); // 🔹 Regla 2: De su depto
//       andClauses.push({
//         // 🔹 Regla 3: De roles permitidos
//         responsables: {
//           some: {
//             usuario: { rol: { in: ["ENCARGADO", "USUARIO", "INVITADO"] } },
//           },
//         },
//       });
//     } else if (user.rol === "ENCARGADO") {
//       // ENCARGADO: Ve tareas de USUARIO e INVITADO en su depto.
//       if (!user.departamentoId) {
//         return res.status(403).json({ error: "Usuario sin departamento." });
//       }
//       andClauses.push({ departamentoId: user.departamentoId }); // 🔹 Regla 2: De su depto
//       andClauses.push({
//         // 🔹 Regla 3: De roles permitidos
//         responsables: {
//           some: {
//             usuario: { rol: { in: ["USUARIO", "INVITADO"] } },
//           },
//         },
//       });
//     } else if (user.rol === "USUARIO") {
//       // USUARIO: Ve tareas de otros USUARIOs en su depto O tareas propias.
//       if (!user.departamentoId) {
//         return res.status(403).json({ error: "Usuario sin departamento." });
//       }
//       andClauses.push({ departamentoId: user.departamentoId }); // 🔹 Regla 2: De su depto
//       andClauses.push({
//         // 🔹 Regla 3: Lógica OR
//         OR: [
//           {
//             // Tareas donde al menos un responsable es USUARIO
//             responsables: { some: { usuario: { rol: "USUARIO" } } },
//           },
//           {
//             // Tareas donde YO soy responsable
//             responsables: { some: { usuarioId: user.id } },
//           },
//         ],
//       });
//     } else if (user.rol === "INVITADO") {
//       // INVITADO: Se FUERZA el scope a solo sus tareas asignadas.
//       andClauses.push({
//         responsables: { some: { usuarioId: user.id } },
//       });
//     }

//     // 🔹 Finalmente, asignamos el array 'AND' al 'where'
//     if (andClauses.length > 0) {
//       where.AND = andClauses;
//     }

//     // 5. Ejecutar la consulta
//     //    'where' ahora es: { id: tareaId, AND: [ ...reglas de rol... ] }
//     const tarea: TareaDetallada | null = await prisma.tarea.findFirst({
//       where, // El 'where' dinámico y seguro protege la ruta
//       include: tareaDetalladaInclude, // Usamos el include detallado
//     });

//     // 6. Manejar 'No Encontrado'
//     if (!tarea) {
//       // Este error ahora es seguro:
//       // O la tarea no existe, O el usuario no tiene permisos para verla.
//       return res.status(404).json({
//         error: "Tarea no encontrada o no tienes permiso para verla.",
//       });
//     }

//     // 7. Limpiar la respuesta (igual que en GET /)
//     const tareaLimpia = {
//       ...tarea,
//       responsables: tarea.responsables.map((r) => r.usuario),
//     };

//     res.json(tareaLimpia);
//   })
// );

// /* ✅ [POST] Registrar un cambio de fecha (Crear Historial) */

// router.post(
//   "/:id/historial", // 1. Ruta más clara

//   // 2. Roles correctos (SUPER_ADMIN, ADMIN, ENCARGADO)

//   verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]),

//   safeAsync(async (req: Request, res: Response) => {
//     // 3. Validar el ID de la URL

//     const paramsParse = paramsSchema.safeParse(req.params);

//     if (!paramsParse.success) {
//       return res.status(400).json({
//         error: "ID de tarea inválido",

//         detalles: paramsParse.error.flatten().fieldErrors,
//       });
//     }

//     const { id: tareaId } = paramsParse.data;

//     // 4. Validar el body (fechas y motivo)

//     const bodyParse = historialSchema.safeParse(req.body);

//     if (!bodyParse.success) {
//       return res.status(400).json({
//         error: "Datos de historial inválidos",

//         detalles: bodyParse.error.flatten().fieldErrors,
//       });
//     }

//     // 5. Obtener datos validados y el ID del usuario (del TOKEN)

//     const { fechaAnterior, nuevaFecha, motivo } = bodyParse.data;

//     const { id: modificadoPorId } = req.user!; // ¡ID del token, no del body!

//     // 6. Verificar que la tarea exista

//     const tarea = await prisma.tarea.findUnique({ where: { id: tareaId } });

//     if (!tarea) {
//       return res.status(404).json({ error: "Tarea no encontrada" });
//     }

//     // 7. Crear el registro en la BD

//     const nuevoHistorial = await prisma.historialFecha.create({
//       data: {
//         fechaAnterior: fechaAnterior, // Fecha validada por Zod

//         nuevaFecha: nuevaFecha, // Fecha validada por Zod

//         motivo: motivo ?? null, // Motivo validado por Zod

//         // Conectar las relaciones

//         tarea: { connect: { id: tareaId } },

//         modificadoPor: { connect: { id: modificadoPorId } },
//       },
//       include: {
//         modificadoPor: { select: { nombre: true } },
//       },
//     });

//     res.status(201).json(nuevoHistorial);
//   })
// );

// /* ✅ [POST] Crear nueva tarea (Con Lógica de Permisos) */
// router.post(
//   "/",
//   // 1. Proteger la ruta... (sin cambios)
//   verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]),
//   safeAsync(async (req: Request, res: Response) => {
//     // 2. Obtener los datos del "Asignador"... (sin cambios)
//     const {
//       id: asignadorId,
//       rol: asignadorRol,
//       departamentoId: asignadorDeptoId,
//     } = req.user!; // Usamos '!' porque verifyToken asegura que req.user existe

//     // 3. Validar el body de la tarea... (sin cambios)
//     const bodyParse = crearTareaSchema.safeParse(req.body);
//     if (!bodyParse.success) {
//       return res.status(400).json({
//         error: "Datos de entrada inválidos",
//         detalles: bodyParse.error.flatten().fieldErrors,
//       });
//     }

//     // 🔽--- CORRECCIÓN 1: Desestructuramos 'observaciones' por separado ---🔽
//     // Esto es para manejar el 'undefined' que Zod puede enviar.
//     const { departamentoId, responsables, observaciones, ...data } =
//       bodyParse.data;

//     // 4. APLICAR REGLAS DE NEGOCIO... (sin cambios)
//     // Regla 1: Scope de Departamento
//     if (asignadorRol !== "SUPER_ADMIN") {
//       if (departamentoId !== asignadorDeptoId) {
//         return res.status(403).json({
//           error: "Acceso denegado",
//           detalle: "Solo puedes asignar tareas a tu propio departamento.",
//         });
//       }
//     }

//     // Regla 2: Scope de Responsables
//     const usuariosResponsables = await prisma.usuario.findMany({
//       where: {
//         id: { in: responsables },
//         estatus: "ACTIVO",
//       },
//       select: { id: true, rol: true, departamentoId: true },
//     });

//     if (usuariosResponsables.length !== responsables.length) {
//       return res.status(400).json({
//         error: "Responsables inválidos",
//         detalle:
//           "Uno o más usuarios responsables no existen o están inactivos.",
//       });
//     }

//     for (const responsable of usuariosResponsables) {
//       if (asignadorRol === "ADMIN") {
//         const esValido =
//           (responsable.rol === "ENCARGADO" &&
//             responsable.departamentoId === asignadorDeptoId) ||
//           (responsable.rol === "USUARIO" &&
//             responsable.departamentoId === asignadorDeptoId) ||
//           responsable.rol === "INVITADO";

//         if (!esValido) {
//           return res.status(403).json({
//             error: "Asignación denegada",
//             detalle: `Como ADMIN, solo puedes asignar tareas a Encargados/Usuarios de tu departamento, o a Invitados. El usuario ID ${responsable.id} no cumple.`,
//           });
//         }
//       } else if (asignadorRol === "ENCARGADO") {
//         const esValido =
//           (responsable.rol === "USUARIO" &&
//             responsable.departamentoId === asignadorDeptoId) ||
//           responsable.rol === "INVITADO";

//         if (!esValido) {
//           return res.status(403).json({
//             error: "Asignación denegada",
//             detalle: `Como ENCARGADO, solo puedes asignar tareas a Usuarios de tu departamento, o a Invitados. El usuario ID ${responsable.id} no cumple.`,
//           });
//         }
//       }
//     }

//     // 5. CREAR LA TAREA (Con correcciones)

//     // 👇👇👇 AQUÍ ESTÁ EL FIX AGREGADO 👇👇👇
//     // Ajustar fechaLimite al final del día (23:59:59.999)
//     const fechaLimiteAjustada = new Date(data.fechaLimite);
//     fechaLimiteAjustada.setHours(23, 59, 59, 999);
//     // 👆👆👆 FIN DEL FIX 👆👆👆

//     // 🔽--- CORRECCIÓN 2: Tipamos 'nuevaTarea' con nuestro Payload ---🔽
//     const nuevaTarea: TareaCreadaConRelaciones = await prisma.tarea.create({
//       data: {
//         ...data, // tarea, estatus, urgencia
//         fechaLimite: fechaLimiteAjustada, // 👈 USAMOS LA FECHA AJUSTADA AQUÍ (FIX APLICADO)
//         // 🔽--- CORRECCIÓN 1 (B): Asignamos 'observaciones' coalesciendo undefined a null ---🔽
//         observaciones: observaciones ?? null,
//         fechaRegistro: new Date(),
//         asignador: { connect: { id: asignadorId } }, // El usuario logueado
//         departamento: { connect: { id: departamentoId } }, // El depto. de la tarea

//         // Crear las entradas en la tabla pivote
//         responsables: {
//           create: responsables.map((userId) => ({
//             usuario: {
//               connect: { id: userId }, // Conectar con cada responsable
//             },
//           })),
//         },
//       },
//       // 🔽--- CORRECCIÓN 2 (B): Usamos nuestro 'include' constante ---🔽
//       include: tareaConRelacionesInclude,
//     });

//     await sendNotificationToUsers(
//       responsables,
//       `Nueva Tarea Asignada (ID: ${nuevaTarea.id})`,
//       nuevaTarea.tarea, // El cuerpo de la notificación es el nombre de la tarea
//       `/admin` // Ruta a la que irá el usuario al hacer clic
//     );

//     // 6. Limpiar respuesta (Ahora funciona sin errores)
//     const tareaLimpia = {
//       ...nuevaTarea,
//       // TypeScript ahora sabe que 'nuevaTarea.responsables' existe
//       // y que 'r' es del tipo correcto.
//       responsables: nuevaTarea.responsables.map((r) => r.usuario),
//     };

//     res.status(201).json(tareaLimpia);
//   })
// );

// /* ✅ [PUT /:id] Actualizar una tarea existente (Con Lógica de Permisos) */
// router.put(
//   "/:id",
//   // 1. Solo SUPER_ADMIN, ADMIN, y ENCARGADO pueden intentar actualizar
//   verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]),
//   safeAsync(async (req: Request, res: Response) => {
//     // 2. Validar ID de la URL
//     const paramsParse = paramsSchema.safeParse(req.params);
//     if (!paramsParse.success) {
//       return res.status(400).json({
//         error: "ID de tarea inválido",
//         detalles: paramsParse.error.flatten().fieldErrors,
//       });
//     }
//     const { id: tareaId } = paramsParse.data;

//     // 3. Validar el body
//     const bodyParse = actualizarTareaSchema.safeParse(req.body);
//     if (!bodyParse.success) {
//       return res.status(400).json({
//         error: "Datos de entrada inválidos",
//         detalles: bodyParse.error.flatten().fieldErrors,
//       });
//     }
//     const validatedBody = bodyParse.data;

//     // 4. Obtener el usuario que hace la petición
//     const user = req.user!;

//     // 5. Obtener la tarea existente con datos CRUCIALES para la validación
//     // 👁️ IMPORTANTE: Incluimos 'asignador' para ver el rol de quien creó la tarea
//     const tareaExistente = await prisma.tarea.findUnique({
//       where: { id: tareaId },
//       include: {
//         responsables: {
//           select: { usuarioId: true },
//         },
//         asignador: {
//           select: { id: true, rol: true },
//         },
//       },
//     });

//     if (!tareaExistente) {
//       return res.status(404).json({ error: "Tarea no encontrada" });
//     }

//     // 6. REGLAS DE PERMISO BASE (Departamento)
//     const esSuperAdmin = user.rol === "SUPER_ADMIN";
//     const esAdminDepto =
//       user.rol === "ADMIN" &&
//       tareaExistente.departamentoId === user.departamentoId;
//     const esEncargadoDepto =
//       user.rol === "ENCARGADO" &&
//       tareaExistente.departamentoId === user.departamentoId;

//     // Si no es SuperAdmin, ni Admin/Encargado de ese depto, se rechaza de entrada
//     if (!esSuperAdmin && !esAdminDepto && !esEncargadoDepto) {
//       return res.status(403).json({
//         error: "Acceso denegado",
//         detalle: "No tienes permiso para editar tareas de este departamento.",
//       });
//     }

//     // ========================================================================
//     // 🔒 7. LÓGICA DE RESTRICCIONES PARA 'ENCARGADO'
//     // ========================================================================
//     if (user.rol === "ENCARGADO") {
//       const rolCreador = tareaExistente.asignador?.rol;

//       // CASO A: Tarea creada por un ADMIN (o SUPER_ADMIN) -> BLOQUEO TOTAL
//       // "A las tareas de ADMIN no se va a poder hacer nada"
//       if (rolCreador === "ADMIN" || rolCreador === "SUPER_ADMIN") {
//         return res.status(403).json({
//           error: "Edición Bloqueada",
//           detalle:
//             "No puedes editar tareas que fueron asignadas por un Administrador. Solo el Admin puede modificarlas.",
//         });
//       }

//       // CASO B: Tarea creada por OTRO Encargado (o por mí) -> PERMITIDO TODO
//       // "De las tareas que haya agregado otro ENCARGADO va a poder editar todo también"
//       // Por lo tanto, no agregamos restricciones de campos (else) aquí.
//     }
//     // ========================================================================

//     // 8. Construir el payload de actualización
//     const dataParaActualizar: Prisma.TareaUpdateInput = {};

//     // --- Campos Estándar ---
//     if (validatedBody.tarea !== undefined)
//       dataParaActualizar.tarea = validatedBody.tarea;
//     if (validatedBody.observaciones !== undefined)
//       dataParaActualizar.observaciones = validatedBody.observaciones ?? null;
//     if (validatedBody.urgencia !== undefined)
//       dataParaActualizar.urgencia = validatedBody.urgencia;
//     if (validatedBody.fechaLimite !== undefined)
//       dataParaActualizar.fechaLimite = validatedBody.fechaLimite;

//     // --- Campo Especial: Estatus ---
//     // Nota: Aunque permitimos editar estatus aquí, la validación/cancelación "oficial"
//     // con lógica de negocio compleja suele hacerse en los endpoints PATCH.
//     if (validatedBody.estatus !== undefined) {
//       dataParaActualizar.estatus = validatedBody.estatus;

//       // Lógica básica de fechaConclusión automática si se cambia por aquí
//       if (
//         validatedBody.estatus === "CONCLUIDA" &&
//         tareaExistente.estatus !== "CONCLUIDA"
//       ) {
//         dataParaActualizar.fechaConclusion = new Date();
//       } else if (validatedBody.estatus !== "CONCLUIDA") {
//         dataParaActualizar.fechaConclusion = null; // Re-abrir una tarea
//       }
//     }

//     // --- Campos de Relación ---

//     // Solo SuperAdmin puede cambiar una tarea de departamento
//     if (validatedBody.departamentoId !== undefined) {
//       if (!esSuperAdmin) {
//         return res.status(403).json({
//           error: "Acceso denegado",
//           detalle:
//             "Solo un Super Admin puede cambiar una tarea de departamento.",
//         });
//       }
//       dataParaActualizar.departamento = {
//         connect: { id: validatedBody.departamentoId },
//       };
//     }

//     // Si se actualizan los responsables
//     if (validatedBody.responsables !== undefined) {
//       const { rol: asignadorRol, departamentoId: asignadorDeptoId } = user;

//       const targetDeptoId =
//         validatedBody.departamentoId ?? tareaExistente.departamentoId;

//       // Validar que no asigne a otro departamento (si no es SuperAdmin)
//       if (
//         asignadorRol !== "SUPER_ADMIN" &&
//         targetDeptoId !== asignadorDeptoId
//       ) {
//         return res.status(403).json({
//           error:
//             "No puedes asignar responsables a un departamento que no es el tuyo.",
//         });
//       }

//       const usuariosResponsables = await prisma.usuario.findMany({
//         where: { id: { in: validatedBody.responsables }, estatus: "ACTIVO" },
//         select: { id: true, rol: true, departamentoId: true },
//       });

//       if (usuariosResponsables.length !== validatedBody.responsables.length) {
//         return res
//           .status(400)
//           .json({ error: "Uno o más responsables son inválidos o inactivos." });
//       }

//       for (const responsable of usuariosResponsables) {
//         if (asignadorRol === "ADMIN") {
//           const esValido =
//             (responsable.rol === "ENCARGADO" &&
//               responsable.departamentoId === asignadorDeptoId) ||
//             (responsable.rol === "USUARIO" &&
//               responsable.departamentoId === asignadorDeptoId) ||
//             responsable.rol === "INVITADO";
//           if (!esValido)
//             return res.status(403).json({
//               error:
//                 "Como ADMIN, solo puedes asignar a Encargados/Usuarios de tu depto o Invitados.",
//             });
//         } else if (asignadorRol === "ENCARGADO") {
//           const esValido =
//             (responsable.rol === "USUARIO" &&
//               responsable.departamentoId === asignadorDeptoId) ||
//             responsable.rol === "INVITADO";
//           if (!esValido)
//             return res.status(403).json({
//               error:
//                 "Como ENCARGADO, solo puedes asignar a Usuarios de tu depto o Invitados.",
//             });
//         }
//       }

//       // Actualizar la tabla pivote
//       dataParaActualizar.responsables = {
//         deleteMany: {}, // Borra anteriores
//         create: validatedBody.responsables.map((userId) => ({
//           usuario: { connect: { id: userId } },
//         })),
//       };
//     }

//     // 9. Ejecutar la actualización en la BD
//     const tareaActualizada: TareaCreadaConRelaciones =
//       await prisma.tarea.update({
//         where: { id: tareaId },
//         data: dataParaActualizar,
//         include: tareaConRelacionesInclude,
//       });

//     // 10. Notificaciones (Solo si cambió el estatus)
//     if (
//       validatedBody.estatus &&
//       validatedBody.estatus !== tareaExistente.estatus
//     ) {
//       const idsResponsables = tareaExistente.responsables.map(
//         (r) => r.usuarioId
//       );
//       let tituloNotificacion = "";

//       if (validatedBody.estatus === "CONCLUIDA") {
//         tituloNotificacion = "Tarea Validada y Concluida";
//       } else if (validatedBody.estatus === "CANCELADA") {
//         tituloNotificacion = "Tarea Cancelada";
//       }

//       if (tituloNotificacion) {
//         await sendNotificationToUsers(
//           idsResponsables,
//           tituloNotificacion,
//           `La tarea "${
//             tareaActualizada.tarea
//           }" ahora está ${validatedBody.estatus.toLowerCase()}.`,
//           `/admin`
//         );
//       }
//     }

//     // 11. Limpiar y devolver respuesta
//     const tareaLimpia = {
//       ...tareaActualizada,
//       responsables: tareaActualizada.responsables.map((r) => r.usuario),
//     };

//     res.json(tareaLimpia);
//   })
// );

// /* ✅ [PATCH /:id/complete] Marcar una tarea como CONCLUIDA (Validar) */
// router.patch(
//   "/:id/complete",
//   // 1. Proteger la ruta (Solo estos roles pueden INTENTAR validar)
//   verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]),
//   safeAsync(async (req: Request, res: Response) => {
//     // 2. Validar ID de la URL
//     const paramsParse = paramsSchema.safeParse(req.params);
//     if (!paramsParse.success) {
//       return res.status(400).json({
//         error: "ID de tarea inválido",
//         detalles: paramsParse.error.flatten().fieldErrors,
//       });
//     }
//     const { id: tareaId } = paramsParse.data;

//     // 3. Obtener el usuario que está validando (del token)
//     const user = req.user!;

//     // 4. Obtener la tarea que se quiere completar
//     const tareaExistente = await prisma.tarea.findUnique({
//       where: { id: tareaId },
//       include: {
//         // Incluimos responsables para poder notificarlos
//         responsables: {
//           select: { usuarioId: true },
//         },
//       },
//     });

//     if (!tareaExistente) {
//       return res.status(404).json({ error: "Tarea no encontrada" });
//     }

//     // 5. 🚀 LÓGICA DE PERMISOS (Según tus reglas)
//     const esSuperAdmin = user.rol === "SUPER_ADMIN";
//     const esAdmin = user.rol === "ADMIN";
//     // Regla del Encargado: Su rol es ENCARGADO y él es el asignador
//     const esEncargadoAsignador =
//       user.rol === "ENCARGADO" && tareaExistente.asignadorId === user.id;

//     // Si NO es SuperAdmin, Y NO es Admin, Y NO es el Encargado que asignó...
//     if (!esSuperAdmin && !esAdmin && !esEncargadoAsignador) {
//       // ...entonces denegar el permiso.
//       return res.status(403).json({
//         error: "Acceso denegado",
//         detalle:
//           "No tienes permiso para validar esta tarea. Los Encargados solo pueden validar tareas que ellos mismos asignaron.",
//       });
//     }

//     // 6. Si pasa los permisos, actualizar la tarea
//     const tareaActualizada = await prisma.tarea.update({
//       where: { id: tareaId },
//       data: {
//         estatus: "CONCLUIDA",
//         fechaConclusion: new Date(), // Establece la fecha de conclusión
//       },
//       // Usamos el include genérico que ya tienes definido
//       include: tareaConRelacionesInclude,
//     });

//     // 7. Notificar a los responsables
//     const idsResponsables = tareaExistente.responsables.map((r) => r.usuarioId);

//     if (idsResponsables.length > 0) {
//       await sendNotificationToUsers(
//         idsResponsables,
//         `Tarea Validada (ID: ${tareaActualizada.id})`,
//         `La tarea "${tareaActualizada.tarea}" ha sido marcada como CONCLUIDA.`,
//         `/admin` // O la ruta a la que debe ir el usuario
//       );
//     }

//     // 8. Limpiar y devolver la respuesta
//     const tareaLimpia = {
//       ...tareaActualizada,
//       responsables: tareaActualizada.responsables.map((r) => r.usuario),
//     };

//     res.json(tareaLimpia);
//   })
// );

// /* ✅ [PATCH /:id/cancel] Marcar una tarea como CANCELADA */
// router.patch(
//   "/:id/cancel",
//   // 1. Proteger la ruta (Solo estos roles pueden INTENTAR cancelar)
//   verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]),
//   safeAsync(async (req: Request, res: Response) => {
//     // 2. Validar ID
//     const paramsParse = paramsSchema.safeParse(req.params);
//     if (!paramsParse.success) {
//       return res.status(400).json({ error: "ID de tarea inválido" });
//     }
//     const { id: tareaId } = paramsParse.data;

//     // 3. Obtener usuario y tarea
//     const user = req.user!;
//     const tareaExistente = await prisma.tarea.findUnique({
//       where: { id: tareaId },
//       include: {
//         responsables: { select: { usuarioId: true } },
//       },
//     });

//     if (!tareaExistente) {
//       return res.status(404).json({ error: "Tarea no encontrada" });
//     }

//     // 4. LÓGICA DE PERMISOS (Idéntica a la de 'completar' o la que definas)
//     const esSuperAdmin = user.rol === "SUPER_ADMIN";
//     const esAdmin = user.rol === "ADMIN";
//     const esEncargadoAsignador =
//       user.rol === "ENCARGADO" && tareaExistente.asignadorId === user.id;

//     if (!esSuperAdmin && !esAdmin && !esEncargadoAsignador) {
//       return res.status(403).json({
//         error: "Acceso denegado",
//         detalle: "No tienes permiso para cancelar esta tarea.",
//       });
//     }

//     // 5. Actualizar la tarea
//     const tareaActualizada = await prisma.tarea.update({
//       where: { id: tareaId },
//       data: {
//         estatus: "CANCELADA",
//         fechaConclusion: null, // Opcional: limpiar fecha de conclusión si la tuviera
//       },
//       include: tareaConRelacionesInclude,
//     });

//     // 6. Notificar (Opcional, pero recomendado)
//     const idsResponsables = tareaExistente.responsables.map((r) => r.usuarioId);
//     await sendNotificationToUsers(
//       idsResponsables,
//       `Tarea Cancelada (ID: ${tareaActualizada.id})`,
//       `La tarea "${tareaActualizada.tarea}" ha sido CANCELADA.`,
//       `/admin`
//     );

//     // 7. Devolver respuesta
//     const tareaLimpia = {
//       ...tareaActualizada,
//       responsables: tareaActualizada.responsables.map((r) => r.usuario),
//     };
//     res.json(tareaLimpia);
//   })
// );


// /* ✅ [POST /:id/entregar] El Usuario entrega la tarea (Sube evidencia y congela tiempo) */
// router.post(
//   "/:id/entregar",
//   verifyToken(),
//   uploadEvidenciasMiddleware,
//   safeAsync(async (req: Request, res: Response) => {
//     // 1. Validar ID
//     const paramsParse = paramsSchema.safeParse(req.params);
//     if (!paramsParse.success) return res.status(400).json({ error: "ID inválido" });
//     const { id: tareaId } = paramsParse.data;
//     const user = req.user!;

//     // 2. Buscar la tarea
//     const tarea = await prisma.tarea.findUnique({
//       where: { id: tareaId },
//       include: {
//         responsables: { select: { usuarioId: true } },
//         asignador: true,
//       },
//     });

//     if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

//     // 3. Validar Permisos
//     const esResponsable = tarea.responsables.some((r) => r.usuarioId === user.id);
//     const esSuperAdmin = user.rol === "SUPER_ADMIN";

//     if (!esResponsable && !esSuperAdmin) {
//       return res.status(403).json({
//         error: "No puedes entregar esta tarea porque no estás asignado a ella.",
//       });
//     }

//     // 4. Validar Estatus
//     if (tarea.estatus !== "PENDIENTE") {
//       return res.status(400).json({
//         error: `No se puede entregar. La tarea está actualmente ${tarea.estatus}.`,
//       });
//     }

//     // 5. Procesar Imágenes
//     let imagenesData: any[] = [];
//     if (req.files && (req.files as any[]).length > 0) {
//       imagenesData = (req.files as any[]).map((file: any) => ({
//         url: file.path,
//         tareaId: tareaId,
//       }));
//     }

//     // 6. Transacción
//     const comentario = req.body.comentarioEntrega || "Tarea marcada como entregada.";

//     const tareaActualizada = await prisma.$transaction(async (tx) => {
//       if (imagenesData.length > 0) {
//         await tx.imagenTarea.createMany({ data: imagenesData });
//       }

//       return await tx.tarea.update({
//         where: { id: tareaId },
//         data: {
//           estatus: "EN_REVISION",
//           fechaEntrega: new Date(),
//           comentarioEntrega: comentario,
//         },
//       });
//     });

//     // 7. Notificación
//     await sendNotificationToUsers(
//       [tarea.asignadorId],
//       `Tarea Entregada 📩`,
//       `${user.nombre} ha enviado evidencias para la tarea: "${tarea.tarea}".`,
//       `/admin`
//     );

//     res.json({
//       message: "Tarea enviada a revisión correctamente.",
//       tarea: tareaActualizada,
//     });
//   })
// );

// /* ✅ [POST /:id/revision] El Jefe Aprueba o Rechaza la entrega */
// router.post(
//   "/:id/revision",
//   verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]),
//   safeAsync(async (req: Request, res: Response) => {
//     // 1. Validar ID y Body
//     const paramsParse = paramsSchema.safeParse(req.params);
//     const bodyParse = revisionTareaSchema.safeParse(req.body);

//     if (!paramsParse.success) return res.status(400).json({ error: "ID inválido" });
//     if (!bodyParse.success) {
//       return res.status(400).json({
//         error: "Datos inválidos",
//         detalles: bodyParse.error.flatten().fieldErrors,
//       });
//     }

//     const { id: tareaId } = paramsParse.data;
//     const { decision, feedback, nuevaFechaLimite } = bodyParse.data;
//     const user = req.user!;

//     // 2. Buscar Tarea
//     const tarea = await prisma.tarea.findUnique({
//       where: { id: tareaId },
//       include: {
//         responsables: { select: { usuarioId: true } },
//       },
//     });

//     if (!tarea) return res.status(404).json({ error: "Tarea no encontrada" });

//     // 3. Validar Permisos
//     const esAsignador = tarea.asignadorId === user.id;
//     const esSuperAdmin = user.rol === "SUPER_ADMIN";
//     const esAdminDepto =
//       user.rol === "ADMIN" && tarea.departamentoId === user.departamentoId;

//     if (!esAsignador && !esSuperAdmin && !esAdminDepto) {
//       return res.status(403).json({
//         error: "No tienes permiso para revisar esta tarea.",
//       });
//     }

//     // 4. Validar Estatus
//     if (tarea.estatus !== "EN_REVISION") {
//       return res.status(400).json({
//         error: "Esta tarea no está esperando revisión.",
//       });
//     }

//     // 5. Lógica de Decisión
//     let tareaActualizada;
//     const idsResponsables = tarea.responsables.map((r) => r.usuarioId);

//     if (decision === "APROBAR") {
//       tareaActualizada = await prisma.tarea.update({
//         where: { id: tareaId },
//         data: {
//           estatus: "CONCLUIDA",
//           fechaConclusion: new Date(),
//           fechaRevision: new Date(),
//           feedbackRevision: feedback ?? "Aprobada.",
//         },
//       });

//       await sendNotificationToUsers(
//         idsResponsables,
//         "✅ Tarea Aprobada",
//         `Tu entrega de "${tarea.tarea}" ha sido validada.`,
//         `/mis-tareas`
//       );
//     } else {
//       // RECHAZO
//       if (nuevaFechaLimite) {
//         await prisma.historialFecha.create({
//           data: {
//             fechaAnterior: tarea.fechaLimite,
//             nuevaFecha: nuevaFechaLimite,
//             motivo: `Rechazo: ${feedback || "Correcciones"}`,
//             tareaId: tareaId,
//             modificadoPorId: user.id,
//           },
//         });
//       }

//       // CORRECCIÓN 2: Uso del spread operator (...) para la fecha límite
//       // Esto evita pasar 'undefined' explícitamente, lo cual TypeScript odia en strict mode.
//       tareaActualizada = await prisma.tarea.update({
//         where: { id: tareaId },
//         data: {
//           estatus: "PENDIENTE",
//           fechaEntrega: null, // Reset del reloj
//           fechaRevision: new Date(),
//           feedbackRevision: feedback ?? null,
//           // Si nuevaFechaLimite existe, agregamos la propiedad al objeto. Si no, no la ponemos.
//           ...(nuevaFechaLimite && { fechaLimite: nuevaFechaLimite }),
//         },
//       });

//       await sendNotificationToUsers(
//         idsResponsables,
//         "⚠️ Tarea Rechazada",
//         `Se requiere corrección. Motivo: ${feedback || "Ver detalles"}`,
//         `/mis-tareas`
//       );
//     }

//     res.json({
//       message: `Tarea ${decision} exitosamente.`,
//       tarea: tareaActualizada,
//     });
//   })
// );

// // --- NUEVOS ENDPOINTS PARA IMÁGENES ---

// /**
//  * ✅ Subir una o más imágenes para una tarea
//  * El frontend debe enviar un FormData con un campo "imagenes"
//  */
// /* ✅ [POST /:id/upload] Subir una o más imágenes para una tarea */
// router.post(
//   "/:id/upload",
//   // 1. Solo roles que pueden crear/editar pueden subir
//   verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]),
//   uploadImagenesMiddleware,
//   safeAsync(async (req: Request, res: Response) => {
//     // 2. Validar el ID de la URL
//     const paramsParse = paramsSchema.safeParse(req.params);
//     if (!paramsParse.success) {
//       return res.status(400).json({ error: "ID de tarea inválido" });
//     }
//     const { id: tareaId } = paramsParse.data;

//     // 3. Obtener la tarea y el usuario que sube
//     const user = req.user!;
//     const tarea = await prisma.tarea.findUnique({
//       where: { id: tareaId },
//     });

//     if (!tarea) {
//       return res.status(404).json({ error: "Tarea no encontrada" });
//     }

//     // 4. Aplicar los mismos permisos que para editar
//     const esSuperAdmin = user.rol === "SUPER_ADMIN";
//     const esAdminDepto =
//       user.rol === "ADMIN" && tarea.departamentoId === user.departamentoId;
//     const esEncargadoDepto =
//       user.rol === "ENCARGADO" && tarea.departamentoId === user.departamentoId;

//     if (!esSuperAdmin && !esAdminDepto && !esEncargadoDepto) {
//       return res.status(403).json({
//         error: "Acceso denegado",
//         detalle: "No tienes permiso para subir imágenes a esta tarea.",
//       });
//     }

//     // 5. Verificar que se subieron archivos
//     if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
//       return res.status(400).json({ error: "No se subió ningún archivo" });
//     }

//     // 6. Preparar datos para la BD
//     // Cloudinary Storage agrega el path (URL completa) y el filename (Public ID)
//     const imagenesData = (req.files as any[]).map((file: any) => ({
//       url: file.path, // 🚀 Usamos la URL completa de Cloudinary
//       tareaId: tareaId,
//     }));

//     // 7. Guardar en la BD
//     const resultado = await prisma.imagenTarea.createMany({
//       data: imagenesData,
//     });

//     res.status(201).json(resultado);
//   })
// );

// /**
//  * Helper para extraer el Public ID de una URL de Cloudinary (ej. "tareas/unique-id")
//  * @param url La URL completa de Cloudinary (ej. https://res.cloudinary.com/...)
//  * @param folder La carpeta en Cloudinary (ej. "tareas")
//  * @returns El Public ID (ej. "tareas/imagenes-1761...")
//  */
// const getPublicIdFromCloudinaryUrl = (
//   url: string,
//   folder: string
// ): string | null => {
//   // El Public ID en Cloudinary es la parte después de '/upload/v[version]/'.
//   // En este caso, el Public ID completo incluye la carpeta: "tareas/nombre-archivo"
//   const regex = new RegExp(`v\\d+\\/(${folder}\\/[^\\/\\.]+)`);
//   const match = url.match(regex);
//   if (match && match[1]) {
//     return match[1];
//   }
//   return null;
// };

// /**
//  * ✅ Borrar una imagen específica por su ID
//  */
// router.delete(
//   "/imagen/:id",
//   // 1. Solo roles que pueden editar pueden borrar
//   verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]),
//   safeAsync(async (req: Request, res: Response) => {
//     // 2. Validar el ID de la imagen
//     const paramsParse = paramsSchema.safeParse(req.params);
//     if (!paramsParse.success) {
//       return res.status(400).json({ error: "ID de imagen inválido" });
//     }
//     const { id: imagenId } = paramsParse.data;

//     // 3. Obtener el usuario y la imagen (incluyendo la tarea a la que pertenece)
//     const user = req.user!;
//     const imagen = await prisma.imagenTarea.findUnique({
//       where: { id: imagenId },
//       include: {
//         tarea: true, // ¡Incluimos la tarea para verificar permisos!
//       },
//     });

//     if (!imagen) {
//       return res.status(404).json({ error: "Imagen no encontrada" });
//     }

//     // 4. Aplicar REGLAS DE PERMISO
//     const { tarea } = imagen;
//     const esSuperAdmin = user.rol === "SUPER_ADMIN";
//     const esAdminDepto =
//       user.rol === "ADMIN" && tarea.departamentoId === user.departamentoId;

//     // Regla Propuesta: Encargado puede borrar si él asignó la tarea
//     const esEncargadoAsignador =
//       user.rol === "ENCARGADO" &&
//       tarea.departamentoId === user.departamentoId &&
//       tarea.asignadorId === user.id;

//     if (!esSuperAdmin && !esAdminDepto && !esEncargadoAsignador) {
//       return res.status(403).json({
//         error: "Acceso denegado",
//         detalle: "No tienes permiso para borrar esta imagen.",
//       });
//     }

//     // 🚀 5. Borrar el archivo de Cloudinary (REEMPLAZA fs.unlink)
//     const publicId = getPublicIdFromCloudinaryUrl(imagen.url, "tareas");

//     if (publicId) {
//       // Borrar el recurso de Cloudinary usando su Public ID
//       await cloudinary.uploader
//         .destroy(publicId)
//         .then(() => {
//           console.log(`✅ Archivo Cloudinary borrado: ${publicId}`);
//         })
//         .catch((err) => {
//           // Si el borrado falla (ej. imagen ya borrada, error de red), solo lo loggeamos
//           console.error(
//             `❌ Error al borrar el archivo de Cloudinary (${publicId}):`,
//             err
//           );
//           // La operación de la base de datos debe continuar
//         });
//     } else {
//       console.warn(
//         `⚠️ No se pudo extraer el Public ID de la URL: ${imagen.url}`
//       );
//     }

//     // 6. Borrar el registro de la BD
//     await prisma.imagenTarea.delete({
//       where: { id: imagenId },
//     });

//     res.json({ message: "Imagen eliminada correctamente" });
//   })
// );

// export default router;
