import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { PrismaClient, Prisma, Tipo } from "@prisma/client";
import { z } from "zod";
import { verifyToken } from "../middleware/verifyToken.js";

const router = Router();
const prisma = new PrismaClient();

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
        // P2002: Error de restricción única (ej. nombre de depto. ya existe)
        if (error.code === "P2002") {
          const target = (error.meta?.target as string[])?.join(", ");
          return res.status(409).json({
            error: "Conflicto de datos",
            detalle: `El campo '${target}' ya existe y debe ser único.`,
          });
        }
        // P2025: Registro no encontrado (para PUT o DELETE)
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

/**
 * Esquema base para un departamento (usado en POST)
 */
const deptoSchema = z.object({
  nombre: z
    .string()
    .trim()
    .nonempty("El nombre es requerido")
    .min(3, "El nombre debe tener al menos 3 caracteres"),
  tipo: z.nativeEnum(Tipo, {
    message: "Tipo inválido (Debe ser ADMINISTRATIVO o OPERATIVO)",
  }),
});

/**
 * Esquema para actualizar un departamento (usado en PUT)
 * Es 'partial' (todos opcionales) pero valida que al menos un campo venga.
 */
const actualizarDeptoSchema = deptoSchema
  .partial()
  .refine((data) => data.nombre !== undefined || data.tipo !== undefined, {
    message:
      "Debe proporcionar al menos un campo (nombre o tipo) para actualizar.",
  });

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

// ===================================================================
// CRUD DE DEPARTAMENTOS
// ===================================================================

/* ✅ [GET] Obtener todos los departamentos */
router.get(
  "/",
  // verifyToken("ADMIN"),
  safeAsync(async (req: Request, res: Response) => {
    const departamentos = await prisma.departamento.findMany({
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        tipo: true,
        fechaCreacion: true,
      },
    });
    res.json(departamentos);
  })
);

/* ✅ [POST] Crear un nuevo departamento */
router.post(
  "/",
  // verifyToken("ADMIN"),
  safeAsync(async (req: Request, res: Response) => {
    // 1. Validar el body
    const parseResult = deptoSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Datos de entrada inválidos",
        detalles: parseResult.error.flatten().fieldErrors,
      });
    }

    const { nombre, tipo } = parseResult.data;

    // 2. Crear en la BD
    // 'safeAsync' se encargará de atrapar el error si el nombre ya existe (P2002)
    const nuevoDepto = await prisma.departamento.create({
      data: {
        nombre,
        tipo,
        // fechaCreacion y fechaEdicion se ponen solas por @default(now())
      },
    });

    res.status(201).json(nuevoDepto);
  })
);

/* ✅ [PUT] Actualizar un departamento */
router.put(
  "/:id",
  // verifyToken("ADMIN"),
  safeAsync(async (req: Request, res: Response) => {
    // 1. Validar el ID
    const paramsParseResult = paramsSchema.safeParse(req.params);
    if (!paramsParseResult.success) {
      return res.status(400).json({
        error: "ID de URL inválido",
        detalles: paramsParseResult.error.flatten().fieldErrors,
      });
    }
    const { id } = paramsParseResult.data;

    // 2. Validar el body
    const bodyParseResult = actualizarDeptoSchema.safeParse(req.body);
    if (!bodyParseResult.success) {
      return res.status(400).json({
        error: "Datos de entrada inválidos",
        detalles: bodyParseResult.error.flatten().fieldErrors,
      });
    }

    // Este objeto 'validatedBody' puede contener 'undefined'
    const validatedBody = bodyParseResult.data;

    // 3. Construir el objeto 'data' limpio para Prisma
    const dataParaActualizar: Prisma.DepartamentoUpdateInput = {
      fechaEdicion: new Date(), // Siempre actualizamos la fecha

      // Añadir 'nombre' solo si fue proporcionado (no es undefined)
      ...(validatedBody.nombre !== undefined && {
        nombre: validatedBody.nombre,
      }),

      // Añadir 'tipo' solo si fue proporcionado (no es undefined)
      ...(validatedBody.tipo !== undefined && { tipo: validatedBody.tipo }),
    };

    // 4. Actualizar en la BD
    const deptoActualizado = await prisma.departamento.update({
      where: { id },
      data: dataParaActualizar, // Usamos el objeto limpio
    });

    res.json(deptoActualizado);
  })
);

export default router;
