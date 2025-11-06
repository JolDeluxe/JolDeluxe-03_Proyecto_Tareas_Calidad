import express from "express";
import cors from "cors";
import path from "path"; // 👈 Importante para las rutas de archivos
import { fileURLToPath } from "url"; // 👈 Importante para el fix de __dirname
import tareasRouter from "./routes/tareas.js";
import authRouter from "./routes/auth.js";
import usuariosRouter from "./routes/usuarios.js";
import departamentosRouter from "./routes/departamentos.js";

// ----------------------------------------------------
// 💡 CORRECCIÓN ESM: Definir __dirname en el ámbito de ES Modules
// ----------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ----------------------------------------------------

const app = express();
const PORT = 3000;

// 🔹 Configuración CORS MEJORADA (Mantenida)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        console.log("✅ CORS: Request sin origin (Postman/curl)");
        return callback(null, true);
      } // Lista de orígenes permitidos
      const allowedOrigins = [
        "https://tareas-calidad-mbc.mbc-bitacoras.me",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://200.1.0.72:5173",
        "http://200.1.0.72:4173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
      ]; // Lógica de permisos mejorada

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://200.1.") ||
        origin.startsWith("http://localhost") ||
        origin.startsWith("http://127.0.0.1") ||
        origin.startsWith("http://192.168.") || // Redes locales
        origin.includes(":5173") || // Cualquier puerto 5173
        origin.includes(":4173"); // Cualquier puerto 4173
      if (isAllowed) {
        console.log(`✅ CORS permitido para: ${origin}`);
        callback(null, true);
      } else {
        console.log(`❌ CORS bloqueado para: ${origin}`);
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  })
);

// 🔹 Middleware para logging de requests
app.use((req, res, next) => {
  console.log(
    `📥 ${req.method} ${req.path} from ${req.headers.origin || "direct"}`
  );
  next();
});

// 🔹 Middleware para JSON
app.use(express.json());

// 🔽 =================== LÍNEA AÑADIDA =================== 🔽
// 🔹 Servir la carpeta de 'uploads' estáticamente
// Esto permite que /uploads/imagen.png sea accesible desde el frontend
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// 🔼 ======================================================== 🔼

// ----------------------------------------------------------------------
// 🚀 BLOQUE CLAVE: UNIFICACIÓN DE PRODUCCIÓN (Sirve el Frontend)
// ----------------------------------------------------------------------

// Ruta: /backend/src -> subir 2 niveles (..) -> /frontend/dist
const FRONTEND_PATH = path.join(__dirname, "..", "..", "frontend", "dist");

// 1. Servir archivos estáticos (CSS, JS, imágenes, etc.)
app.use(express.static(FRONTEND_PATH));

// 2. Fallback: Sirve index.html para todas las rutas que no son API
app.get("*", (req, res, next) => {
  // Si la solicitud NO empieza con /api, la consideramos una ruta de React (frontend)
  if (!req.path.startsWith("/api")) {
    console.log(`📡 Sirviendo frontend (ruta no-API): ${req.path}`);
    return res.sendFile(path.join(FRONTEND_PATH, "index.html"));
  }
  // Si es /api, permite que pase a tus rutas de Express
  next();
});

// ----------------------------------------------------------------------
// FIN BLOQUE CLAVE
// ----------------------------------------------------------------------

// 🔹 Rutas de salud para testing
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Servidor funcionando ✅",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    database: "Producción - Servidor",
  });
});

app.get("/api/auth/test", (req, res) => {
  res.json({
    message: "Auth endpoint funcionando",
    database: "Producción - Servidor",
  });
});

// 🔹 Rutas principales
app.use("/api/auth", authRouter);
app.use("/api/tareas", tareasRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/departamentos", departamentosRouter);

// 🔹 Manejo de errores global
app.use((err: any, req: any, res: any, next: any) => {
  console.error("🔥 Error global:", err.message);
  if (err.message === "No permitido por CORS") {
    return res.status(403).json({ error: "Acceso no permitido por CORS" });
  }
  res.status(500).json({ error: "Error interno del servidor" });
});

// 🔹 Levantar servidor en todas las interfaces de red
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🎯 Servidor de PRODUCCIÓN corriendo en:`);
  console.log(`    → http://localhost:${PORT}`);
  console.log(`    → http://127.0.0.1:${PORT}`);
  console.log(`    → http://200.1.0.72:${PORT}`);
  console.log(`    → Y accesible desde cualquier IP de la red`);
  console.log(`📊 Base de datos: Producción - Servidor`);
});
