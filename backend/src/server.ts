import express from "express";
import "dotenv/config";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import tareasRouter from "./routes/tareas.js";
import authRouter from "./routes/auth.js";
import usuariosRouter from "./routes/usuarios.js";
import departamentosRouter from "./routes/departamentos.js";
import { iniciarCronJobs } from "./services/cron.service.js";

// ----------------------------------------------------
// ⚙️ CONFIGURACIÓN INICIAL
// ----------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3000;

// ----------------------------------------------------
// 🛠️ UTILIDADES DE LOGGING (PROFESIONAL)
// ----------------------------------------------------
const obtenerFecha = () => {
  return new Date().toLocaleString('es-MX', { 
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false 
  });
};

// TRADUCTOR DE RUTAS: Convierte URLs técnicas en lenguaje de negocio
const interpretarSolicitud = (method: string, url: string): string => {
  // TAREAS
  const idTarea = url.match(/\/api\/tareas\/(\d+)/)?.[1];
  if (url.includes('/entregar') && method === 'POST') return `🚀 Entregando Tarea #${idTarea}`;
  if (url.includes('/misTareas')) return "📋 Usuario consultando sus pendientes";
  if (url.includes('/api/tareas') && method === 'POST') return "✨ Creando nueva Tarea";
  if (url.includes('/api/tareas') && method === 'GET' && !idTarea) return "🗂️ Listando todas las Tareas";
  if (url.includes('/api/tareas') && method === 'GET' && idTarea) return `🔍 Viendo detalle Tarea #${idTarea}`;
  
  // USUARIOS & NOTIFICACIONES
  const idUsuario = url.match(/\/api\/usuarios\/(\d+)/)?.[1];
  if (url.includes('/subscribe')) return `🔔 Usuario #${idUsuario} activando notificaciones`;
  if (url.includes('/api/usuarios') && method === 'GET') return "👥 Listando personal";

  // AUTH
  if (url.includes('/login')) return "🔑 Inicio de Sesión";
  if (url.includes('/verify')) return "👤 Verificación de Token (Auto-login)";

  return "⚡ Operación General del Sistema";
};

// ----------------------------------------------------
// 🔹 CONFIGURACIÓN CORS (SILENCIOSA)
// ----------------------------------------------------
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      "https://tareas-calidad-mbc.mbc-bitacoras.me",
      "http://localhost:5173", "http://127.0.0.1:5173",
      "http://localhost:3000", "http://127.0.0.1:3000",
      "http://200.1.0.72:5173", "http://10.0.2.2:5173"
    ];
    // Lógica laxa para subredes locales
    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.startsWith("http://192.168.") || 
                      origin.startsWith("http://200.1.") ||
                      origin.includes(":5173");

    if (isAllowed) callback(null, true);
    else {
      console.error(`[${obtenerFecha()}] ⛔ BLOQUEO CORS: IP ${origin} no autorizada`);
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true
}));

// ----------------------------------------------------
// 🧠 MIDDLEWARE INTERCEPTOR (LOGS COMPLETOS)
// ----------------------------------------------------
app.use((req, res, next) => {
  const start = Date.now(); // Marca de tiempo inicial

  // 1. FILTRO DE BASURA (No loguear imágenes ni JS estático)
  const ignorar = ['.js', '.css', '.png', '.jpg', '.webp', '.svg', '.ico', '.map', 'json'];
  const esBasura = ignorar.some(ext => req.path.endsWith(ext));
  const esSalud = req.path.includes('health') || req.path.includes('sw.js');

  if (esBasura || esSalud) return next();

  // 2. LOG DE ENTRADA (REQUEST)
  const fecha = obtenerFecha();
  const historia = interpretarSolicitud(req.method, req.path);
  const origen = req.headers.origin ? "🌐 WEB" : "📱 APP";
  
  console.log(`[${fecha}] 📥 ${origen} | ${historia.padEnd(40)} | Solicitando: ${req.path}`);

  // 3. LOG DE SALIDA (RESPONSE - Se ejecuta cuando termina la petición)
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    // Icono según el estatus
    let icon = '🟢';
    if (status >= 400) icon = '⚠️'; // Error de cliente (400, 401, 404)
    if (status >= 500) icon = '🔥'; // Error de servidor (500)

    console.log(`[${obtenerFecha()}] ${icon} FIN | Estatus: ${status} ${res.statusMessage || ''} | Tiempo: ${duration}ms`);
    if(status >= 400) console.log('---------------------------------------------------------------');
  });

  next();
});

// 🔹 JSON y Archivos
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ----------------------------------------------------------------------
// 🚀 SERVIR FRONTEND
// ----------------------------------------------------------------------
const FRONTEND_PATH = path.join(__dirname, "..", "..", "frontend", "dist");
app.use(express.static(FRONTEND_PATH));
app.get("*", (req, res, next) => {
  if (!req.path.startsWith("/api")) return res.sendFile(path.join(FRONTEND_PATH, "index.html"));
  next();
});

// ----------------------------------------------------------------------
// RUTAS API
// ----------------------------------------------------------------------
app.get("/api/health", (req, res) => res.json({ status: "OK" }));
app.use("/api/auth", authRouter);
app.use("/api/tareas", tareasRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/departamentos", departamentosRouter);

iniciarCronJobs();

// ----------------------------------------------------------------------
// 🔥 MANEJO DE ERRORES DETALLADO
// ----------------------------------------------------------------------
app.use((err: any, req: any, res: any, next: any) => {
  const fecha = obtenerFecha();
  
  // Identificar el tipo de error para dar un mensaje claro
  let tipoError = "Error Desconocido";
  let codigo = 500;

  if (err.code === 'P2002') { tipoError = "Violación de Unicidad (Datos duplicados en BD)"; codigo = 409; }
  else if (err.code === 'P2025') { tipoError = "Registro no encontrado en BD"; codigo = 404; }
  else if (err.name === 'ZodError') { tipoError = "Datos de formulario inválidos"; codigo = 400; }
  else if (err.message === "No permitido por CORS") { tipoError = "Bloqueo de Seguridad"; codigo = 403; }

  // LOG VISUAL PARA EL SERVIDOR
  console.error(`\n❌ [${fecha}] ERROR CRÍTICO DETECTADO`);
  console.error(`   📌 Tipo: ${tipoError}`);
  console.error(`   📂 Ruta: ${req.method} ${req.path}`);
  console.error(`   🛑 Mensaje: ${err.message}`);
  if (err.stack) console.error(`   💻 Stack: ${err.stack.split('\n')[1].trim()}`); // Solo la primera línea del stack
  console.error('---------------------------------------------------------------\n');

  // RESPUESTA AL CLIENTE
  res.status(codigo).json({ 
    error: true, 
    message: tipoError === "Error Desconocido" ? "Error interno del servidor" : err.message 
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n[${obtenerFecha()}] 🚀 SISTEMA MONITORIZADO Y LISTO EN PUERTO ${PORT}\n`);
});