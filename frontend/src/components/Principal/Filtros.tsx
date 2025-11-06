// 📍 src/components/Principal/Filtros.tsx

import React, { useState, useRef, useEffect } from "react";
// 1. Importar el nuevo servicio de usuarios
import { usuariosService } from "../../api/usuarios.service";
// 2. Importar el tipo Usuario (asumiendo la ruta)
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";

interface FiltrosProps {
  // 3. Cambiar el nombre de la prop para que sea más claro
  onUsuarioChange: (usuarioId: string) => void;
  onBuscarChange?: (query: string) => void;
  user: Usuario | null;
}

const Filtros: React.FC<FiltrosProps> = ({
  onUsuarioChange,
  onBuscarChange,
}) => {
  const { user } = useAuth();

  const [responsableOpen, setResponsableOpen] = useState(false);

  // 4. El estado seleccionado ahora guarda el ID (como string) o "Todos"
  const [selectedUsuarioId, setSelectedUsuarioId] = useState("Todos");

  // 5. El estado de la lista ahora guarda objetos Usuario
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const responsableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 6. Cargar la lista de Usuarios (no de Tareas)
    const fetchUsuarios = async () => {
      try {
        // Usamos el servicio. getAll() por defecto trae solo ACTIVOS.
        const data = await usuariosService.getAll();
        // Ordenamos alfabéticamente
        const listaOrdenada = data.sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        );
        setUsuarios(listaOrdenada);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      }
    };
    fetchUsuarios();
  }, []); // Cargar solo al montar

  // Hook para cerrar el dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        responsableRef.current &&
        !responsableRef.current.contains(event.target as Node)
      ) {
        setResponsableOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [user]);

  // 7. Handler actualizado, ahora trabaja con IDs
  const handleUsuarioSelect = (usuarioId: string) => {
    setSelectedUsuarioId(usuarioId);
    setResponsableOpen(false);
    onUsuarioChange(usuarioId); // Pasa el ID al componente padre
  };

  const handleLimpiar = () => {
    handleUsuarioSelect("Todos"); // Llama al handler con "Todos"
  };

  // 8. Helper para buscar el *nombre* del usuario basado en el *ID* guardado
  const getSelectedUsuarioNombre = () => {
    if (selectedUsuarioId === "Todos") return "Todos";
    // Busca en la lista de usuarios el que coincida con el ID
    const usuario = usuarios.find((u) => u.id.toString() === selectedUsuarioId);
    // Devuelve el nombre, o "Todos" si algo falla
    return usuario ? usuario.nombre : "Todos";
  };

  if (!user || user.rol === Rol.INVITADO) {
    return null;
  }

  return (
    <div className="w-full bg-white font-sans p-3 md:p-4 border-b border-gray-200">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* 🔹 Grupo de filtros */}
        <div
          className={`flex gap-2 ${
            responsableOpen ? "overflow-visible" : "overflow-x-auto"
          } md:overflow-visible pb-2 md:pb-0 scrollbar-hide`}
        >
          {/* 🔸 Filtro Responsable (Actualizado a Usuarios) */}
          <div className="relative flex-shrink-0" ref={responsableRef}>
            <button
              onClick={() => setResponsableOpen(!responsableOpen)}
              disabled={loading}
              className="flex items-center whitespace-nowrap 
                        text-gray-700 bg-transparent border-none 
                        md:border md:bg-white md:hover:bg-gray-100 
                        focus:outline-none font-medium 
                        rounded-none md:rounded-lg text-sm px-2 md:px-3 py-1.5
                        disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              Responsable:{" "}
              <span className="ml-1 font-semibold text-amber-800">
                {loading ? "Cargando..." : getSelectedUsuarioNombre()}
              </span>
              <svg
                className="w-3 h-3 ml-1 md:ml-2"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 10 6"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m1 1 4 4 4-4"
                />
              </svg>
            </button>

            {responsableOpen && (
              <div className="absolute left-0 mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-44 z-50">
                <ul className="py-1 text-sm text-gray-700">
                  <li>
                    <button
                      // 10. Seleccionar "Todos"
                      onClick={() => handleUsuarioSelect("Todos")}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Todos
                    </button>
                  </li>
                  {/* 11. Mapear la lista de objetos 'Usuario' */}
                  {usuarios.map((usuario) => (
                    <li key={usuario.id}>
                      <button
                        // 12. Seleccionar el ID del usuario (convertido a string)
                        onClick={() =>
                          handleUsuarioSelect(usuario.id.toString())
                        }
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        {usuario.nombre} {/* Mostrar el nombre */}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* 🔸 Botón limpiar */}
          {/* 13. Lógica de "limpiar" basada en el ID */}
          {selectedUsuarioId !== "Todos" && (
            <button
              onClick={handleLimpiar}
              type="button"
              className="inline-flex items-center gap-1.5 whitespace-nowrap
                         text-red-600 border border-red-200 bg-white
                         hover:bg-red-50 active:bg-red-100
                         focus:outline-none focus:ring-2 focus:ring-red-200
                         font-medium rounded-full text-sm px-3 py-1.5 transition"
              aria-label="Limpiar filtros de responsable"
            >
              <svg
                className="w-4 h-4 -ml-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* 🔹 Buscador (sin cambios, es correcto) */}
        <form className="relative flex-shrink-0 w-full md:w-64">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>
          <input
            type="text"
            name="q"
            placeholder="Buscar actividad..."
            onChange={(e) => onBuscarChange?.(e.target.value)}
            className="block w-full p-2 pl-9 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-amber-500 focus:border-amber-500"
          />
        </form>
      </div>
    </div>
  );
};

export default Filtros;
