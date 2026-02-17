import api from "./01_axiosInstance";
import type { Tarea } from "../types/tarea";

// --- INTERFACES PARA EL API CONTRACT ---

/**
 * Filtros exactos que espera el Zod Schema del Backend
 */
export interface TareaFilters {
  page?: number;
  limit?: number;
  query?: string;
  // Filtros de Enumeración
  estatus?: "PENDIENTE" | "EN_REVISION" | "CONCLUIDA" | "CANCELADA";
  urgencia?: "BAJA" | "MEDIA" | "ALTA" | "CRITICA";
  // Filtros de Lógica de Negocio
  tiempoFilter?: "PENDIENTES_ATRASADAS" | "PENDIENTES_A_TIEMPO" | "ENTREGADAS_ATRASADAS" | "ENTREGADAS_A_TIEMPO";
  viewType?: "MIS_TAREAS" | "ASIGNADAS" | "TODAS";
  // Filtros de Fecha (ISO Strings)
  fechaInicio?: string;
  fechaFin?: string;
  // Relaciones
  departamentoId?: number;
  asignadorId?: number;
  responsableId?: number;
  // Ordenamiento
  sortBy?: string;
  order?: "asc" | "desc";
}

/**
 * Estructura de respuesta del Backend (Meta + Data)
 * Necesaria para pintar los KPIs en el Dashboard
 */
export interface TareasResponse {
  status: string;
  meta: {
    pagination: {
      totalItems: number;
      itemsPorPagina: number;
      paginaActual: number;
      totalPaginas: number;
    };
    resumen: {
      totales: {
        todas: number;
        activas: number;
        pendientes: number;
        enRevision: number;
        concluidas: number;
        canceladas: number;
      };
      tiempos: {
        pendientesAtrasadas: number;
        pendientesATiempo: number;
        entregadasAtrasadas: number;
        entregadasATiempo: number;
      };
      // El desglose es dinámico (por usuario o departamento)
      desglose: Array<{
        id: number | string;
        nombre: string;
        pendientesAtrasadas: number;
        total: number;
        // ... otros campos del desglose
      }>;
    };
  };
  data: Tarea[];
}

export const tareasService = {
  /**
   * 🔹 Obtener todas las tareas con METADATA (KPIs)
   * GET /api/tareas
   * Retorna la respuesta completa para usar 'meta.resumen' en el dashboard.
   */
  getAll: async (filters: TareaFilters = {}): Promise<TareasResponse> => {
    // Aseguramos que los params se envíen correctamente
    const { data } = await api.get<TareasResponse>("/tareas", {
      params: filters,
    });
    return data; 
  },

  /**
   * 🔹 Helper para obtener Mis Tareas usando el endpoint principal o específico.
   * Si el backend unificó todo, preferimos usar getAll con viewType.
   * Mantenemos este método por compatibilidad semántica.
   */
  getMisTareas: async (filters: TareaFilters = {}): Promise<TareasResponse> => {
    // Forzamos el viewType si se usa este método
    const params = { ...filters, viewType: "MIS_TAREAS" as const };
    const { data } = await api.get<TareasResponse>("/tareas", { params });
    return data;
  },

  /**
   * 🔹 Helper para obtener Tareas Asignadas
   */
  getAsignadas: async (filters: TareaFilters = {}): Promise<TareasResponse> => {
    const params = { ...filters, viewType: "ASIGNADAS" as const };
    const { data } = await api.get<TareasResponse>("/tareas", { params });
    return data;
  },

  /**
   * 🔹 Obtener una tarea específica por ID
   */
  getById: async (id: number): Promise<Tarea> => {
    const { data } = await api.get<Tarea>(`/tareas/${id}`);
    return data;
  },

  /**
   * 🔹 Crear una nueva tarea
   */
  create: async (payload: Partial<Tarea>): Promise<Tarea> => {
    const { data } = await api.post<Tarea>("/tareas", payload);
    return data;
  },

  /**
   * 🔹 Crear historial de fechas (Reprogramación)
   */
  createHistorial: async (
    id: number,
    payload: { fechaAnterior: Date; nuevaFecha: Date; motivo?: string | null }
  ): Promise<any> => {
    const { data } = await api.post(`/tareas/${id}/historial`, payload);
    return data;
  },

  /**
   * 🔹 Actualizar tarea (PUT)
   */
  update: async (id: number, payload: Partial<Tarea>): Promise<Tarea> => {
    const { data } = await api.put<Tarea>(`/tareas/${id}`, payload);
    return data;
  },

  /**
   * 🔹 Marcar como COMPLETADA (PATCH)
   * El backend se encargará de validar si fue a tiempo o no.
   */
  complete: async (id: number): Promise<Tarea> => {
    const { data } = await api.patch<Tarea>(`/tareas/${id}/complete`);
    return data;
  },

  /**
   * 🔹 Marcar como CANCELADA (PATCH)
   */
  cancel: async (id: number): Promise<Tarea> => {
    const { data } = await api.patch<Tarea>(`/tareas/${id}/cancel`);
    return data;
  },

  /**
   * 🔹 Subir imagen a Cloudinary
   */
  uploadImage: async (id: number, formData: FormData): Promise<any> => {
    const { data } = await api.post(`/tareas/${id}/upload`, formData);
    return data;
  },

  /**
   * 🔹 Eliminar imagen
   */
  deleteImage: async (imagenId: number): Promise<{ message: string }> => {
    const { data } = await api.delete(`/tareas/imagen/${imagenId}`);
    return data;
  },

  /**
   * 🔹 Entregar Tarea (Subir evidencias)
   */
  entregar: async (id: number, comentario: string, archivos: File[]): Promise<any> => {
    const formData = new FormData();
    formData.append("comentarioEntrega", comentario);
    
    archivos.forEach((archivo) => {
      formData.append("evidencias", archivo);
    });

    const { data } = await api.post(`/tareas/${id}/entregar`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  },

  /**
   * 🔹 Revisión de Tarea (Admin/Encargado)
   */
  revisar: async (
    id: number, 
    decision: "APROBAR" | "RECHAZAR", 
    feedback?: string, 
    nuevaFechaLimite?: Date
  ): Promise<any> => {
    const { data } = await api.post(`/tareas/${id}/revision`, {
      decision,
      feedback,
      nuevaFechaLimite 
    });
    return data;
  }
};