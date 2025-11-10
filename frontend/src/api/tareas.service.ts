import api from "./01_axiosInstance";
import type { Tarea } from "../types/tarea";

/**
 * Servicio de acceso a datos para la entidad 'Tareas'.
 * Capa del Modelo (M) en el esquema MVC del frontend.
 * Cada método corresponde a un endpoint de tu backend Express.
 */
export const tareasService = {
  /**
   * 🔹 Obtener todas las tareas (GET /api/tareas)
   * Incluye relaciones: historialFechas, imágenes, responsables, etc.
   */
  getAll: async (): Promise<Tarea[]> => {
    const { data } = await api.get("/tareas");
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
   * 🔹 Crear un nuevo registro de historial de fechas (POST /api/tareas/:id)
   * Este endpoint se usa cuando un usuario modifica la fecha límite.
   */
  createHistorial: async (
    id: number,
    payload: { fecha: string; motivo?: string | null }
  ): Promise<any> => {
    const { data } = await api.post(`/tareas/${id}`, payload);
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

  cancel: async (id: number): Promise<Tarea> => {
    // Usamos PATCH para consistencia, aunque PUT también sería válido
    const { data } = await api.patch(`/tareas/${id}/cancel`);
    return data;
  },
};
