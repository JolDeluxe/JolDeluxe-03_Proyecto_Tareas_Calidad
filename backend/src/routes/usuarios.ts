import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma, Rol, EstatusUsuario } from "@prisma/client";
import { z } from "zod";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { JwtPayload, SignOptions, Secret } from "jsonwebtoken";
import { verifyToken } from "../middleware/verifyToken.js";
import bcrypt from "bcryptjs";

dotenv.config();

const router = Router();
const prisma = new PrismaClient();
const SECRET: Secret = process.env.JWT_SECRET ?? "default_secret";

/* 🧱 Helper genérico para capturar errores async */
const safeAsync =
  (
    fn: (
      req: Request,
      res: Response,
      next: NextFunction
    ) => Promise<void | Response> | void
  ) =>
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void | Response> => {
    try {
      await fn(req, res, next);
    } catch (error: any) {
      console.error("❌ Error inesperado:", error);

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          const target = (error.meta?.target as string[])?.join(", ");
          return res.status(409).json({
            error: "Conflicto de datos",
            detalle: `El campo '${target}' ya existe y debe ser único.`,
          });
        }
        if (error.code === "P2025") {
          return res.status(404).json({ error: "Recurso no encontrado" });
        }
      }

      if (!res.headersSent) {
        res.status(500).json({
          error: "Ocurrió un error inesperado en el servidor",
          detalle: error?.message ?? error,
        });
      }
    }
  };

// ===================================================================
// ESQUEMAS DE VALIDACIÓN (ZOD)
// ===================================================================

const querySchema = z.object({
  departamentoId: z.coerce.number().int().positive().optional(),
  estatus: z.nativeEnum(EstatusUsuario).optional(),
});

/**
 * Esquema para validar la creación de un nuevo usuario.
 */
const crearUsuarioSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .nonempty("El nombre es requerido")
      .min(3, "El nombre debe tener al menos 3 caracteres"),
    username: z
      .string()
      .trim()
      .nonempty("El username es requerido")
      .min(4, "El username debe tener al menos 4 caracteres"),
    password: z
      .string()
      .nonempty("La contraseña es requerida")
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
    rol: z.nativeEnum(Rol, {
      message: "Rol inválido",
    }),
    departamentoId: z.number().int().positive().optional().nullable(),
  })
  .refine(
    (data) => {
      // Regla 1: INVITADO DEBE ser nulo.
      if (
        (data.rol === "SUPER_ADMIN" || data.rol === "INVITADO") &&
        data.departamentoId !== null &&
        data.departamentoId !== undefined
      ) {
        // Falla si es INVITADO y SÍ tiene un ID de departamento
        return false;
      }
      return true;
    },
    {
      message: "El departamentoId debe ser nulo para el rol INVITADO",
      path: ["departamentoId"],
    }
  )
  .refine(
    (data) => {
      // Regla 2: ADMIN, ENCARGADO y USUARIO DEBEN tener un departamentoId.
      if (
        (data.rol === "ADMIN" ||
          data.rol === "ENCARGADO" ||
          data.rol === "USUARIO") &&
        (data.departamentoId === null || data.departamentoId === undefined)
      ) {
        // Falla si es uno de estos roles y NO tiene un ID
        return false;
      }
      return true;
    },
    {
      message:
        "El departamentoId es obligatorio para roles ADMIN, ENCARGADO y USUARIO",
      path: ["departamentoId"],
    }
  );

/**
 * Esquema para validar el 'id' de los parámetros de la URL
 */
const paramsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "El ID debe ser un número")
    .transform(Number)
    .refine((num) => num > 0, "El ID debe ser positivo"),
});

/**
 * Esquema para ACTUALIZAR. Todos los campos son opcionales.
 * Si se envía 'password', debe cumplir el min(6).
 */
const actualizarUsuarioSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres")
      .optional(),
    username: z
      .string()
      .trim()
      .min(4, "El username debe tener al menos 4 caracteres")
      .optional(),
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .optional(),
    rol: z
      .nativeEnum(Rol, {
        message: "Rol inválido",
      })
      .optional(),
    departamentoId: z.number().int().positive().nullable().optional(),
    estatus: z.nativeEnum(EstatusUsuario).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar.",
  });

