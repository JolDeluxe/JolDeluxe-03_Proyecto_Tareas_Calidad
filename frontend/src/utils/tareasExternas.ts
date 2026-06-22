import type { Tarea } from "../types/tarea";
import type { Usuario } from "../types/usuario";
import { Rol } from "../types/usuario";

/**
 * Detecta si una tarea fue asignada desde un departamento diferente al destino.
 */
export const esTareaExterna = (tarea: Tarea): boolean => {
  return !!tarea.asignador.departamentoId && 
         tarea.asignador.departamentoId !== tarea.departamentoId;
};

/**
 * Determina la etiqueta visual y el tipo semántico de la tarea externa.
 */
export const getTareaExternaInfo = (tarea: Tarea): {
  esExterna: boolean;
  esKaizen: boolean;
  label: string;
  deptoNombre: string;
} => {
  const esExterna = esTareaExterna(tarea);
  if (!esExterna) return { esExterna: false, esKaizen: false, label: "", deptoNombre: "" };

  const deptoNombre = tarea.asignador.departamento?.nombre || "";
  const esKaizen = deptoNombre.toUpperCase().includes("CALIDAD");

  return {
    esExterna: true,
    esKaizen,
    label: esKaizen ? "KAIZEN" : `EXTERNA · ${deptoNombre}`,
    deptoNombre,
  };
};

/**
 * Badge JSX data — devuelve las clases de Tailwind según el tipo.
 */
export const getBadgeClasses = (esKaizen: boolean) => ({
  bg: esKaizen ? "bg-indigo-100" : "bg-amber-100",
  text: esKaizen ? "text-indigo-700" : "text-amber-700",
  border: esKaizen ? "border-indigo-300" : "border-amber-300",
  dot: esKaizen ? "bg-indigo-500" : "bg-amber-500",
});

export const esResponsableDeTarea = (tarea: Tarea, user: Usuario | null): boolean => {
  if (!user) return false;

  return tarea.responsables.some((responsable: any) => {
    const responsableId = responsable.id ?? responsable.usuarioId ?? responsable.usuario?.id;
    return responsableId === user.id;
  });
};

export const puedeRevisarTarea = (tarea: Tarea, user: Usuario | null): boolean => {
  if (!user) return false;
  if (user.rol === Rol.SUPER_ADMIN) return true;

  if (esResponsableDeTarea(tarea, user)) return false;

  if (tarea.asignadorId === user.id) return true;

  const departamentoOrigenId = tarea.asignador?.departamentoId ?? null;
  if (!departamentoOrigenId || user.departamentoId !== departamentoOrigenId) return false;

  const esExterna = tarea.departamentoId !== departamentoOrigenId;
  if (esExterna) {
    return user.rol === Rol.ADMIN || user.rol === Rol.ENCARGADO;
  }

  return user.rol === Rol.ADMIN;
};

export const puedeEditarTarea = (tarea: Tarea, user: Usuario | null): boolean => {
  if (!user) return false;
  if (user.rol === Rol.SUPER_ADMIN) return true;

  if (esResponsableDeTarea(tarea, user)) return false;

  const departamentoOrigenId = tarea.asignador?.departamentoId ?? null;
  const esAsignadorOriginal = tarea.asignadorId === user.id;

  // Si es el asignador original, puede editar (siempre que sea ADMIN o ENCARGADO)
  if (esAsignadorOriginal && (user.rol === Rol.ADMIN || user.rol === Rol.ENCARGADO)) return true;

  // Si no es el asignador original, debe pertenecer al departamento de origen
  if (!departamentoOrigenId || user.departamentoId !== departamentoOrigenId) return false;

  // Si pertenece al departamento de origen y no es el asignador original:
  const rolCreador = tarea.asignador?.rol;
  const creadorEsAdmin = rolCreador === Rol.ADMIN || rolCreador === Rol.SUPER_ADMIN;

  if (user.rol === Rol.ADMIN) {
    return true;
  }
  if (user.rol === Rol.ENCARGADO) {
    // Un encargado de área no puede editar tareas creadas por un Administrador de su área
    return !creadorEsAdmin;
  }

  return false;
};
