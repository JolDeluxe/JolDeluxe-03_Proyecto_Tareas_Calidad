// 📍 src/api/usuarios.service.ts
import api from "./01_axiosInstance";
import type { Usuario, Rol, EstatusUsuario } from "../types/usuario"; // Asegúrate de que Rol y EstatusUsuario estén exportados en tus tipos

// ===================================================================
// TIPOS DE PAYLOAD (Basados en tus Zod Schemas del backend)
// ===================================================================

/**
 * Payload para crear un usuario. Basado en `crearUsuarioSchema`.
 */
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
  password?: string; // Opcional, solo si se quiere cambiar
  rol?: Rol;
  departamentoId?: number | null;
};

/**
 * Payload para el endpoint de Estatus (soft delete).
 * Basado en `estatusSchema`.
 */
export type ActualizarEstatusPayload = {
  estatus: EstatusUsuario;
};

/**
 * Payload para registrar una suscripción Push.
 * Basado en `subscriptionSchema`.
 */
export type PushSubscriptionPayload = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

// ===================================================================
// SERVICIO DE USUARIOS
// ===================================================================

/**
 * Servicio de acceso a datos para la entidad 'Usuarios'.
 * Mapea los endpoints de `routes/usuarios.ts`.
 */
export const usuariosService = {
  /**
   * 🔹 Obtener usuarios (GET /api/usuarios)
   * Permite filtrar por departamentoId y estatus.
   *
   * ❗️ IMPORTANTE: Tu backend por defecto ya filtra por `estatus: "ACTIVO"`.
   * Así que llamar a `getAll()` sin parámetros es perfecto para el dropdown de filtros.
   */
  getAll: async (params?: {
    departamentoId?: number;
    estatus?: EstatusUsuario;
  }): Promise<Usuario[]> => {
    const { data } = await api.get("/usuarios", { params });
    return data;
  },

  getInvitados: async () => {
    // Asumiendo que tu ruta base es /usuarios y el endpoint es /invitados
    const { data } = await api.get<Usuario[]>("/usuarios/invitados");
    return data;
  },

  // 🆕 Nuevo: Obtener solo usuarios con ROL=USUARIO
  /**
   * 🔹 Obtener solo usuarios con ROL=USUARIO (GET /api/usuarios/usuarios)
   */
  getUsuarios: async (params?: {
    estatus?: EstatusUsuario;
  }): Promise<Usuario[]> => {
    const { data } = await api.get<Usuario[]>("/usuarios/usuarios", { params });
    return data;
  },

  // 🆕 Nuevo: Obtener solo usuarios con ROL=ENCARGADO o ROL=USUARIO
  /**
   * 🔹 Obtener usuarios con ROL=ENCARGADO o ROL=USUARIO (GET /api/usuarios/encargados-y-usuarios)
   */
  getEncargadosYUsuarios: async (params?: {
    estatus?: EstatusUsuario;
  }): Promise<Usuario[]> => {
    const { data } = await api.get<Usuario[]>(
      "/usuarios/encargados-y-usuarios",
      { params }
    );
    return data;
  },

  /**
   * 🔹 Obtener un usuario por ID (GET /api/usuarios/:id)
   */
  getById: async (id: number): Promise<Usuario> => {
    const { data } = await api.get(`/usuarios/${id}`);
    return data;
  },

  /**
   * 🔹 Crear un nuevo usuario (POST /api/usuarios)
   */
  create: async (payload: CrearUsuarioPayload): Promise<Usuario> => {
    const { data } = await api.post("/usuarios", payload);
    return data;
  },

  /**
   * 🔹 Actualizar un usuario (PUT /api/usuarios/:id)
   */
  update: async (
    id: number,
    payload: ActualizarUsuarioPayload
  ): Promise<Usuario> => {
    const { data } = await api.put(`/usuarios/${id}`, payload);
    return data;
  },

  /**
   * 🔹 Actualizar estatus (Soft Delete / Reactivar) (PUT /api/usuarios/:id/estatus)
   */
  updateEstatus: async (
    id: number,
    estatus: EstatusUsuario
  ): Promise<Usuario> => {
    const payload: ActualizarEstatusPayload = { estatus };
    const { data } = await api.put(`/usuarios/${id}/estatus`, payload);
    return data;
  },

  /**
   * 🔹 Registrar una suscripción Push (POST /api/usuarios/:id/subscribe)
   */
  subscribeToPush: async (
    id: number,
    subscription: PushSubscriptionPayload
  ): Promise<any> => {
    const { data } = await api.post(`/usuarios/${id}/subscribe`, subscription);
    return data;
  },
};