const estatusSchema = z.object({
  estatus: z.nativeEnum(EstatusUsuario, {
    message: "Estatus inválido (Debe ser ACTIVO o INACTIVO)",
  }),
});

const subscriptionSchema = z.object({
  endpoint: z.string().url("Endpoint de suscripción inválido"),
  keys: z.object({
    p256dh: z.string().nonempty("Key p256dh requerida"),
    auth: z.string().nonempty("Key auth requerida"),
  }),
});

// ===================================================================
// CRUD DE USUARIOS
// ===================================================================

/* ✅ [READ] Obtener todos los usuarios */
router.get(
  "/",
  verifyToken(), // 🔹 2. Proteger la ruta
  safeAsync(async (req: Request, res: Response) => {
    // 🔹 3. Obtener el usuario logueado
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // 4. Validar los query params
    const queryParseResult = querySchema.safeParse(req.query);
    if (!queryParseResult.success) {
      return res.status(400).json({
        error: "Query param inválido",
        detalles: queryParseResult.error.flatten().fieldErrors,
      });
    }

    const { departamentoId, estatus } = queryParseResult.data;

    // 5. ⭐️ MODIFICADO: El filtro base ahora SIEMPRE excluye a INVITADOS
    const where: Prisma.UsuarioWhereInput = {
      estatus: estatus ?? "ACTIVO",
      rol: {
        not: "INVITADO", // <-- REGLA GLOBAL DE EXCLUSIÓN
      },
    };

    // 🔹 6. Crear array para cláusulas de seguridad
    const andClauses: Prisma.UsuarioWhereInput[] = [];

    // 7. 🔹 APLICAR LÓGICA DE ROLES (simplificada)
    switch (user.rol) {
      case "SUPER_ADMIN":
        // Regla: Ve todo (excepto INVITADOS, ya cubierto por el 'where' base).
        // Respeta el query param de 'departamentoId' si el admin lo usa.
        if (departamentoId) {
          where.departamentoId = departamentoId;
        }
        break;

      case "ADMIN":
        // Regla: (Usuarios de su depto)
        // ⭐️ MODIFICADO: Ya no necesita la cláusula OR para INVITADO
        if (!user.departamentoId) {
          return res.status(403).json({ error: "Usuario sin departamento." });
        }
        andClauses.push({
          departamentoId: user.departamentoId,
        });
        break;

      case "ENCARGADO":
        // Regla: (Usuarios de su depto con rol USUARIO o ENCARGADO)
        // ⭐️ MODIFICADO: Ya no necesita la cláusula OR para INVITADO
        if (!user.departamentoId) {
          return res.status(403).json({ error: "Usuario sin departamento." });
        }
        andClauses.push({
          AND: [
            { rol: { in: ["USUARIO", "ENCARGADO"] } },
            { departamentoId: user.departamentoId },
          ],
        });
        break;

      case "USUARIO":
        // Regla: (Usuarios de su depto con rol USUARIO)
        // (Esta regla ya excluía a INVITADO, así que está bien)
        if (!user.departamentoId) {
          return res.status(403).json({ error: "Usuario sin departamento." });
        }
        andClauses.push({
          rol: "USUARIO",
          departamentoId: user.departamentoId,
        });
        break;

      case "INVITADO":
        // Regla: No ve a nadie.
        andClauses.push({
          id: -1, // Un ID que nunca existirá
        });
        break;

      default:
        // Por si acaso, denegar por defecto
        andClauses.push({ id: -1 });
    }

    // 8. 🔹 Combinar las cláusulas de seguridad
    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    // 9. Ejecutar la consulta con el 'where' seguro
    const usuarios = await prisma.usuario.findMany({
      where: where, // 'where' ahora contiene la exclusión de INVITADO
      select: {
        id: true,
        nombre: true,
        username: true,
        rol: true,
        estatus: true,
        fechaCreacion: true,
        departamento: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    });
    res.json(usuarios);
  })
);

router.get(
  "/invitados",
  // 1. Proteger la ruta. Solo roles de gestión pueden ver invitados.
  verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]),
  safeAsync(async (req: Request, res: Response) => {
    // 2. Validar el query param 'estatus' (ej. ?estatus=INACTIVO)
    // Asumimos que querySchema está definido en este archivo
    const queryParseResult = querySchema.safeParse(req.query);

    if (!queryParseResult.success) {
      return res.status(400).json({
        error: "Query param inválido",
        detalles: queryParseResult.error.flatten().fieldErrors,
      });
    }

    // 3. Obtenemos 'estatus'. Ignoramos cualquier otro query param.
    const { estatus } = queryParseResult.data;

    // 4. Definir el filtro de la consulta
    const where: Prisma.UsuarioWhereInput = {
      // Regla Clave: Forzar el rol a INVITADO
      rol: "INVITADO",

      // Regla de Estatus: Permitir filtrar por 'ACTIVO' (default) o 'INACTIVO'
      estatus: estatus ?? "ACTIVO",
    };

    // 5. Ejecutar la consulta
    const usuariosInvitados = await prisma.usuario.findMany({
      where: where,
      select: {
        // Usamos el mismo 'select' que en la ruta GET /
        // para que el frontend reciba objetos consistentes.
        id: true,
        nombre: true,
        username: true,
        rol: true,
        estatus: true,
        fechaCreacion: true,
        departamento: {
          // Esto será 'null' para invitados, pero mantiene la estructura
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { nombre: "asc" },
    });

    res.json(usuariosInvitados);
  })
);

/* ✅ [READ BY ID] Obtener un usuario por su ID */
router.get(
  "/:id",
  verifyToken(), // 🔹 2. Proteger la ruta
  safeAsync(async (req: Request, res: Response) => {
    // 3. Validar el ID de la URL
    const paramsParseResult = paramsSchema.safeParse(req.params);
    if (!paramsParseResult.success) {
      return res.status(400).json({
        error: "ID de URL inválido",
        detalles: paramsParseResult.error.flatten().fieldErrors,
      });
    }
    const { id: targetUsuarioId } = paramsParseResult.data; // Renombrado para claridad

    // 4. 🔹 Obtener el usuario QUE HACE LA PETICIÓN
    const requester = req.user;
    if (!requester) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // 5. 🔹 Construir el 'where' base
    const where: Prisma.UsuarioWhereInput = {
      id: targetUsuarioId,
      estatus: "ACTIVO", // Solo buscar usuarios activos
    };

    // 6. 🔹 Lógica de auto-visualización (Self-View)
    //    Si el ID que buscas es TU PROPIO ID, no se aplican más filtros.
    if (requester.id !== targetUsuarioId) {
      // 7. 🔹 Si buscas a ALGUIEN MÁS, aplica las reglas de seguridad
      const andClauses: Prisma.UsuarioWhereInput[] = [];

      switch (requester.rol) {
        case "SUPER_ADMIN":
          // Ve a todos, no se añade ningún filtro.
          break;

        case "ADMIN":
          // Regla: (Target de su depto) O (Target es INVITADO)
          if (!requester.departamentoId) {
            return res.status(403).json({ error: "Usuario sin departamento." });
          }
          andClauses.push({
            OR: [
              { departamentoId: requester.departamentoId },
              { rol: "INVITADO" },
            ],
          });
          break;

        case "ENCARGADO":
          // Regla: (Target de su depto con rol USUARIO/ENCARGADO) O (Target es INVITADO)
          if (!requester.departamentoId) {
            return res.status(403).json({ error: "Usuario sin departamento." });
          }
          andClauses.push({
            OR: [
              {
                AND: [
                  { rol: { in: ["USUARIO", "ENCARGADO"] } },
                  { departamentoId: requester.departamentoId },
                ],
              },
              { rol: "INVITADO" },
            ],
          });
          break;

        case "USUARIO":
          // Regla: (Target de su depto con rol USUARIO)
          if (!requester.departamentoId) {
            return res.status(403).json({ error: "Usuario sin departamento." });
          }
          andClauses.push({
            rol: "USUARIO",
            departamentoId: requester.departamentoId,
          });
          break;

        case "INVITADO":
          // Regla: No ve a nadie más que a sí mismo (ya cubierto arriba).
          andClauses.push({
            id: -1, // Condición imposible
          });
          break;

        default:
          andClauses.push({ id: -1 }); // Denegar por defecto
      }

      // 8. 🔹 Asignar las reglas al 'where'
      if (andClauses.length > 0) {
        where.AND = andClauses;
      }
    }

    // 9. Buscar el usuario en la BD con el 'where' seguro
    //    (where es: { id: ..., estatus: 'ACTIVO', AND: [ ...reglas... ] } )
    const usuario = await prisma.usuario.findFirst({
      where: where, // 'where' ahora es 100% seguro
      select: {
        id: true,
        nombre: true,
        username: true,
        rol: true,
        estatus: true,
        fechaCreacion: true,
        fechaEdicion: true,
        departamento: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // 10. Manejar "No Encontrado" (o "No Permitido")
    if (!usuario) {
      return res.status(404).json({
        error:
          "Usuario no encontrado, inactivo, o no tienes permiso para verlo.",
      });
    }

    // 11. Devolver el usuario
    res.json(usuario);
  })
);

/* ✅ [CREATE] Crear un nuevo usuario */
router.post(
  "/",
  // verifyToken("ADMIN"),
  safeAsync(async (req: Request, res: Response) => {
    const parseResult = crearUsuarioSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        error: "Datos de entrada inválidos",
        detalles: parseResult.error.flatten().fieldErrors,
      });
    }

    const { nombre, username, password, rol, departamentoId } =
      parseResult.data;

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
        id: true,
        nombre: true,
        username: true,
        rol: true,
        estatus: true,
        departamentoId: true,
        fechaCreacion: true,
      },
    });

    res.status(201).json(nuevoUsuario);
  })
);

