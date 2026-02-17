// 📍 src/components/Admin/FiltrosAdminDesktop.tsx

import React, { useState, useRef, useEffect } from "react";
import type { Usuario } from "../../types/usuario";

interface DesktopProps {
  usuarios: Usuario[];
  loading: boolean;
  selectedUsuarioId: string;
  nombreResumido: string;
  searchText: string;
  onUsuarioSelect: (id: string) => void;
  onLimpiarResponsable: (e?: React.MouseEvent) => void;
  onSearchChange: (val: string) => void;
  onLimpiarBusqueda: () => void;
  // ✅ Nuevas Props para Papelera
  verCanceladas: boolean;
  onToggleCanceladas: () => void;
}

const FiltrosAdminDesktop: React.FC<DesktopProps> = ({
  usuarios,
  loading,
  selectedUsuarioId,
  nombreResumido,
  searchText,
  onUsuarioSelect,
  onLimpiarResponsable,
  onSearchChange,
  onLimpiarBusqueda,
  verCanceladas,
  onToggleCanceladas,
}) => {
  const [responsableOpen, setResponsableOpen] = useState(false);
  const responsableRef = useRef<HTMLDivElement>(null);

  // Click Outside para cerrar el dropdown
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

  const handleSelectAndClose = (id: string) => {
    onUsuarioSelect(id);
    setResponsableOpen(false);
  };

  return (
    <div className="hidden lg:flex lg:items-center lg:justify-between gap-4 p-4 bg-white">
      {/* 🔹 SECCIÓN IZQUIERDA: FILTROS DE RESPONSABLE */}
      <div className="flex items-center gap-3" ref={responsableRef}>
        {/* 1. Dropdown Responsable */}
        <div className="relative">
          <button
            disabled={loading}
            onClick={() => setResponsableOpen(!responsableOpen)}
            className={`
              flex items-center justify-between gap-2 px-4 py-2.5 
              text-sm font-medium rounded-lg border shadow-sm transition-all min-w-[180px]
              cursor-pointer 
              ${loading
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
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
                  selectedUsuarioId !== "Todos"
                    ? "text-amber-700 ml-1"
                    : "font-normal ml-1"
                }
              >
                {loading ? "Cargando..." : nombreResumido}
              </strong>
            </span>

            {/* ICONO: Flecha abajo O Tachita si hay selección */}
            <div className="flex items-center">
              {selectedUsuarioId !== "Todos" && !loading ? (
                <div
                  role="button"
                  onClick={onLimpiarResponsable}
                  className="p-0.5 hover:bg-amber-200 rounded-full ml-2 text-amber-700 transition-colors cursor-pointer"
                  title="Limpiar filtro"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : (
                <svg
                  className={`w-4 h-4 ml-2 transition-transform ${responsableOpen ? "rotate-180" : ""} text-gray-400`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              )}
            </div>
          </button>

          {/* Menú Desplegable */}
          {responsableOpen && !loading && (
            <div className="absolute top-full left-0 mt-2 w-60 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
              <div className="max-h-72 overflow-y-auto py-1">
                <button
                  onClick={() => handleSelectAndClose("Todos")}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${selectedUsuarioId === "Todos"
                    ? "bg-gray-50 font-semibold text-gray-900"
                    : "text-gray-600"
                    }`}
                >
                  Todos
                </button>
                {usuarios.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectAndClose(u.id.toString())}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 transition-colors border-t border-gray-50 cursor-pointer ${selectedUsuarioId === u.id.toString()
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
      </div>

      {/* 🔹 SECCIÓN DERECHA: BOTÓN PAPELERA + BUSCADOR */}
      <div className="flex items-center gap-3">

        {/* ✅ BOTÓN PAPELERA CON TOOLTIP PERSONALIZADO */}
        <div className="group relative">
          <button
            onClick={onToggleCanceladas}
            className={`
              p-2.5 rounded-lg border shadow-sm transition-all duration-200 flex items-center justify-center cursor-pointer
              ${verCanceladas
                ? "bg-red-600 border-red-700 text-white shadow-md ring-2 ring-red-200"
                : "bg-white border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              }
            `}
          >
            {/* Nuevo SVG solicitado */}
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
              <path d="M580-280h80q25 0 42.5-17.5T720-340v-160h40v-60H660v-40h-80v40H480v60h40v160q0 25 17.5 42.5T580-280Zm0-220h80v160h-80v-160ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z" />
            </svg>
          </button>

          {/* Tooltip Estilizado */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {verCanceladas ? "Salir de Papelera" : "Ver Papelera"}
            {/* Triángulo del tooltip */}
            <div className="absolute top-full left-1/2 -ml-1.5 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>

        {/* BUSCADOR */}
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
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            className="
              block w-full pl-10 pr-10 py-2.5 
              text-sm text-gray-900 
              bg-gray-50 border border-gray-300 
              rounded-lg 
              focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:bg-white
              transition-all outline-none
            "
          />
          {searchText && (
            // Botón Limpiar Búsqueda con Tooltip
            <div className="absolute inset-y-0 right-0 flex items-center group">
              <button
                onClick={onLimpiarBusqueda}
                className="pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
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

              {/* Tooltip para Limpiar Búsqueda */}
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                Borrar búsqueda
                <div className="absolute top-full right-3 border-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FiltrosAdminDesktop;