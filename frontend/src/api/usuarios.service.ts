// 📍 src/api/usuarios.service.ts
import api from "./01_axiosInstance";
import type { Usuario, Rol, EstatusUsuario } from "../types/usuario";

// ===================================================================
// TIPOS DE PAYLOAD Y RESPUESTAS
// ===================================================================

// Estructura de respuesta paginada que viene del Backend
export interface PaginatedResponse<T> {
  status: string;
  meta: {
    totalItems: number;
    itemsPorPagina: number;
    paginaActual: number;
    totalPaginas: number;
    resumenRoles: Record<string, number>;
  };
  data: T[];
}

// Filtros disponibles para el GET
export type GetUsuariosParams = {
  page?: number;
  limit?: number;
  q?: string;            // Búsqueda por nombre/username
  rol?: Rol;             // Filtro por rol específico
  departamentoId?: number;
  estatus?: EstatusUsuario;
};

export type CrearUsuarioPayload = {
  nombre: string;
  username: string;
  password: string;
  rol: Rol;
  departamentoId?: number | null;
};

export type ActualizarUsuarioPayload = {
  nombre?: string;
  username?: string;
  password?: string;
  rol?: Rol;
  departamentoId?: number | null;
};

export type ActualizarEstatusPayload = {
  estatus: EstatusUsuario;
};

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: PushSubscriptionKeys;
}

// ===================================================================
// SERVICIO DE USUARIOS
// ===================================================================

export const usuariosService = {
  /**
   * 🔹 Obtener usuarios activos (Paginado y Filtrado)
   * GET /api/usuarios
   * Soporta: page, limit, q (busqueda), rol, depto.
   */
  getAll: async (params?: GetUsuariosParams): Promise<PaginatedResponse<Usuario>> => {
    const { data } = await api.get<PaginatedResponse<Usuario>>("/usuarios", { params });
    return data;
  },

  /**
   * 🔹 Obtener usuarios inactivos (Papelera)
   * GET /api/usuarios/inactivos
   */
  getInactivos: async (params?: GetUsuariosParams): Promise<PaginatedResponse<Usuario>> => {
    const { data } = await api.get<PaginatedResponse<Usuario>>("/usuarios/inactivos", { params });
    return data;
  },

  /**
   * 🔹 Obtener usuario por ID (o Username si el back lo soporta)
   */
  getById: async (id: number | string): Promise<Usuario> => {
    const { data } = await api.get<Usuario>(`/usuarios/${id}`);
    return data;
  },

  create: async (payload: CrearUsuarioPayload): Promise<Usuario> => {
    const { data } = await api.post<Usuario>("/usuarios", payload);
    return data;
  },

  update: async (
    id: number,
    payload: ActualizarUsuarioPayload
  ): Promise<Usuario> => {
    const { data } = await api.put<Usuario>(`/usuarios/${id}`, payload);
    return data;
  },

  updateEstatus: async (
    id: number,
    estatus: EstatusUsuario
  ): Promise<Usuario> => {
    const payload: ActualizarEstatusPayload = { estatus };
    const { data } = await api.put<Usuario>(`/usuarios/${id}/estatus`, payload);
    return data;
  },

  subscribeToPush: async (
    id: number,
    subscription: PushSubscriptionPayload
  ): Promise<any> => {
    const { data } = await api.post(`/usuarios/${id}/subscribe`, subscription);
    return data;
  },
};