/* ✅ [UPDATE] Actualizar un usuario */
router.put(
  "/:id", // Ruta: PUT /api/usuarios/1
  // verifyToken("ADMIN"),
  safeAsync(async (req: Request, res: Response) => {
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

    const usuarioActual = await prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuarioActual) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (
      usuarioActual.estatus === "INACTIVO" &&
      validatedBody.estatus !== "ACTIVO"
    ) {
      return res
        .status(403)
        .json({ error: "No se puede modificar un usuario inactivo" });
    }

    // 4. Fusionar datos y validar reglas de negocio
    const datosFusionados = {
      rol: validatedBody.rol ?? usuarioActual.rol,
      departamentoId:
        validatedBody.departamentoId !== undefined
          ? validatedBody.departamentoId
          : usuarioActual.departamentoId,
      estatus: validatedBody.estatus ?? usuarioActual.estatus,
    };

    if (
      (datosFusionados.rol === "SUPER_ADMIN" ||
        datosFusionados.rol === "INVITADO") &&
      datosFusionados.departamentoId !== null
    ) {
      return res.status(400).json({
        error: "Conflicto de reglas",
        detalle:
          "Un SUPER_ADMIN o INVITADO no puede tener un departamentoId. Debe ser nulo.",
      });
    }

    // Regla 2: ADMIN, ENCARGADO, USUARIO DEBEN tener un ID.
    if (
      (datosFusionados.rol === "ADMIN" ||
        datosFusionados.rol === "ENCARGADO" ||
        datosFusionados.rol === "USUARIO") &&
      datosFusionados.departamentoId === null
    ) {
      return res.status(400).json({
        error: "Conflicto de reglas",
        detalle: `El rol ${datosFusionados.rol} debe tener un departamentoId.`,
      });
    }

    if (
      datosFusionados.estatus === "INACTIVO" &&
      usuarioActual.estatus === "ACTIVO"
    ) {
      return res.status(400).json({
        error: "Acción incorrecta",
        detalle: "Para desactivar un usuario, usa la ruta PUT /:id/estatus",
      });
    }

    // 5. Construir el objeto de actualización para Prisma
    const dataParaActualizar: Prisma.UsuarioUpdateInput = {
      fechaEdicion: new Date(),
    };

    if (validatedBody.nombre !== undefined) {
      dataParaActualizar.nombre = validatedBody.nombre;
    }
    if (validatedBody.username !== undefined) {
      dataParaActualizar.username = validatedBody.username;
    }
    if (validatedBody.rol !== undefined) {
      dataParaActualizar.rol = validatedBody.rol;
    }
    if (validatedBody.departamentoId !== undefined) {
      if (validatedBody.departamentoId === null) {
        dataParaActualizar.departamento = {
          disconnect: true,
        };
      } else {
        dataParaActualizar.departamento = {
          connect: {
            id: validatedBody.departamentoId,
          },
        };
      }
    }

    if (validatedBody.password !== undefined) {
      dataParaActualizar.password = await bcrypt.hash(
        validatedBody.password,
        10
      );
    }

    // 7. Actualizar en la BD
    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: dataParaActualizar,
      select: {
        id: true,
        nombre: true,
        username: true,
        rol: true,
        estatus: true,
        departamentoId: true,
        fechaEdicion: true,
      },
    });

    res.json(usuarioActualizado);
  })
);

