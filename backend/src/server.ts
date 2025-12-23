import express from "express";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

// 1. IMPORTAR CONFIGURACIONES Y MIDDLEWARES
import { envs } from "./config/envs.js";           
import { corsConfig } from "./config/cors.js";    
import { requestLogger } from "./middleware/requestLogger.js"; 
import { errorHandler } from "./middleware/errorHandler.js";   
import { iniciarCronJobs } from "./services/cron.service.js";

// 2. IMPORTAR RUTAS
// (Nota: Seguiremos usando tus rutas actuales hasta que refactoricemos los módulos)
import tareasRouter from "./modules/tareas/tareas.routes.js";
import authRouter from "./modules/auth/auth.routes.js";
import usuariosRouter from "./modules/usuarios/usuarios.routes.js";
import departamentosRouter from "./modules/departamentos/departamentos.routes.js";
import logsRouter from "./modules/logs/logs.routes.js"; // <--- 1. NUEVA IMPORTACIÓN

// --- CONFIGURACIÓN INICIAL ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// --- MIDDLEWARES GLOBALES ---
app.use(corsConfig);          // 1. Seguridad CORS
app.use(requestLogger);       // 2. Logging
app.use(express.json());      // 3. Parser JSON
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // 4. Archivos estáticos

// --- SERVIR FRONTEND (SPA) ---
const FRONTEND_PATH = path.join(__dirname, "..", "..", "frontend", "dist");
app.use(express.static(FRONTEND_PATH));

// --- RUTAS DE API ---
app.get("/api/health", (req, res) => res.json({ status: "OK" }));
app.use("/api/auth", authRouter);
app.use("/api/tareas", tareasRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/departamentos", departamentosRouter);
app.use("/api/logs", logsRouter); // <--- 2. NUEVA RUTA REGISTRADA

// --- FALLBACK PARA SPA (Cualquier otra ruta va al index.html) ---
app.get("*", (req, res, next) => {
  if (!req.path.startsWith("/api")) {
      return res.sendFile(path.join(FRONTEND_PATH, "index.html"));
  }
  next();
});

// --- SERVICIOS EN 2do PLANO ---
iniciarCronJobs();

// --- MANEJO DE ERRORES ---
app.use(errorHandler);

// --- INICIO DEL SERVIDOR ---
app.listen(envs.PORT, "0.0.0.0", () => {
  console.log(`\n[${new Date().toLocaleString()}] 🚀 SISTEMA LISTO EN PUERTO ${envs.PORT}\n`);
});