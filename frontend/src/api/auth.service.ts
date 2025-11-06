// 📍 src/api/auth.service.ts
import api from "./01_axiosInstance";
// 💡 Importamos los tipos que ya definiste
import type { UserPayload, Usuario } from "../types/usuario";

// 1. Define el payload para la función de login
// (Coincide con tu loginSchema del backend)
type LoginPayload = {
  username: string;
  password: string;
};

// 2. Define la respuesta del endpoint de login
// (Coincide con tu respuesta en auth.ts)
type LoginResponse = {
  message: string;
  token: string;
  usuario: UserPayload;
};

// 3. Define la respuesta del endpoint de verificación
type VerifyResponse = {
  valid: boolean;
  usuario: Usuario; // Tu tipo 'Usuario' completo
};

export const authService = {
  /**
   * 🔹 Inicia sesión (POST /api/auth/login)
   *
   */
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await api.post("/auth/login", payload);
    return data;
  },

  /**
   * 🔹 Verifica el token actual (GET /api/auth/verify)
   *
   */
  verify: async (): Promise<VerifyResponse> => {
    const { data } = await api.get("/auth/verify");
    return data;
  },

  /**
   * 🔹 Cierra sesión (POST /api/auth/logout)
   *
   */
  logout: async (): Promise<any> => {
    // Aunque el backend responde con JSON,
    // el frontend solo necesita saber que se completó.
    const { data } = await api.post("/auth/logout");
    return data;
  },
};
