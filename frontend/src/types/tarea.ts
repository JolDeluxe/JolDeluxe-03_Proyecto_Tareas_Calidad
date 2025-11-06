// types/tareas.ts

// Importa los tipos y Enums base del archivo de usuarios
import type { Estatus, Urgencia, Usuario, Departamento } from "./usuario";

// Exporta los Enums para que otros archivos puedan importarlos desde aquí
// (Esto es opcional, pero es una buena práctica)
export * from "./usuario";

export interface ResponsableLimpio {
  id: number;
  nombre: string;
}

/**
 * Modelo de ImagenTarea.
 * Las fechas de la API (JSON) siempre llegan como 'string' (ISO).
 */
export interface ImagenTarea {
  id: number;
  url: string;
  fechaSubida: string; // Correcto: string, no Date
  tareaId: number;
}

/**
 * Modelo de HistorialFecha.
 * Refleja la relación con 'Usuario' (modificadoPor).
 */
export interface HistorialFecha {
  id: number;
  fechaAnterior: Date | string | null;
  nuevaFecha: Date | string | null;
  motivo: string | null;
  fechaCambio: Date | string | null;

  modificadoPorId: number;
  modificadoPor: {
    id: number;
    nombre: string;
  };
  tareaId: number;
}

/**
 * Modelo principal de Tarea (refleja el schema.prisma y la respuesta de la API)
 *
 * Tus campos 'asignador' y 'responsable' estaban como 'string',
 * pero tu schema.prisma muestra que son relaciones.
 * Esta interfaz lo corrige.
 */
export interface Tarea {
  id: number;
  tarea: string;

  // 👇 CORRECCIÓN: Tu fetch las convierte a Date.
  // El estado de React (useState<Tarea[]>) almacena OBJETOS Date, no strings.
  fechaRegistro: Date | string | null;
  fechaLimite: Date | string | null;
  fechaConclusion: Date | string | null;

  estatus: Estatus;
  urgencia: Urgencia;
  observaciones: string | null;

  // --- Relaciones ---
  departamentoId: number;
  departamento: {
    id: number;
    nombre: string;
  };

  asignadorId: number;
  asignador: {
    id: number;
    nombre: string;
  };

  // 👇 CORRECCIÓN: Debe usar el tipo ResponsableLimpio
  responsables: ResponsableLimpio[];

  // --- Modelos de Soporte ---
  historialFechas: HistorialFecha[];
  imagenes: ImagenTarea[];

  _count?: {
    imagenes: number;
    historialFechas: number;
  };
}
