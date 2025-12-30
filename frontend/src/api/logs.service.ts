import api from "./01_axiosInstance";

// Ajustamos la interfaz a tu modelo de Prisma (Bitacora)
export interface LogSistema {
  id: number;
  accion: string;       // Ej: "LOGIN", "ERROR_SERVER", "CREAR_USUARIO"
  descripcion: string;  // El mensaje descriptivo
  detalles?: any;       // JSON extra
  fecha: string;
  usuario?: {           // El include que hiciste en el backend
    nombre: string;
    rol: string;
  };
}

export const logsService = {
  getAll: async () => {
    const { data } = await api.get<LogSistema[]>('/logs');
    return data;
  },
};