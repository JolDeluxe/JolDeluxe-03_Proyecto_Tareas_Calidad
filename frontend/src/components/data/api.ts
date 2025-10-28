import axios from "axios";

export const api = axios.create({
  baseURL: "http://200.1.0.72:3000/api",
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    // 1. Busca el token en el localStorage del navegador
    const token = localStorage.getItem("token");

    // 2. Si el token existe, lo añade al header
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
