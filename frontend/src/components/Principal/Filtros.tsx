import React, { useState, useRef, useEffect } from "react";
import { usuariosService } from "../../api/usuarios.service";
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";

interface FiltrosProps {
  onUsuarioChange: (usuarioId: string) => void;
  onBuscarChange?: (query: string) => void;
  user: Usuario | null; // 🔹 Se recibe el 'user' como prop
}

const Filtros: React.FC<FiltrosProps> = ({
  onUsuarioChange,
  onBuscarChange,
  user, // 🔹 Se usa el 'user' de las props
}) => {
  const [responsableOpen, setResponsableOpen] = useState(false);
  const [selectedUsuarioId, setSelectedUsuarioId] = useState("Todos");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const responsableRef = useRef<HTMLDivElement>(null);

  // 🔹 useEffect actualizado para filtrar la lista de usuarios según el rol
  useEffect(() => {
    const fetchUsuarios = async () => {
      // Si no hay usuario, o si el usuario es INVITADO, no hay nada que cargar.
      if (!user || user.rol === Rol.INVITADO) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 1. Obtenemos todos los usuarios activos
        const data = await usuariosService.getAll();

        let listaFiltrada: Usuario[] = [];

        // 2. Definimos los roles de gestión
        const esGestion = ["SUPER_ADMIN", "ADMIN", "ENCARGADO"].includes(
          user.rol
        );

        if (esGestion) {
          // 3. Si es Gestión, puede ver a todos los usuarios
          listaFiltrada = data;
        } else if (user.rol === Rol.USUARIO) {
          // 4. Si es USUARIO, solo ve a otros USUARIOs
          //    (y opcionalmente, que pertenezcan a su mismo departamento)
          listaFiltrada = data.filter(
            (u) =>
              u.rol === Rol.USUARIO && u.departamentoId === user.departamentoId
          );
        }

        // 5. Ordenamos la lista resultante
        const listaOrdenada = listaFiltrada.sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        );

        setUsuarios(listaOrdenada);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, [user]); // 🔹 El 'user' es la dependencia. Si cambia, la lista se recalcula.

  // Hook para cerrar el dropdown (sin cambios, pero ahora usa el 'user' de las props)
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
  }, []); // 🔹 Dependencia de 'user' eliminada, no es necesaria aquí.

  const handleUsuarioSelect = (usuarioId: string) => {
    setSelectedUsuarioId(usuarioId);
    setResponsableOpen(false);
    onUsuarioChange(usuarioId);
  };

  const handleLimpiar = () => {
    handleUsuarioSelect("Todos");
  };

  const getSelectedUsuarioNombre = () => {
    if (selectedUsuarioId === "Todos") return "Todos";
    const usuario = usuarios.find((u) => u.id.toString() === selectedUsuarioId);
    return usuario ? usuario.nombre : "Todos";
  };

  // 🔹 Lógica de ocultar para INVITADO (¡Esta ya estaba correcta!)
  if (!user || user.rol === Rol.INVITADO) {
    return null; // No muestra nada si es INVITADO o si no hay usuario
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
          <div
            className="relative flex-shrink-0 hidden lg:block"
            ref={responsableRef}
          >
            <button
              onClick={() => setResponsableOpen(!responsableOpen)}
              disabled={loading}
              className="flex items-center whitespace-nowrap 
               text-gray-700 md:border md:bg-white md:hover:bg-gray-100 
               focus:outline-none font-medium 
               rounded-lg text-sm px-3 py-1.5
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

            {/* Menú Dropdown de Escritorio (tu código original) */}
            {responsableOpen && (
              <div className="absolute left-0 mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow-lg w-44 z-50">
                {/* Añadí max-h-60 y overflow-y-auto por si la lista es muy larga */}
                <ul className="py-1 text-sm text-gray-700 max-h-60 overflow-y-auto">
                  <li>
                    <button
                      onClick={() => handleUsuarioSelect("Todos")}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Todos
                    </button>
                  </li>
                  {usuarios.map((usuario) => (
                    <li key={usuario.id}>
                      <button
                        onClick={() =>
                          handleUsuarioSelect(usuario.id.toString())
                        }
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        {usuario.nombre}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="relative flex-shrink-0 block lg:hidden">
            <select
              value={selectedUsuarioId}
              onChange={(e) => handleUsuarioSelect(e.target.value)}
              disabled={loading}
              className="flex items-center whitespace-nowrap 
               text-gray-700 bg-transparent border-none 
               focus:outline-none font-medium 
               rounded-none text-sm px-2 py-1.5
               disabled:opacity-50 disabled:cursor-not-allowed
               font-semibold text-amber-800"
              aria-label="Seleccionar responsable"
            >
              {loading ? (
                <option value={selectedUsuarioId}>Cargando...</option>
              ) : (
                <>
                  <option value="Todos">Responsable: Todos</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id} value={usuario.id.toString()}>
                      {usuario.nombre}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>
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
