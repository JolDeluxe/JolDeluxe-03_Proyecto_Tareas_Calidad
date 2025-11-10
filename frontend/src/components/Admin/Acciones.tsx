import React from "react";
// 1. Importamos los tipos necesarios
import { type Tarea, Estatus } from "../../types/tarea";
import { type Usuario, Rol } from "../../types/usuario";

interface AccionesProps {
  // 2. Modificamos las props para recibir la tarea completa y el usuario
  tarea: Tarea;
  user: Usuario;
  onCompletar?: () => void;
  onEditar?: () => void;
  onBorrar?: () => void;
}

const Acciones: React.FC<AccionesProps> = ({
  // 3. Actualizamos la desestructuración de props
  tarea,
  user,
  onCompletar,
  onEditar,
  onBorrar,
}) => {
  // 4. 🚀 LÓGICA DE PERMISOS
  // Permiso para Validar (Completar)
  const puedeValidar =
    user.rol === Rol.SUPER_ADMIN ||
    user.rol === Rol.ADMIN ||
    (user.rol === Rol.ENCARGADO && tarea.asignadorId === user.id);

  // 🚀 NUEVA LÓGICA: Permiso para Cancelar (Borrar)
  const puedeCancelar =
    user.rol === Rol.SUPER_ADMIN ||
    user.rol === Rol.ADMIN ||
    (user.rol === Rol.ENCARGADO && tarea.asignadorId === user.id);

  return (
    <td className="w-[7%] px-4 py-3 text-center border-b border-gray-300">
      {/* Contenedor con altura fija para evitar "saltos" */}
      <div className="flex items-center justify-center gap-3 h-7">
        {/* --- CASO 1: Tarea PENDIENTE (Muestra botones condicionales) --- */}
        {/* 5. Usamos tarea.estatus en lugar de solo estatus */}
        {tarea.estatus === "PENDIENTE" && (
          <>
            {/* ✅ Completar / checklist */}
            {/* 6. 🚀 APLICAMOS LA LÓGICA
                El botón de completar AHORA solo se muestra si 'puedeValidar' es true 
            */}
            {puedeValidar && (
              <button
                onClick={onCompletar}
                title="Marcar como completada"
                className="w-7 h-7 flex items-center justify-center rounded-md border border-green-400 text-geen-700 hover:bg-geen-100 transition-all duration-200"
              >
                {/* Icono caja vacía (de la vista móvil) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 -960 960 960"
                  className="w-5 h-5 text-green-700" /* Ajustado el color */
                  fill="currentColor"
                >
                  <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Z" />
                </svg>
              </button>
            )}

            {/* ✏️ Editar */}
            <button
              onClick={onEditar}
              title="Editar tarea"
              className="w-7 h-7 flex items-center justify-center rounded-md border border-amber-400 text-amber-600 
                         hover:bg-amber-600 hover:text-white transition-all duration-200"
            >
              {/* Icono editar (de la vista móvil) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                className="w-5 h-5" /* Tamaño ajustado */
                fill="currentColor"
              >
                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
              </svg>
            </button>

            {/* 🗑️ Cancelar (AHORA CONDICIONAL) */}
            {/* 🚀 APLICAMOS LA LÓGICA 'puedeCancelar' */}
            {puedeCancelar && (
              <button
                onClick={onBorrar}
                title="Cancelar tarea"
                className="w-7 h-7 flex items-center justify-center rounded-md border border-red-400 text-red-600 
                           hover:bg-red-600 hover:text-white transition-all duration-200"
              >
                {/* Icono basura (de la vista móvil) */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 -960 960 960"
                  className="w-5 h-5" /* Tamaño ajustado */
                  fill="currentColor"
                >
                  <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                </svg>
              </button>
            )}
          </>
        )}

        {/* --- CASO 2: Tarea CONCLUIDA (Muestra solo el check) --- */}
        {/* 5. Usamos tarea.estatus */}
        {tarea.estatus === "CONCLUIDA" && (
          <div
            className="flex items-center justify-center"
            title="Tarea completada"
          >
            {/* Icono check (de la vista móvil) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -960 960 960"
              className="w-6 h-6 text-green-700" /* Tamaño ajustado */
              fill="currentColor"
            >
              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q8 0 15 1.5t14 4.5l-74 74H200v560h560v-266l80-80v346q0 33-23.5 56.5T760-120H200Zm261-160L235-506l56-56 170 170 367-367 57 55-424 424Z" />
            </svg>
          </div>
        )}

        {/* --- CASO 3: Tarea CANCELADA (Muestra icono 'X') --- */}
        {/* 5. Usamos tarea.estatus */}
        {tarea.estatus === "CANCELADA" && (
          <div
            className="flex items-center justify-center"
            title="Tarea cancelada"
          >
            {/* 'X' SVG (de la vista móvil) */}
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
    </td>
  );
};

export default Acciones;
