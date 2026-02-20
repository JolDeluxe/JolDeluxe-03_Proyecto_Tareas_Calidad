// 📍 src/components/Pendientes/Filtros/FiltrosPendientesMobile.tsx

import React from "react";
import type { RangoFechaEspecial } from "../../../pages/Admin";

// Helper para calcular el inicio y fin del día de HOY
const getHoy = () => {
  const i = new Date(); i.setHours(0, 0, 0, 0);
  const f = new Date(); f.setHours(23, 59, 59, 999);
  return { inicio: i, fin: f };
};

interface MobileProps {
  searchText: string;
  onSearchChange: (val: string) => void;
  onLimpiarBusqueda: () => void;
  filtroFechaLimite: RangoFechaEspecial;
  onFiltroFechaLimiteChange: (val: RangoFechaEspecial) => void;
  [key: string]: any;
}

const FiltrosPendientesMobile: React.FC<MobileProps> = ({
  searchText,
  onSearchChange,
  onLimpiarBusqueda,
  filtroFechaLimite,
  onFiltroFechaLimiteChange,
}) => {

  const isHoyActivo = filtroFechaLimite.tipo === "HOY";

  const toggleHoy = () => {
    if (isHoyActivo) {
      onFiltroFechaLimiteChange({ tipo: "TODAS", inicio: null, fin: null });
    } else {
      onFiltroFechaLimiteChange({ tipo: "HOY", ...getHoy() });
    }
  };

  return (
    <div className="block lg:hidden p-3 bg-white">

      {/* Buscador + Botón HOY en la misma línea */}
      <div className="flex gap-2 items-center">

        {/* Buscador (Se expande automáticamente) */}
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 h-[46px] text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-shadow bg-gray-50"
          />
          {searchText && (
            <button onClick={onLimpiarBusqueda} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Botón HOY (Fijo a la derecha) */}
        <button
          onClick={toggleHoy}
          title="Ver tareas de Hoy"
          className={`
            flex-shrink-0 flex items-center justify-center gap-1.5 px-3 rounded-lg border transition-all h-[46px] font-bold text-xs shadow-sm cursor-pointer
            ${isHoyActivo
              ? "bg-blue-600 border-blue-700 text-white ring-2 ring-blue-200"
              : "bg-white border-gray-300 text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            }
          `}
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="22px" viewBox="0 -960 960 960" width="22px" fill="currentColor">
            <path d="M289-329q-29-29-29-71t29-71q29-29 71-29t71 29q29 29 29 71t-29 71q-29 29-71 29t-71-29ZM200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
          </svg>
          <span className="hidden sm:block">HOY</span>
        </button>

      </div>
    </div>
  );
};

export default FiltrosPendientesMobile;