/* ✅ [UPDATE STATUS] Desactivar o Reactivar un usuario */
router.put(
  "/:id/estatus", // Ruta: PUT /api/usuarios/1/estatus
  // verifyToken("ADMIN"),
  safeAsync(async (req: Request, res: Response) => {
    // 1. Validar ID de la URL
    const paramsParseResult = paramsSchema.safeParse(req.params);
    if (!paramsParseResult.success) {
      return res.status(400).json({
        error: "ID de URL inválido",
        detalles: paramsParseResult.error.flatten().fieldErrors,
      });
    }
    const { id } = paramsParseResult.data;

    // 2. Validar el body
    const bodyParseResult = estatusSchema.safeParse(req.body);
    if (!bodyParseResult.success) {
      return res.status(400).json({
        error: "Datos de entrada inválidos",
        detalles: bodyParseResult.error.flatten().fieldErrors,
      });
    }
    const { estatus } = bodyParseResult.data;

    // 3. Actualizar el estatus en la BD
    // 'safeAsync' se encargará del error P2025 si el ID no existe
    const usuarioActualizado = await prisma.usuario.update({
      where: { id },
      data: {
        estatus: estatus,
        fechaEdicion: new Date(),
      },
      select: {
        id: true,
        nombre: true,
        estatus: true,
        fechaEdicion: true,
      },
    });

    res.json(usuarioActualizado);
  })
);

