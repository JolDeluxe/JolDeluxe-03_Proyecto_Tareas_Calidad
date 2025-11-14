import api from "./01_axiosInstance";
import type { Tarea } from "../types/tarea";

type TareaFilters = {
  departamentoId?: number;
  asignadorId?: number;
  responsableId?: number;
  estatus?: "PENDIENTE" | "CONCLUIDA" | "CANCELADA";
  viewType?: "MIS_TAREAS" | "ASIGNADAS" | "TODAS";
};
type EstatusFilter = { estatus?: "PENDIENTE" | "CONCLUIDA" | "CANCELADA" };

export const tareasService = {
  /**
   * 🔹 Obtener todas las tareas (GET /api/tareas)
   */
  getAll: async (filters: TareaFilters = {}): Promise<Tarea[]> => {
    const { data } = await api.get("/tareas", {
      params: filters,
    });

    // 🚀 AJUSTE: Si el backend devuelve { info, data }, extraemos 'data'.
    // Si devolviera directo el array (versión vieja), usamos 'data' tal cual.
    if (data.data && Array.isArray(data.data)) {
      console.log(`📚 Tareas cargadas: ${data.info.total}`); // Log del contador para ti
      return data.data;
    }

    return data;
  },

  getMisTareas: async (filters: EstatusFilter = {}): Promise<Tarea[]> => {
    const { data } = await api.get("/tareas/misTareas", {
      params: filters,
    });

    // Manejar la estructura de respuesta { info, data }
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }

    return data;
  },

  // 🆕 NUEVO: Obtener solo tareas que el usuario logueado asignó
  /**
   * 🔹 Obtener solo tareas que el usuario logueado asignó (GET /api/tareas/asignadas)
   * Acepta filtro por estatus.
   */
  getAsignadas: async (filters: EstatusFilter = {}): Promise<Tarea[]> => {
    const { data } = await api.get("/tareas/asignadas", {
      params: filters,
    });

    // Manejar la estructura de respuesta { info, data }
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }

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
