// types/usuarios.ts

// --- ENUMS (Directamente de tu schema.prisma) ---
// Se exportan como 'const' para poder usarlos en el código (ej. Estatus.PENDIENTE)
// y como 'type' para la definición de tipos.

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

export const Rol = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  ENCARGADO: "ENCARGADO",
  USUARIO: "USUARIO",
  INVITADO: "INVITADO",
} as const;
export type Rol = (typeof Rol)[keyof typeof Rol];

export const Tipo = {
  ADMINISTRATIVO: "ADMINISTRATIVO",
  OPERATIVO: "OPERATIVO",
} as const;
export type Tipo = (typeof Tipo)[keyof typeof Tipo];

export const EstatusUsuario = {
  ACTIVO: "ACTIVO",
  INACTIVO: "INACTIVO",
} as const;
export type EstatusUsuario =
  (typeof EstatusUsuario)[keyof typeof EstatusUsuario];

// --- MODELOS DE DATOS (de la API) ---

/**
 * Representa un Departamento.
 * La API (JSON) envía las fechas como 'string'.
 */
export interface Departamento {
  id: number;
  tipo: Tipo;
  nombre: string;
  fechaCreacion: string; // string ISO
  fechaEdicion: string; // string ISO
}

/**
 * Representa un Usuario.
 * La API puede incluir o no el objeto 'departamento' según la consulta.
 */
export interface Usuario {
  id: number;
  nombre: string;
  username: string;
  // 'password' nunca se envía al frontend
  rol: Rol;
  estatus: EstatusUsuario;
  fechaCreacion: string; // string ISO
  fechaEdicion: string; // string ISO
  departamentoId: number | null;
  departamento?: Departamento; // Relación opcional
}

/**
 * Payload del usuario que se guarda en localStorage
 * (basado en lo que genera /api/auth/login)
 */
export interface UserPayload {
  id: number;
  nombre: string;
  username: string;
  rol: Rol;
  departamentoId: number | null;
}
