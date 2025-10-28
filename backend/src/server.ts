import express from "express";
import cors from "cors";
import tareasRouter from "./routes/tareas.js";
import authRouter from "./routes/auth.js";

const app = express();
const PORT = 3000;

// 🔹 Configuración CORS para poder acceder desde:
// - localhost (PC)
// - tu celular en la misma red
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman o CURL
      // Permitir localhost y cualquier IP local 192.*, 200.* etc.
      const allowedOrigins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
        "http://200.1.0.72:5173",
        "http://200.1.0.72:4173",
      ];
      if (
        allowedOrigins.includes(origin) ||
        origin.startsWith("http://200.1.")
      ) {
        callback(null, true);
      } else {
        callback(new Error("No permitido por CORS"));
      }
    },
    credentials: true,
  })
);

// 🔹 Middleware para JSON
app.use(express.json());

// 🔹 Rutas
app.use("/api/auth", authRouter);
app.use("/api/tareas", tareasRouter);

// 🔹 Levantar servidor en todas las interfaces de red
app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`);
});
