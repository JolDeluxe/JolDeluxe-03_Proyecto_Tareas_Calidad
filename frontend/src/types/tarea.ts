export const Estatus = {
  PENDIENTE: "PENDIENTE",
  CONCLUIDA: "CONCLUIDA",
  CANCELADA: "CANCELADA",
} as const;

export type Estatus = (typeof Estatus)[keyof typeof Estatus];

export const Urgencia = {
  BAJA: "BAJA",
  MEDIA: "MEDIA",
  ALTA: "ALTA",
} as const;

export type Urgencia = (typeof Urgencia)[keyof typeof Urgencia];

// --- Models ---

export interface Tarea {
  id: number;
  tarea: string;
  asignador: string;
  responsable: string;
  fechaRegistro: Date;
  fechaLimite: Date;
  fechaConclusion: Date | null;
  estatus: Estatus;
  urgencia: Urgencia;
  observaciones: string | null;
  historialFechas: HistorialFecha[];
}

export interface HistorialFecha {
  id: number;
  fechaAnterior: Date;
  nuevaFecha: Date;
  modificadoPor: string;
  motivo: string | null;
  fechaCambio: Date;

  tareaId: number;
  tarea: Tarea;
}
