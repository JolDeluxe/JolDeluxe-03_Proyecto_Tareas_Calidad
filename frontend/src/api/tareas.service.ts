import api from "./01_axiosInstance";
import type { Tarea } from "../types/tarea";

/**
 * Servicio de acceso a datos para la entidad 'Tareas'.
 * Capa del Modelo (M) en el esquema MVC del frontend.
 */

type TareaFilters = {
  departamentoId?: number;
  asignadorId?: number;
  responsableId?: number;
  estatus?: "PENDIENTE" | "CONCLUIDA" | "CANCELADA";
  // ✅ ACTUALIZACIÓN: Agregamos "TODAS" para coincidir con el nuevo backend
  // "MIS_TAREAS": Solo donde soy responsable
  // "ASIGNADAS": Solo las que yo creé
  // "TODAS" (o undefined): Ver todo el departamento (Auditoría)
  viewType?: "MIS_TAREAS" | "ASIGNADAS" | "TODAS";
};

export const tareasService = {
  /**
   * 🔹 Obtener todas las tareas (GET /api/tareas)
   * Incluye relaciones: historialFechas, imágenes, responsables, etc.
   */
  getAll: async (filters: TareaFilters = {}): Promise<Tarea[]> => {
    // Axios automáticamente construye el query string (ej. ?viewType=TODAS)
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
   */
  create: async (payload: Partial<Tarea>): Promise<Tarea> => {
    const { data } = await api.post("/tareas", payload);
    return data;
  },

  /**
   * 🔹 Crear un nuevo registro de historial de fechas (POST /api/tareas/:id/historial)
   */
  createHistorial: async (
    id: number,
    payload: { fechaAnterior: Date; nuevaFecha: Date; motivo?: string | null }
  ): Promise<any> => {
    const { data } = await api.post(`/tareas/${id}/historial`, payload);
    return data;
  },

  /**
   * 🔹 Actualizar una tarea (PUT /api/tareas/:id)
   */
  update: async (id: number, payload: Partial<Tarea>): Promise<Tarea> => {
    const { data } = await api.put(`/tareas/${id}`, payload);
    return data;
  },

  /**
   * 🔹 Marcar una tarea como CONCLUIDA (PATCH /api/tareas/:id/complete)
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

  // 🚀 Subir imágenes a Cloudinary (POST /api/tareas/:id/upload)
  uploadImage: async (id: number, formData: FormData): Promise<any> => {
    const { data } = await api.post(`/tareas/${id}/upload`, formData);
    return data;
  },

  // 🚀 Borrar imagen de Cloudinary (DELETE /api/tareas/imagen/:id)
  deleteImage: async (imagenId: number): Promise<{ message: string }> => {
    const { data } = await api.delete(`/tareas/imagen/${imagenId}`);
    return data;
  },
};
