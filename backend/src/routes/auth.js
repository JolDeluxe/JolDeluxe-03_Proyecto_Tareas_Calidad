import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { verifyToken } from "../middleware/verifyToken.js";
dotenv.config();
const router = Router();
const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET ?? "default_secret";
/* 🧱 Helper genérico para capturar errores async */
const safeAsync = (fn) => async (req, res, next) => {
    try {
        await fn(req, res, next);
    }
    catch (error) {
        console.error("❌ Error inesperado:", error);
        if (!res.headersSent) {
            res.status(500).json({
                error: "Ocurrió un error inesperado en el servidor",
                detalle: error?.message ?? error,
            });
        }
    }
};
/* ✅ Registrar usuario */
router.post("/register", safeAsync(async (req, res) => {
    const { nombre, username, password, rol } = req.body;
    if (!nombre || !username || !password) {
        res.status(400).json({ error: "Todos los campos son obligatorios" });
        return;
    }
    const existe = await prisma.usuario.findUnique({ where: { username } });
    if (existe) {
        res.status(400).json({ error: "El usuario ya existe" });
        return;
    }
    const usuario = await prisma.usuario.create({
        data: { nombre, username, password, rol: rol ?? "USUARIO" },
    });
    res.status(201).json({ message: "Usuario registrado", usuario });
}));
/* ✅ Login */
router.post("/login", safeAsync(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: "Debe proporcionar usuario y contraseña" });
        return;
    }
    const usuario = await prisma.usuario.findUnique({ where: { username } });
    if (!usuario || usuario.password !== password) {
        res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        return;
    }
    const expiresIn = process.env.JWT_EXPIRES || "2y";
    const token = jwt.sign({
        id: usuario.id,
        nombre: usuario.nombre,
        username: usuario.username,
        rol: usuario.rol,
    }, SECRET, { expiresIn });
    res.json({
        message: "Inicio de sesión exitoso",
        token,
        usuario: {
            id: usuario.id,
            nombre: usuario.nombre,
            username: usuario.username,
            rol: usuario.rol,
        },
    });
}));
/* ✅ Obtener todos los usuarios (solo ADMIN) */
router.get("/usuarios", verifyToken("ADMIN"), safeAsync(async (req, res) => {
    const usuarios = await prisma.usuario.findMany({
        select: {
            id: true,
            nombre: true,
            username: true,
            rol: true,
            fechaCreacion: true,
        },
    });
    res.json(usuarios);
}));
/* ✅ Verificar token */
router.get("/verify", safeAsync(async (req, res) => {
    const header = req.headers["authorization"];
    if (!header)
        return res.status(401).json({ error: "Token no proporcionado" });
    const token = header.split(" ")[1];
    if (!token)
        return res.status(401).json({ error: "Token vacío o mal formado" });
    try {
        const decoded = jwt.verify(token, SECRET);
        res.json({ valid: true, usuario: decoded });
    }
    catch {
        res
            .status(401)
            .json({ valid: false, error: "Token inválido o expirado" });
    }
}));
/* ✅ Logout */
router.post("/logout", safeAsync(async (_req, res) => {
    res.json({
        message: "Sesión cerrada correctamente (token eliminado en frontend)",
    });
}));
export default router;
//# sourceMappingURL=auth.js.map