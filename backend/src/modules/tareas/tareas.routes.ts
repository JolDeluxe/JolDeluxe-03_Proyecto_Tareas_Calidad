import { Router } from "express";
import { verifyToken } from "../../middleware/verifyToken.js";
import { uploadImagenesMiddleware, uploadEvidenciasMiddleware } from "../../middleware/upload.js";

// --- Imports de Controladores ---
import { obtenerTodas } from "./get/obtenerTodas.controller.js";
import { obtenerDetalle } from "./get/obtenerDetalle.controller.js";
import { obtenerMisTareas } from "./get/obtenerMisTareas.controller.js"; 
import { obtenerAsignadas } from "./get/obtenerAsignadas.controller.js"; 

import { crearTarea } from "./post/crearTarea.controller.js";
import { subirImagen } from "./post/subirImagen.controller.js";
import { agregarHistorial } from "./post/agregarHistorial.controller.js"; 
import { entregarTarea } from "./post/entregarTarea.controller.js";
import { revisionTarea } from "./post/revisionTarea.controller.js"; 

import { actualizarTarea } from "./put/actualizarTarea.controller.js";

import { completarTarea } from "./patch/completarTarea.controller.js"; 
import { cancelarTarea } from "./patch/cancelarTarea.controller.js"; 

import { eliminarImagen } from "./delete/eliminarImagen.controller.js";

const router = Router();

// Middleware de seguridad global para el módulo
router.use(verifyToken()); 

// --- RUTAS GET ---
router.get("/", obtenerTodas);
router.get("/misTareas", obtenerMisTareas);
router.get("/asignadas", verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]), obtenerAsignadas);
router.get("/:id", obtenerDetalle);

// --- RUTAS POST ---
router.post("/", verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]), crearTarea);
router.post("/:id/upload", verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]), uploadImagenesMiddleware, subirImagen);
router.post("/:id/historial", verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]), agregarHistorial);
router.post("/:id/entregar", uploadEvidenciasMiddleware, entregarTarea);
router.post("/:id/revision", verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]), revisionTarea);

// --- RUTAS PUT ---
router.put("/:id", verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]), actualizarTarea);

// --- RUTAS PATCH ---
router.patch("/:id/complete", verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]), completarTarea);
router.patch("/:id/cancel", verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]), cancelarTarea);

// --- RUTAS DELETE ---
router.delete("/imagen/:id", verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]), eliminarImagen);

export default router;