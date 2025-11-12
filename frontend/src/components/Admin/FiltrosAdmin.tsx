// 📍 src/components/Admin/FiltrosAdmin.tsx

import React, { useState, useRef, useEffect } from "react";
import { usuariosService } from "../../api/usuarios.service";
import type { Usuario } from "../../types/usuario";

interface FiltrosProps {
  onResponsableChange: (usuarioId: string) => void;
  onBuscarChange?: (query: string) => void;
  user: Usuario | null;
  onKaizenChange?: (isKaizen: boolean) => void;
}

const FiltrosAdmin: React.FC<FiltrosProps> = ({
  onResponsableChange,
  onBuscarChange,
  onKaizenChange,
  user,
}) => {
  // --- Estados ---
  const [selectedUsuarioId, setSelectedUsuarioId] = useState("Todos"); // ID seleccionado
  const [usuarios, setUsuarios] = useState<Usuario[]>([]); // Objetos Usuario completos
  const [isKaizenActive, setIsKaizenActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- UI ---
  const [responsableOpen, setResponsableOpen] = useState(false);
  const responsableRef = useRef<HTMLDivElement>(null);
  const [mostrarFiltrosMovil, setMostrarFiltrosMovil] = useState(false);
  const canShowKaizen =
    user?.rol === "SUPER_ADMIN" ||
    ((user?.rol === "ADMIN" || user?.rol === "ENCARGADO") &&
      user?.departamento?.nombre?.toUpperCase().includes("CALIDAD"));

  // 1. Cargar Usuarios (Dinámico: Todos vs Invitados)
  useEffect(() => {
    const fetchUsuarios = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const data = isKaizenActive
          ? await usuariosService.getInvitados()
          : await usuariosService.getAll();

        const listaOrdenada = data.sort((a, b) =>
          a.nombre.localeCompare(b.nombre)
        );
        setUsuarios(listaOrdenada);
      } catch (error) {
        console.error("Error al cargar usuarios:", error);
        setUsuarios([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, [user, isKaizenActive]);

  // 2. Click Outside
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
  }, []);

  // --- HANDLERS ---

  // Helper para mostrar el nombre aunque tengamos el ID seleccionado
  const getSelectedUsuarioNombre = () => {
    if (selectedUsuarioId === "Todos") return "Todos";
    const usuario = usuarios.find((u) => u.id.toString() === selectedUsuarioId);
    return usuario ? usuario.nombre : "Desconocido";
  };

  const handleUsuarioSelect = (id: string) => {
    setSelectedUsuarioId(id);
    setResponsableOpen(false);
    onResponsableChange(id);
  };

  const handleLimpiarResponsable = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedUsuarioId("Todos");
    onResponsableChange("Todos");
  };

  const toggleKaizen = () => {
    const newState = !isKaizenActive;
    setIsKaizenActive(newState);
    if (onKaizenChange) onKaizenChange(newState);

    if (newState) {
      setSelectedUsuarioId("Todos");
      onResponsableChange("Todos");
      setResponsableOpen(false);
    }
  };

  const handleLimpiarTodo = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedUsuarioId("Todos");
    onResponsableChange("Todos");
    setIsKaizenActive(false);
    if (onKaizenChange) onKaizenChange(false);
  };

  return (
    <div className="w-full bg-white font-sans border-b border-gray-200">
      {/* ============================================================
          💻 VISTA ESCRITORIO (>= 1024px) - ADMIN
         ============================================================ */}
      <div className="hidden lg:flex lg:items-center lg:justify-between gap-4 p-4 bg-white">
        {/* 🔹 SECCIÓN IZQUIERDA: FILTROS */}
        <div className="flex items-center gap-3" ref={responsableRef}>
          {/* 1. Dropdown Responsable */}
          <div className="relative">
            <button
              // 🔒 BLOQUEADO SI KAIZEN ESTÁ ACTIVO
              disabled={isKaizenActive || loading}
              onClick={() => setResponsableOpen(!responsableOpen)}
              className={`
                flex items-center justify-between gap-2 px-4 py-2.5 
                text-sm font-medium rounded-lg border shadow-sm transition-all
                ${
                  isKaizenActive || loading
                    ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed" // Estilo Deshabilitado
                    : selectedUsuarioId !== "Todos"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }
              `}
              type="button"
            >
              <span>
                Responsable:{" "}
                <strong
                  className={
                    !isKaizenActive && selectedUsuarioId !== "Todos"
                      ? "text-amber-700"
                      : "font-normal"
                  }
                >
                  {/* Helper para mostrar nombre basado en el ID seleccionado */}
                  {loading ? "Cargando..." : getSelectedUsuarioNombre()}
                </strong>
              </span>
              <svg
                className={`w-4 h-4 transition-transform ${
                  responsableOpen ? "rotate-180" : ""
                } ${isKaizenActive ? "text-gray-300" : "text-gray-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </button>

            {/* Menú Desplegable (Solo si NO está bloqueado) */}
            {responsableOpen && !isKaizenActive && !loading && (
              <div className="absolute top-full left-0 mt-2 w-60 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                <div className="max-h-72 overflow-y-auto py-1">
                  <button
                    onClick={() => handleUsuarioSelect("Todos")}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                      selectedUsuarioId === "Todos"
                        ? "bg-gray-50 font-semibold text-gray-900"
                        : "text-gray-600"
                    }`}
                  >
                    Todos
                  </button>
                  {/* Mapeamos objetos 'usuario' y usamos su ID */}
                  {usuarios.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleUsuarioSelect(u.id.toString())}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 transition-colors border-t border-gray-50 ${
                        selectedUsuarioId === u.id.toString()
                          ? "bg-amber-50 font-semibold text-amber-900"
                          : "text-gray-600"
                      }`}
                    >
                      {u.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Botón Toggle KAIZEN (SOLO VISIBLE SI TIENE PERMISOS) */}
          {canShowKaizen && (
            <button
              onClick={toggleKaizen}
              disabled={loading}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border shadow-sm transition-all
                ${
                  isKaizenActive
                    ? "bg-purple-600 border-purple-600 text-white hover:bg-purple-700 ring-2 ring-purple-100"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                }
              `}
            >
              {isKaizenActive ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
              )}
              <span>Filtro KAIZEN</span>
            </button>
          )}

          {/* 3. Botón Limpiar TODO (Solo si hay responsable seleccionado) */}
          {selectedUsuarioId !== "Todos" && (
            <button
              onClick={handleLimpiarTodo}
              className="
                group flex items-center gap-1.5 px-3 py-2 
                text-sm font-medium text-gray-500 
                hover:text-red-600 hover:bg-red-50 
                rounded-lg transition-colors
              "
              title="Limpiar filtros"
            >
              <svg
                className="w-4 h-4 transition-transform group-hover:rotate-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                ></path>
              </svg>
              <span className="hidden xl:inline">Limpiar</span>
            </button>
          )}
        </div>

        {/* 🔹 SECCIÓN DERECHA: BUSCADOR */}
        <div className="relative w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar tarea..."
            onChange={(e) => onBuscarChange?.(e.target.value)}
            className="
              block w-full pl-10 pr-4 py-2.5 
              text-sm text-gray-900 
              bg-gray-50 border border-gray-300 
              rounded-lg 
              focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white
              transition-all outline-none
            "
          />
        </div>
      </div>

      {/* ============================================================
          📱 VISTA MÓVIL (< 1024px) - ADMIN
         ============================================================ */}
      <div className="block lg:hidden p-3">
        {/* Barra Superior: Buscador + Toggle */}
        <div className="flex gap-2 items-center mb-3">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              onChange={(e) => onBuscarChange?.(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setMostrarFiltrosMovil(!mostrarFiltrosMovil)}
            className={`p-2 rounded-lg border transition-colors ${
              mostrarFiltrosMovil
                ? "bg-amber-100 border-amber-300 text-amber-800"
                : "bg-white border-gray-300 text-gray-600"
            }`}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </button>
        </div>

        {/* 🔽 PANEL DE FILTROS (Botones Chips) */}
        {mostrarFiltrosMovil && (
          <div className="flex gap-2 items-center animate-fade-in-down">
            {/* 1. Filtro Responsable (Chip con Select Nativo) */}
            <div
              className={`
                relative flex-1 flex items-center justify-between 
                rounded-full border px-4 py-2 transition-colors
                ${
                  isKaizenActive || loading
                    ? "bg-gray-100 border-gray-200 text-gray-400" // 🔒 Estilo Deshabilitado
                    : selectedUsuarioId !== "Todos"
                    ? "bg-amber-100 border-amber-300 text-amber-900"
                    : "bg-white border-gray-300 text-gray-700"
                }
              `}
            >
              {/* Texto visible (Usamos el helper para mostrar el nombre real) */}
              <span className="text-sm font-medium truncate mr-2">
                {loading ? "Cargando..." : getSelectedUsuarioNombre()}
              </span>

              {/* Icono */}
              {selectedUsuarioId === "Todos" || isKaizenActive ? (
                <svg
                  className={`w-4 h-4 flex-shrink-0 ${
                    isKaizenActive ? "text-gray-300" : "text-gray-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              ) : (
                // Botón 'X' para borrar
                <button
                  onClick={handleLimpiarResponsable}
                  className="z-20 bg-amber-200/50 hover:bg-amber-200 rounded-full p-0.5 text-amber-800 flex-shrink-0"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}

              {/* SELECT NATIVO INVISIBLE (ADMIN usa selectedUsuarioId y handleUsuarioSelect) */}
              <select
                disabled={isKaizenActive || loading} // 🔒 Bloqueo Lógico
                value={selectedUsuarioId}
                onChange={(e) => handleUsuarioSelect(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 z-10"
              >
                <option value="Todos">Todos</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id.toString()}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Filtro KAIZEN (SOLO VISIBLE SI TIENE PERMISOS) */}
            {canShowKaizen && (
              <button
                onClick={toggleKaizen}
                disabled={loading}
                className={`
                  flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors
                  ${
                    isKaizenActive
                      ? "bg-purple-100 border-purple-300 text-purple-900"
                      : "bg-white border-gray-300 text-gray-700"
                  }
                `}
              >
                <span>KAIZEN</span>
                {isKaizenActive && (
                  <div className="bg-purple-200/50 rounded-full p-0.5">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FiltrosAdmin;
