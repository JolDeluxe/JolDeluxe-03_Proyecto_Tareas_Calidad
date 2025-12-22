import { z } from "zod";
import { Estatus, Urgencia } from "@prisma/client";

// Validación para el ID en la URL
export const paramsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "El ID debe ser un número")
    .transform(Number)
    .refine((num) => num > 0, "El ID debe ser positivo"),
});

// Validación para filtros (Query Params)
export const getTareasQuerySchema = z.object({
  departamentoId: z.coerce.number().int().positive().optional(),
  asignadorId: z.coerce.number().int().positive().optional(),
  responsableId: z.coerce.number().int().positive().optional(),
  estatus: z.nativeEnum(Estatus).optional(),
  viewType: z
    .union([
      z.literal("MIS_TAREAS"),
      z.literal("ASIGNADAS"),
      z.literal("TODAS"),
    ])
    .optional(),
});

// Validación para Crear Tarea
export const crearTareaSchema = z.object({
  tarea: z.string().trim().nonempty("El nombre de la tarea es requerido"),
  fechaLimite: z.coerce.date({
    message: "Fecha límite inválida",
  }),
  estatus: z.nativeEnum(Estatus).default("PENDIENTE"),
  urgencia: z.nativeEnum(Urgencia).default("BAJA"),
  observaciones: z.string().trim().optional().nullable(),
  departamentoId: z
    .number()
    .int()
    .positive("El ID de departamento es requerido"),
  responsables: z
    .array(z.number().int().positive())
    .min(1, "Se requiere al menos un responsable"),
});

// Validación para Actualizar Tarea
export const actualizarTareaSchema = z
  .object({
    tarea: z.string().trim().nonempty().optional(),
    fechaLimite: z.coerce.date().optional(),
    estatus: z.nativeEnum(Estatus).optional(),
    urgencia: z.nativeEnum(Urgencia).optional(),
    observaciones: z.string().trim().nullable().optional(),
    departamentoId: z.number().int().positive().optional(),
    responsables: z.array(z.number().int().positive()).min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar.",
  });

// Validación para Historial (Cambio de fecha)
export const historialSchema = z.object({
  fechaAnterior: z.coerce.date(),
  nuevaFecha: z.coerce.date(),
  motivo: z.string().trim().optional().nullable(),
});

// Validación para Revisión (Aprobar/Rechazar)
export const revisionTareaSchema = z.object({
  decision: z.enum(["APROBAR", "RECHAZAR"]),
  feedback: z.string().trim().optional(),
  nuevaFechaLimite: z.coerce.date().optional(),
});

