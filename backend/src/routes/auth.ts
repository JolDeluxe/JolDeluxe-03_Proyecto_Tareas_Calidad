// import { Router } from "express";
// import type { Request, Response, NextFunction } from "express";
// import { PrismaClient, Prisma, EstatusUsuario } from "@prisma/client";
// import { z } from "zod";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import type { JwtPayload, SignOptions, Secret } from "jsonwebtoken";
// import { verifyToken } from "../middleware/verifyToken.js";
// import bcrypt from "bcryptjs";

// dotenv.config();

// const router = Router();
// const prisma = new PrismaClient();
// const SECRET: Secret = process.env.JWT_SECRET ?? "default_secret";

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
//       if (!res.headersSent) {
//         res.status(500).json({
//           error: "Ocurrió un error inesperado en el servidor",
//           detalle: error?.message ?? error,
//         });
//       }
//     }
//   };

// // Esquema Zod para el login
// const loginSchema = z.object({
//   username: z.string().trim().nonempty("El username es requerido"),
//   password: z.string().nonempty("La contraseña es requerida"),
// });

// /* ✅ Login */
// router.post(
//   "/login",
//   safeAsync(async (req: Request, res: Response): Promise<void | Response> => {
//     // 1. Validar con Zod
//     const parseResult = loginSchema.safeParse(req.body);
//     if (!parseResult.success) {
//       return res.status(400).json({
//         error: "Datos de entrada inválidos",
//         detalles: parseResult.error.flatten().fieldErrors,
//       });
//     }
//     const { username, password } = parseResult.data;

//     // 2. Buscar usuario por username Y que esté ACTIVO
//     const usuario = await prisma.usuario.findFirst({
//       where: {
//         username: username,
//         estatus: "ACTIVO",
//       },
//     });

//     const passwordValida = usuario
//       ? await bcrypt.compare(password, usuario.password)
//       : false;

//     // 4. Verificar si el usuario existe Y la contraseña es válida
//     if (!usuario || !passwordValida) {
//       return res
//         .status(401)
//         .json({ error: "Usuario o contraseña incorrectos" });
//     }

//     // 5. Generar el Token
//     const expiresIn: NonNullable<SignOptions["expiresIn"]> =
//       (process.env.JWT_EXPIRES as any) || "8h";

//     const tokenPayload = {
//       id: usuario.id,
//       nombre: usuario.nombre,
//       username: usuario.username,
//       rol: usuario.rol,
//       departamentoId: usuario.departamentoId,
//     };

//     const token = jwt.sign(tokenPayload, SECRET, {
//       expiresIn,
//     } satisfies SignOptions);

//     // 6. Enviar respuesta
//     res.json({
//       message: "Inicio de sesión exitoso",
//       token,
//       usuario: { ...tokenPayload },
//     });
//   })
// );

// /* ✅ Verificar token */
// router.get(
//   "/verify",
//   verifyToken(),
//   safeAsync(async (req: Request, res: Response) => {
//     const usuarioId = req.user?.id;
//     if (!usuarioId) {
//       return res.status(401).json({ error: "Token inválido sin ID" });
//     }

//     // Buscamos los datos más frescos del usuario
//     const usuario = await prisma.usuario.findUnique({
//       where: { id: usuarioId },
//       select: {
//         id: true,
//         nombre: true,
//         username: true,
//         rol: true,
//         departamentoId: true,
//         estatus: true,
//         departamento: {
//           select: {
//             id: true,
//             nombre: true,
//           },
//         },
//       },
//     });

//     if (!usuario) {
//       return res.status(404).json({ error: "Usuario del token no encontrado" });
//     }

//     res.json({ valid: true, usuario: usuario });
//   })
// );

// /* ✅ Logout */
// router.post(
//   "/logout",
//   safeAsync(async (_req: Request, res: Response) => {
//     res.json({
//       message: "Sesión cerrada correctamente (token eliminado en frontend)",
//     });
//   })
// );

// export default router;
