import { z } from "zod";
import { Rol, EstatusUsuario } from "@prisma/client";

export const querySchema = z.object({
  departamentoId: z.coerce.number().int().positive().optional(),
  estatus: z.nativeEnum(EstatusUsuario).optional(),
});

export const paramsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "El ID debe ser un número")
    .transform(Number)
    .refine((num) => num > 0, "El ID debe ser positivo"),
});

export const estatusSchema = z.object({
  estatus: z.nativeEnum(EstatusUsuario, {
    message: "Estatus inválido (Debe ser ACTIVO o INACTIVO)",
  }),
});

export const subscriptionSchema = z.object({
  endpoint: z.string().url("El endpoint debe ser una URL válida"),
  keys: z.object({
    p256dh: z.string().min(1, "La clave p256dh es requerida"),
    auth: z.string().min(1, "La clave auth es requerida"),
  }),
});

export const crearUsuarioSchema = z
  .object({
    nombre: z.string().trim().nonempty("El nombre es requerido").min(3, "El nombre debe tener al menos 3 caracteres"),
    username: z.string().trim().nonempty("El username es requerido").min(4, "El username debe tener al menos 4 caracteres"),
    password: z.string().nonempty("La contraseña es requerida").min(6, "La contraseña debe tener al menos 6 caracteres"),
    rol: z.nativeEnum(Rol, { message: "Rol inválido" }),
    departamentoId: z.number().int().positive().optional().nullable(),
  })
  .refine(
    (data) => {
      if ((data.rol === "SUPER_ADMIN" || data.rol === "INVITADO") && data.departamentoId !== null && data.departamentoId !== undefined) {
        return false;
      }
      return true;
    },
    { message: "El departamentoId debe ser nulo para el rol INVITADO", path: ["departamentoId"] }
  )
  .refine(
    (data) => {
      if ((data.rol === "ADMIN" || data.rol === "ENCARGADO" || data.rol === "USUARIO") && (data.departamentoId === null || data.departamentoId === undefined)) {
        return false;
      }
      return true;
    },
    { message: "El departamentoId es obligatorio para roles ADMIN, ENCARGADO y USUARIO", path: ["departamentoId"] }
  );

export const actualizarUsuarioSchema = z
  .object({
    nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres").optional(),
    username: z.string().trim().min(4, "El username debe tener al menos 4 caracteres").optional(),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
    rol: z.nativeEnum(Rol, { message: "Rol inválido" }).optional(),
    departamentoId: z.number().int().positive().nullable().optional(),
    estatus: z.nativeEnum(EstatusUsuario).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debe proporcionar al menos un campo para actualizar.",
  });