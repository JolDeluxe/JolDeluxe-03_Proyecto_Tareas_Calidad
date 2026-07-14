// src/api/01_axiosInstance.ts
import axios from "axios";

// 🔹 Configuración dinámica del entorno
const getBaseURL = () => {
  if (import.meta.env.MODE === "development") {
    // Detectar si estamos dentro del emulador Android
    const isAndroidEmulator =
      typeof navigator !== "undefined" &&
      /Android/i.test(navigator.userAgent) &&
      !window.location.hostname.includes("localhost");

    if (isAndroidEmulator) {
      console.log("📱 Ejecutando desde emulador Android → usando 10.0.2.2");
      return "http://10.0.2.2:3000/api";
    }

    // Caso normal: navegador de escritorio
    return import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  }

  // Producción: Priorizar variable de entorno, si no existe cae a path relativo
  return import.meta.env.VITE_API_URL || "/api";
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  // 🚀 Aumentar a 30 segundos
  timeout: 30000,
});

// 🔐 Interceptor: inyecta token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
    console.log(
      `🔄 API Request → ${config.method?.toUpperCase()} ${config.baseURL}${
        config.url
      }`
    );
    return config;
  },
  (error) => Promise.reject(error)
);

import { writeToCache, readFromCache, saveToOfflineQueue } from "../utils/offlineQueue";

// 📡 Interceptor: logs de respuesta y manejo offline
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [${response.status}] ${response.config.url}`);
    
    // Si la petición GET fue exitosa, guardamos en caché local de IndexedDB
    if (response.config.method === "get" && response.config.url) {
      const cacheKey = response.config.url + JSON.stringify(response.config.params || {});
      writeToCache(cacheKey, response.data);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Detectar pérdida de red/servidor inaccesible (Offline)
    if (!error.response && error.message === "Network Error" && originalRequest) {
      // 1. Si es una consulta GET, intentamos servir de la caché local de IndexedDB
      if (originalRequest.method === "get" && originalRequest.url) {
        const cacheKey = originalRequest.url + JSON.stringify(originalRequest.params || {});
        const cachedData = await readFromCache(cacheKey);
        if (cachedData) {
          console.warn(`📡 [OFFLINE] Sirviendo de cache local para: ${originalRequest.url}`);
          return Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: "OK",
            headers: {},
            config: originalRequest,
          } as any);
        }
      }

      // 2. Si es una mutación (POST, PUT, PATCH, DELETE), la guardamos en la cola local
      const isMutation = ["post", "put", "patch", "delete"].includes(originalRequest.method || "");
      if (isMutation && !originalRequest._isRetry) {
        console.warn("📡 Red no disponible. Guardando mutación en cola offline.");
        await saveToOfflineQueue(originalRequest);

        const offlineError = new Error("Modo offline: Tu acción ha sido guardada localmente y se sincronizará cuando vuelva la conexión.");
        (offlineError as any).response = {
          data: {
            message: "Modo offline: Tu acción ha sido guardada localmente y se sincronizará cuando vuelva la conexión.",
          },
        };
        return Promise.reject(offlineError);
      }
    }

    console.error(`❌ API Error →`, {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default api;
