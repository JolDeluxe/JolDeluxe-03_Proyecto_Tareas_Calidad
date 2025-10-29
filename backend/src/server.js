import express from "express";
import cors from "cors";
import tareasRouter from "./routes/tareas.js";
import authRouter from "./routes/auth.js";
const app = express();
const PORT = 3000;
// 🔹 Configuración CORS MEJORADA
app.use(cors({
    origin: (origin, callback) => {
        if (!origin) {
            console.log("✅ CORS: Request sin origin (Postman/curl)");
            return callback(null, true);
        }
        // Lista de orígenes permitidos
        const allowedOrigins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:4173",
            "http://127.0.0.1:4173",
            "http://200.1.0.72:5173",
            "http://200.1.0.72:4173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ];
        // Lógica de permisos mejorada
        const isAllowed = allowedOrigins.includes(origin) ||
            origin.startsWith("http://200.1.") ||
            origin.startsWith("http://localhost") ||
            origin.startsWith("http://127.0.0.1") ||
            origin.startsWith("http://192.168.") || // Redes locales
            origin.includes(":5173") || // Cualquier puerto 5173
            origin.includes(":4173"); // Cualquier puerto 4173
        if (isAllowed) {
            console.log(`✅ CORS permitido para: ${origin}`);
            callback(null, true);
        }
        else {
            console.log(`❌ CORS bloqueado para: ${origin}`);
            callback(new Error("No permitido por CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
}));
// 🔹 Middleware para logging de requests
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path} from ${req.headers.origin || 'direct'}`);
    next();
});
// 🔹 Middleware para JSON
app.use(express.json());
// 🔹 Rutas de salud para testing
app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Servidor funcionando ✅",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        database: "Producción - Servidor"
    });
});
app.get("/api/auth/test", (req, res) => {
    res.json({
        message: "Auth endpoint funcionando",
        database: "Producción - Servidor"
    });
});
// 🔹 Rutas principales
app.use("/api/auth", authRouter);
app.use("/api/tareas", tareasRouter);
// 🔹 Manejo de errores global
app.use((err, req, res, next) => {
    console.error("🔥 Error global:", err.message);
    if (err.message === "No permitido por CORS") {
        return res.status(403).json({ error: "Acceso no permitido por CORS" });
    }
    res.status(500).json({ error: "Error interno del servidor" });
});
// 🔹 Levantar servidor en todas las interfaces de red
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🎯 Servidor de PRODUCCIÓN corriendo en:`);
    console.log(`   → http://localhost:${PORT}`);
    console.log(`   → http://127.0.0.1:${PORT}`);
    console.log(`   → http://200.1.0.72:${PORT}`);
    console.log(`   → Y accesible desde cualquier IP de la red`);
    console.log(`📊 Base de datos: Producción - Servidor`);
});
//# sourceMappingURL=server.js.map