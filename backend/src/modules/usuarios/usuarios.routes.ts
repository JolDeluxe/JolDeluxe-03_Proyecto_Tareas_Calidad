import { Router } from "express";
import { verifyToken } from "../../middleware/verifyToken.js";

import { obtenerTodos } from "./get/obtenerTodos.controller.js";
import { obtenerInvitados } from "./get/obtenerInvitados.controller.js";
import { obtenerSoloUsuarios } from "./get/obtenerSoloUsuarios.controller.js";
import { obtenerEncargadosYUsuarios } from "./get/obtenerEncargadosYUsuarios.controller.js";
import { obtenerPorId } from "./get/obtenerPorId.controller.js";

import { crearUsuario } from "./post/crearUsuario.controller.js";
import { suscribirPush } from "./post/suscribirPush.controller.js";

import { actualizarUsuario } from "./put/actualizarUsuario.controller.js";
import { cambiarEstatus } from "./put/cambiarEstatus.controller.js";

const router = Router();

// ===================================================================
// CRUD DE USUARIOS
// ===================================================================

// Middleware Global: Verifica que haya un token válido en todas las rutas
router.use(verifyToken());

/* ✅ [READ] Obtener todos los usuarios */
router.get("/", obtenerTodos);

/* ✅ [READ] Obtener solo invitados */
router.get("/invitados", verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]), obtenerInvitados);

/* ✅ [READ] Obtener solo usuarios con ROL=USUARIO */
router.get("/usuarios", verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]), obtenerSoloUsuarios);

/* ✅ [READ] Obtener solo usuarios con ROL=ENCARGADO o ROL=USUARIO */
router.get("/encargados-y-usuarios", verifyToken(["SUPER_ADMIN", "ADMIN", "ENCARGADO"]), obtenerEncargadosYUsuarios);

/* ✅ [READ BY ID] Obtener un usuario por su ID */
router.get("/:id", obtenerPorId);

/* ✅ [CREATE] Crear un nuevo usuario */
// 🛡️ CORREGIDO: Agregamos [] y SUPER_ADMIN para que el test pase
router.post("/", verifyToken(["SUPER_ADMIN", "ADMIN"]), crearUsuario);

/* ✅ [UPDATE] Actualizar un usuario */
// 🛡️ CORREGIDO: Solo admins pueden editar
router.put("/:id", verifyToken(["SUPER_ADMIN", "ADMIN"]), actualizarUsuario);

/* ✅ [UPDATE STATUS] Desactivar o Reactivar un usuario */
// 🛡️ CORREGIDO: Solo admins pueden cambiar estatus
router.put("/:id/estatus", verifyToken(["SUPER_ADMIN", "ADMIN"]), cambiarEstatus);

/* ✅ [CREATE] Registrar una suscripción push para un usuario */
router.post("/:id/subscribe", suscribirPush);

export default router;