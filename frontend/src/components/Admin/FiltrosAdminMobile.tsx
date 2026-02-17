// 📍 src/components/Admin/FiltrosAdminMobile.tsx

import React, { useState } from "react";
import type { Usuario } from "../../types/usuario";

interface MobileProps {
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

const FiltrosAdminMobile: React.FC<MobileProps> = ({
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
  const [mostrarFiltrosMovil, setMostrarFiltrosMovil] = useState(false);

  return (
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
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none transition-shadow"
          />
          {searchText && (
            <button
              onClick={onLimpiarBusqueda}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
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
        </div>
        <button
          onClick={() => setMostrarFiltrosMovil(!mostrarFiltrosMovil)}
          className={`p-2 rounded-lg border transition-colors cursor-pointer ${mostrarFiltrosMovil || searchText !== ""
            ? "bg-amber-100 border-amber-300 text-amber-800"
            : "bg-white border-gray-300 text-gray-600"
            }`}
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
              rounded-full border px-4 py-2 transition-colors cursor-pointer
              ${loading
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                : selectedUsuarioId !== "Todos"
                  ? "bg-amber-100 border-amber-300 text-amber-900"
                  : "bg-white border-gray-300 text-gray-700"
              }
            `}
          >
            <span className="text-sm font-bold text-blue-900 truncate max-w-[150px]">
              {loading ? "..." : nombreResumido}
            </span>

            {/* Icono o Tachita */}
            {selectedUsuarioId === "Todos" ? (
              <svg
                className="w-4 h-4 flex-shrink-0 text-gray-400 ml-2"
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
              <button
                onClick={onLimpiarResponsable}
                className="z-20 bg-amber-200/50 hover:bg-amber-200 rounded-full p-0.5 text-amber-800 flex-shrink-0 ml-2 cursor-pointer"
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

            {/* SELECT NATIVO INVISIBLE */}
            <select
              disabled={loading}
              value={selectedUsuarioId}
              onChange={(e) => onUsuarioSelect(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
            >
              <option value="Todos">Todos</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id.toString()}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* 2. ✅ Botón Papelera (Visible al expandir) */}
          <button
            onClick={onToggleCanceladas}
            className={`
              p-2 rounded-full border shadow-sm transition-all duration-200 flex-shrink-0 flex items-center justify-center cursor-pointer
              ${verCanceladas
                ? "bg-red-600 border-red-700 text-white shadow-md"
                : "bg-white border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600"
              }
            `}
          >
            {/* SVG Solicitado */}
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
              <path d="M580-280h80q25 0 42.5-17.5T720-340v-160h40v-60H660v-40h-80v40H480v60h40v160q0 25 17.5 42.5T580-280Zm0-220h80v160h-80v-160ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default FiltrosAdminMobile;