/* ✅ [CREATE] Registrar una suscripción push para un usuario */
router.post(
  "/:id/subscribe",
  verifyToken(), // Protegemos la ruta, el usuario debe estar logueado
  safeAsync(async (req: Request, res: Response) => {
    // 1. Validar el ID de la URL (usamos el paramsSchema que ya tienes)
    const paramsParse = paramsSchema.safeParse(req.params);
    if (!paramsParse.success) {
      return res.status(400).json({ error: "ID de URL inválido" });
    }

    // 2. Seguridad: Validar que el usuario logueado (del token)
    //    solo pueda suscribirse a sí mismo.
    if (req.user!.id !== paramsParse.data.id) {
      return res
        .status(403)
        .json({ error: "No autorizado para suscribir a este usuario." });
    }

    // 3. Validar el body de la suscripción
    const bodyParse = subscriptionSchema.safeParse(req.body);
    if (!bodyParse.success) {
      return res.status(400).json({
        error: "Datos de suscripción inválidos",
        detalles: bodyParse.error.flatten().fieldErrors,
      });
    }

    const { endpoint, keys } = bodyParse.data;

    // 4. Guardar en la BD (Usamos 'upsert' para manejar re-suscripciones)
    // 'upsert' = "Actualiza si ya existe, Inserta si es nuevo"
    const subscripcion = await prisma.pushSubscription.upsert({
      where: { endpoint: endpoint }, // Busca por el endpoint único

      // Datos para CREAR si no existe:
      create: {
        endpoint: endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        usuarioId: req.user!.id, // Asocia al usuario logueado
      },

      // Datos para ACTUALIZAR si ya existe (ej. re-asociar al usuario):
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        usuarioId: req.user!.id,
      },
    });

    console.log(`✅ Suscripción guardada para usuario ${req.user!.id}`);
    res.status(201).json(subscripcion);
  })
);

export default router;
