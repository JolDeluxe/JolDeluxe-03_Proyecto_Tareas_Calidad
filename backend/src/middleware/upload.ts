// backend/src/middleware/upload.ts
import type { Request, Response, NextFunction } from "express"; 
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// 1. Configuración de Cloudinary
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
  secure: true,
});

// 2. Configuración del Almacenamiento
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "tareas",
    public_id: (req: Request, file: Express.Multer.File) => 
      `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  } as any,
});

// 3. Instancia de Multer con LÍMITES DE SEGURIDAD (5MB)
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 🔒 5 MB Límite
  }
});

// -----------------------------------------------------------
// 🛡️ MIDDLEWARES EXPORTABLES (Lo que tú tenías)
// -----------------------------------------------------------

// A) Para subir Imágenes Generales (Array "imagenes")
export const uploadImagenesMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const uploadFn = upload.array("imagenes", 10);

  uploadFn(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          error: "Archivo demasiado pesado",
          detalle: "El tamaño máximo permitido es de 5MB por imagen.",
        });
      }
      return res.status(400).json({ error: "Error de subida", detalle: err.message });
    } else if (err) {
      return res.status(500).json({ error: "Error al subir archivo", detalle: err.message });
    }
    next();
  });
};

// B) Para subir Evidencias de Entrega (Array "evidencias")
export const uploadEvidenciasMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const uploadFn = upload.array("evidencias", 5);
  
    uploadFn(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "Evidencia demasiado pesada",
            detalle: "El tamaño máximo permitido es de 5MB por archivo.",
          });
        }
        return res.status(400).json({ error: "Error de subida", detalle: err.message });
      } else if (err) {
        return res.status(500).json({ error: "Error al subir evidencia", detalle: err.message });
      }
      next();
    });
};

// C) (Opcional) Exportar cloudinary por si lo necesitas para borrar imágenes en el controller
export { cloudinary };