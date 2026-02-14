// 📍 src/components/Admin/Acciones.tsx

import React from "react";
import { type Tarea } from "../../types/tarea";
import { type Usuario, Rol } from "../../types/usuario";

interface AccionesProps {
  tarea: Tarea;
  user: Usuario;
  onCompletar?: () => void;
  onEditar?: () => void;
  onBorrar?: () => void;
  // ✅ NUEVO: Prop para manejar la revisión
  onRevisar?: () => void;
}

const Acciones: React.FC<AccionesProps> = ({
  tarea,
  user,
  onCompletar,
  onEditar,
  onBorrar,
  onRevisar,
}) => {
  // --- LÓGICA DE PERMISOS ---

  const esSuperAdmin = user.rol === Rol.SUPER_ADMIN;
  const esAdmin = user.rol === Rol.ADMIN;
  const esEncargado = user.rol === Rol.ENCARGADO;
  const esPropietario = tarea.asignadorId === user.id;

  // 1. VALIDAR y CANCELAR:
  // Admin/SuperAdmin siempre pueden. Encargado solo si es dueño.
  const puedeGestionarEstado =
    esSuperAdmin || esAdmin || (esEncargado && esPropietario);

  // Detectar si quien asignó la tarea es un jefe (Admin o SuperAdmin)
  const asignadorEsAdmin =
    tarea.asignador?.rol === Rol.ADMIN ||
    tarea.asignador?.rol === Rol.SUPER_ADMIN;

  // 2. EDITAR:
  // Admin/SuperAdmin siempre.
  // Encargado puede editar, EXCEPTO si la tarea la creó un Admin (Bloqueo).
  const puedeEditar =
    esSuperAdmin || esAdmin || (esEncargado && !asignadorEsAdmin);

  return (
    // 🚨 CORRECCIÓN: Se eliminó el <td> exterior.
    // Ahora devolvemos directamente el div, ya que el padre (TablaAdmin) ya tiene el <td>.
    <div className="flex items-center justify-center gap-3 h-7 w-full">

      {/* --- CASO 1: Tarea PENDIENTE --- */}
      {tarea.estatus === "PENDIENTE" && (
        <>
          {/* ✅ Completar */}
          {puedeGestionarEstado && (
            <button
              onClick={onCompletar}
              title="Marcar como completada"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-green-400 text-green-700 hover:bg-green-100 transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                className="w-5 h-5 text-green-700"
                fill="currentColor"
              >
                <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Z" />
              </svg>
            </button>
          )}

          {/* ✏️ Editar */}
          {puedeEditar && (
            <button
              onClick={onEditar}
              title="Editar tarea"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-amber-400 text-amber-600 
                           hover:bg-amber-600 hover:text-white transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                className="w-5 h-5"
                fill="currentColor"
              >
                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
              </svg>
            </button>
          )}

          {/* 🗑️ Cancelar */}
          {puedeGestionarEstado && (
            <button
              onClick={onBorrar}
              title="Cancelar tarea"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-red-400 text-red-600 
                           hover:bg-red-600 hover:text-white transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                className="w-5 h-5"
                fill="currentColor"
              >
                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* --- CASO 1.5: Tarea EN_REVISION (NUEVO) --- */}
      {tarea.estatus === "EN_REVISION" && (
        <>
          {/* 🔍 Revisar (Lupita) */}
          {puedeGestionarEstado && onRevisar && (
            <button
              onClick={onRevisar}
              title="Revisar evidencia"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-indigo-400 text-indigo-700 
                           hover:bg-indigo-100 transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                className="w-5 h-5 fill-current"
              >
                <path d="M440-240q116 0 198-81.5T720-520q0-116-82-198t-198-82q-117 0-198.5 82T160-520q0 117 81.5 198.5T440-240Zm0-280Zm0 160q-83 0-147.5-44.5T200-520q28-70 92.5-115T440-680q82 0 146.5 45T680-520q-29 71-93.5 115.5T440-360Zm0-60q55 0 101-26.5t72-73.5q-26-46-72-73t-101-27q-56 0-102 27t-72 73q26 47 72 73.5T440-420Zm0-40q25 0 42.5-17t17.5-43q0-25-17.5-42.5T440-580q-26 0-43 17.5T380-520q0 26 17 43t43 17Zm0 300q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T80-520q0-74 28.5-139.5t77-114.5q48.5-49 114-77.5T440-880q74 0 139.5 28.5T694-774q49 49 77.5 114.5T800-520q0 64-21 121t-58 104l159 159-57 56-159-158q-47 37-104 57.5T440-160Z" />
              </svg>
            </button>
          )}

          {/* ✏️ Editar (Disponible en revisión por si acaso) */}
          {puedeEditar && (
            <button
              onClick={onEditar}
              title="Editar tarea"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-amber-400 text-amber-600 
                           hover:bg-amber-600 hover:text-white transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                className="w-5 h-5"
                fill="currentColor"
              >
                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
              </svg>
            </button>
          )}

          {/* 🗑️ Cancelar (Disponible en revisión) */}
          {puedeGestionarEstado && (
            <button
              onClick={onBorrar}
              title="Cancelar tarea"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-red-400 text-red-600 
                           hover:bg-red-600 hover:text-white transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                className="w-5 h-5"
                fill="currentColor"
              >
                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
              </svg>
            </button>
          )}
        </>
      )}

      {/* --- CASO 2: Tarea CONCLUIDA --- */}
      {tarea.estatus === "CONCLUIDA" && (
        <div
          className="flex items-center justify-center"
          title="Tarea completada"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            className="w-6 h-6 text-green-700"
            fill="currentColor"
          >
            <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q8 0 15 1.5t14 4.5l-74 74H200v560h560v-266l80-80v346q0 33-23.5 56.5T760-120H200Zm261-160L235-506l56-56 170 170 367-367 57 55-424 424Z" />
          </svg>
        </div>
      )}

      {/* --- CASO 3: Tarea CANCELADA --- */}
      {tarea.estatus === "CANCELADA" && (
        <div
          className="flex items-center justify-center"
          title="Tarea cancelada"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5 text-red-700"
          >
            <path
              fillRule="evenodd"
              d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export default Acciones;