import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const SECRET = process.env.JWT_SECRET || "default_secret";
// Middleware de verificación de token con rol opcional
export const verifyToken = (requiredRole) => {
    return (req, res, next) => {
        try {
            const header = req.headers["authorization"];
            if (!header) {
                return res.status(401).json({ error: "Token no proporcionado" });
            }
            const token = header.split(" ")[1];
            if (!token) {
                return res.status(401).json({ error: "Token vacío" });
            }
            const decoded = jwt.verify(token, SECRET);
            req.user = decoded;
            // Validación de rol si se especifica
            if (requiredRole && req.user.rol !== requiredRole) {
                return res.status(403).json({
                    error: `Acceso restringido: se requiere rol ${requiredRole}`,
                });
            }
            next();
        }
        catch (error) {
            return res.status(401).json({ error: "Token inválido o expirado" });
        }
    };
};
//# sourceMappingURL=verifyToken.js.map