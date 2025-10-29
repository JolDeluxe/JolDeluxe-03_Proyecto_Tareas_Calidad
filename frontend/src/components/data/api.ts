import axios from "axios";

// 🔹 CONFIGURACIÓN SIMPLE Y EFECTIVA
const getBaseURL = () => {
  // Vite define 'import.meta.env.MODE'
  // 'development' = npm run dev
  // 'production' = npm run build (que usa 'npm run start:prod')
  
  if (import.meta.env.MODE === 'development') {
    // Cuando corres 'npm run dev', apunta a tu Express local
    return "http://localhost:3000/api"; 
  }
  
  // En producción (cuando usas 'npm run start:prod'), usa una ruta relativa
  // Esto usará https://tareas-calidad-mbc.mbc-bitacoras.me/api
  return "/api";
};

export const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  timeout: 10000, 
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    console.log(`🔄 API Request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error:`, {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    return Promise.reject(error);
  }
);