// src/api/01_axiosInstance.ts
import axios from "axios";

// 🔹 Configuración dinámica del entorno
const getBaseURL = () => {
  if (import.meta.env.MODE === "development") {
    return "http://localhost:3000/api";
  }
  return "/api"; // producción
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 10000,
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

// 📡 Interceptor: logs de respuesta
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [${response.status}] ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error →`, {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default api;
