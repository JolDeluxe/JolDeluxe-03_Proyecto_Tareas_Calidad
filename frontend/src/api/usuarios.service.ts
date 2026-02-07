// 📍 src/api/usuarios.service.ts
import api from "./01_axiosInstance";
import type { Usuario, Rol, EstatusUsuario } from "../types/usuario";

// ===================================================================
// TIPOS DE PAYLOAD
// ===================================================================

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
   * 🔹 Obtener usuarios (GET /api/usuarios)
   * El backend ya filtra automáticamente según el rol del usuario (Admin ve suyos + invitados).
   */
  getAll: async (params?: {
    departamentoId?: number;
    estatus?: EstatusUsuario;
  }): Promise<Usuario[]> => {
    const { data } = await api.get("/usuarios", { params });
    return data;
  },

  getInvitados: async (): Promise<Usuario[]> => {
    const { data } = await api.get<Usuario[]>("/usuarios/invitados");
    return data;
  },

  getUsuarios: async (params?: {
    estatus?: EstatusUsuario;
  }): Promise<Usuario[]> => {
    const { data } = await api.get<Usuario[]>("/usuarios/usuarios", { params });
    return data;
  },

  getEncargadosYUsuarios: async (params?: {
    estatus?: EstatusUsuario;
  }): Promise<Usuario[]> => {
    const { data } = await api.get<Usuario[]>(
      "/usuarios/encargados-y-usuarios",
      { params }
    );
    return data;
  },

  getById: async (id: number): Promise<Usuario> => {
    const { data } = await api.get(`/usuarios/${id}`);
    return data;
  },

  create: async (payload: CrearUsuarioPayload): Promise<Usuario> => {
    const { data } = await api.post("/usuarios", payload);
    return data;
  },

  update: async (
    id: number,
    payload: ActualizarUsuarioPayload
  ): Promise<Usuario> => {
    const { data } = await api.put(`/usuarios/${id}`, payload);
    return data;
  },

  updateEstatus: async (
    id: number,
    estatus: EstatusUsuario
  ): Promise<Usuario> => {
    const payload: ActualizarEstatusPayload = { estatus };
    const { data } = await api.put(`/usuarios/${id}/estatus`, payload);
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