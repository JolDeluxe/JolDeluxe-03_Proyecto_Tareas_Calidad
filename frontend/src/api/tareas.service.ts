import api from "./01_axiosInstance";
import type { Tarea } from "../types/tarea";

/**
 * Servicio de acceso a datos para la entidad 'Tareas'.
 * Capa del Modelo (M) en el esquema MVC del frontend.
 * Cada método corresponde a un endpoint de tu backend Express.
 */

type TareaFilters = {
  departamentoId?: number;
  asignadorId?: number;
  responsableId?: number;
  estatus?: "PENDIENTE" | "CONCLUIDA" | "CANCELADA";
  // Nuevo: el filtro para la lógica del ENCARGADO
  viewType?: "MIS_TAREAS" | "ASIGNADAS";
};

export const tareasService = {
  /**
   * 🔹 Obtener todas las tareas (GET /api/tareas)
   * Incluye relaciones: historialFechas, imágenes, responsables, etc.
   */
  getAll: async (filters: TareaFilters = {}): Promise<Tarea[]> => {
    // 💡 CAMBIO CLAVE: Axios automáticamente construye el query string (ej. ?viewType=ASIGNADAS)
    const { data } = await api.get("/tareas", {
      params: filters,
    });
    return data;
  },

  /**
   * 🔹 Obtener una tarea específica por ID (GET /api/tareas/:id)
   */
  getById: async (id: number): Promise<Tarea> => {
    const { data } = await api.get(`/tareas/${id}`);
    return data;
  },

  /**
   * 🔹 Crear una nueva tarea (POST /api/tareas)
   * Requiere token (se agrega automáticamente por el interceptor).
   */
  create: async (payload: Partial<Tarea>): Promise<Tarea> => {
    const { data } = await api.post("/tareas", payload);
    return data;
  },

  /**
   * 🔹 Crear un nuevo registro de historial de fechas (POST /api/tareas/:id/historial)
   * Este endpoint se usa cuando un usuario modifica la fecha límite.
   */
  createHistorial: async (
    id: number,
    payload: { fechaAnterior: Date; nuevaFecha: Date; motivo?: string | null } // Tipos actualizados para reflejar Zod
  ): Promise<any> => {
    // 💡 CORRECCIÓN DE RUTA: Se usa la ruta explícita /:id/historial del backend
    const { data } = await api.post(`/tareas/${id}/historial`, payload);
    return data;
  },

  /**
   * 🔹 Actualizar una tarea (PUT /api/tareas/:id)
   * Permite modificar estatus, responsable, observaciones, etc.
   */
  update: async (id: number, payload: Partial<Tarea>): Promise<Tarea> => {
    const { data } = await api.put(`/tareas/${id}`, payload);
    return data;
  },

  /**
   * 🔹 Marcar una tarea como CONCLUIDA (PATCH /api/tareas/:id/complete)
   * El backend se encarga de setear la fecha de conclusión y actualizar historial.
   */
  complete: async (id: number): Promise<Tarea> => {
    const { data } = await api.patch(`/tareas/${id}/complete`);
    return data;
  },

  /**
   * 🔹 Marcar una tarea como CANCELADA (PATCH /api/tareas/:id/cancel)
   */
  cancel: async (id: number): Promise<Tarea> => {
    const { data } = await api.patch(`/tareas/${id}/cancel`);
    return data;
  },

  // 🚀 NUEVO: Subir imágenes a Cloudinary (POST /api/tareas/:id/upload)
  uploadImage: async (id: number, formData: FormData): Promise<any> => {
    // Axios maneja automáticamente el Content-Type: multipart/form-data para FormData
    const { data } = await api.post(`/tareas/${id}/upload`, formData);
    return data;
  },

  // 🚀 NUEVO: Borrar imagen de Cloudinary (DELETE /api/tareas/imagen/:id)
  deleteImage: async (imagenId: number): Promise<{ message: string }> => {
    const { data } = await api.delete(`/tareas/imagen/${imagenId}`);
    return data;
  },
};
