import { Router } from "express";
import { PrismaClient, Estatus, Urgencia } from "@prisma/client";
import { verifyToken } from "../middleware/verifyToken.js";
const router = Router();
const prisma = new PrismaClient();
// ✅ Obtener todas las tareas (todos los usuarios autenticados)
router.get("/", async (req, res) => {
    try {
        const tareas = await prisma.tarea.findMany({
            include: { historialFechas: true },
            orderBy: { id: "asc" },
        });
        res.json(tareas);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener tareas" });
    }
});
// ✅ Obtener historial de una tarea específica (todos los usuarios autenticados)
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const historial = await prisma.historialFecha.findMany({
            where: { tareaId: Number(id) },
            orderBy: { fechaCambio: "desc" },
        });
        if (!historial.length) {
            return res
                .status(404)
                .json({ message: "No hay historial para esta tarea" });
        }
        res.json(historial);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al obtener el historial" });
    }
});
// ✅ Crear nueva tarea (todos los usuarios autenticados)
router.post("/", verifyToken(), async (req, res) => {
    try {
        const data = req.body;
        const tarea = await prisma.tarea.create({
            data: {
                tarea: data.tarea,
                asignador: data.asignador,
                responsable: data.responsable,
                fechaRegistro: new Date(data.fechaRegistro),
                fechaLimite: new Date(data.fechaLimite),
                fechaConclusion: data.fechaConclusion
                    ? new Date(data.fechaConclusion)
                    : null,
                estatus: data.estatus,
                urgencia: data.urgencia,
                observaciones: data.observaciones,
            },
        });
        res.status(201).json(tarea);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear la tarea" });
    }
});
// ✅ Registrar cambio de fecha (historial) (todos los usuarios autenticados)
router.post("/:id", verifyToken("ADMIN"), async (req, res) => {
    try {
        const { id } = req.params;
        const { fechaAnterior, nuevaFecha, modificadoPor, motivo } = req.body;
        const tarea = await prisma.tarea.findUnique({ where: { id: Number(id) } });
        if (!tarea)
            return res.status(404).json({ error: "Tarea no encontrada" });
        const nuevoHistorial = await prisma.historialFecha.create({
            data: {
                fechaAnterior: new Date(fechaAnterior),
                nuevaFecha: new Date(nuevaFecha),
                modificadoPor,
                motivo: motivo || null,
                tarea: { connect: { id: Number(id) } },
            },
        });
        res.status(201).json(nuevoHistorial);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al registrar cambio de fecha" });
    }
});
// ✅ Actualizar una tarea existente (campos según rol)
router.put("/:id", verifyToken(), async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const usuario = req.user;
        // Validamos que el usuario exista
        if (!usuario) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }
        const tareaExistente = await prisma.tarea.findUnique({
            where: { id: Number(id) },
        });
        if (!tareaExistente) {
            return res.status(404).json({ error: "Tarea no encontrada" });
        }
        // Campos que puede editar cualquier usuario logeado
        const updateData = {
            tarea: data.tarea ?? tareaExistente.tarea,
            observaciones: data.observaciones ?? tareaExistente.observaciones,
            responsable: data.responsable ?? tareaExistente.responsable,
        };
        // Campos solo para ADMIN
        if (usuario.rol === "ADMIN") {
            updateData.estatus = data.estatus ?? tareaExistente.estatus;
            updateData.fechaLimite = data.fechaLimite
                ? new Date(data.fechaLimite)
                : tareaExistente.fechaLimite;
            // Lógica automática de fechaConclusion
            if (data.estatus === "CONCLUIDA" &&
                tareaExistente.estatus !== "CONCLUIDA") {
                updateData.fechaConclusion = new Date();
            }
            else if (data.fechaConclusion) {
                updateData.fechaConclusion = new Date(data.fechaConclusion);
            }
        }
        const tareaActualizada = await prisma.tarea.update({
            where: { id: Number(id) },
            data: updateData,
        });
        res.json(tareaActualizada);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar la tarea" });
    }
});
export default router;
//# sourceMappingURL=tareas.js.map