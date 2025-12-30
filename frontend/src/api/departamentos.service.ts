import api from "./01_axiosInstance";

export interface Departamento {
  id: number;
  nombre: string;
  // tipo: string;  <-- ELIMINADO
  
  // Agregamos esto para poder buscar al jefe en la tabla
  usuarios: {
    id: number;
    nombre: string;
    rol: string; // 'ADMIN' | 'USUARIO', etc.
  }[];
  
  _count?: {
    usuarios: number;
    tareas: number;
  };
}

export const departamentosService = {
  getAll: async () => {
    const { data } = await api.get<Departamento[]>('/departamentos');
    return data;
  },

  create: async (nombre: string) => {
    const { data } = await api.post('/departamentos', { nombre, tipo: 'ADMINISTRATIVO' });
    return data;
  },

  update: async (id: number, nombre: string) => {
    const { data } = await api.put(`/departamentos/${id}`, { nombre });
    return data;
  },
};