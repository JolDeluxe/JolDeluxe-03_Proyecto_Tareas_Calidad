// 📍 src/components/Pendientes/Filtros/FiltrosPendientesDesktop.tsx

import React from "react";
import type { RangoFechaEspecial } from "../../../pages/Admin";

// Helper para calcular el inicio y fin del día de HOY
const getHoy = () => {
  const i = new Date(); i.setHours(0, 0, 0, 0);
  const f = new Date(); f.setHours(23, 59, 59, 999);
  return { inicio: i, fin: f };
};

interface DesktopProps {
  searchText: string;
  onSearchChange: (val: string) => void;
  onLimpiarBusqueda: () => void;
  // Mantenemos todas las props de la interfaz para que TypeScript no marque error en el componente padre,
  // aunque ya no usemos los filtros de urgencia, responsables o extras aquí.
  filtroFechaLimite: RangoFechaEspecial;
  onFiltroFechaLimiteChange: (val: RangoFechaEspecial) => void;
  [key: string]: any;
}

const FiltrosPendientesDesktop: React.FC<DesktopProps> = ({
  searchText,
  onSearchChange,
  onLimpiarBusqueda,
  filtroFechaLimite,
  onFiltroFechaLimiteChange,
}) => {

  const isHoyActivo = filtroFechaLimite.tipo === "HOY";

  const toggleHoy = () => {
    if (isHoyActivo) {
      // Si ya estaba activo, lo quitamos
      onFiltroFechaLimiteChange({ tipo: "TODAS", inicio: null, fin: null });
    } else {
      // Si no estaba activo, aplicamos el filtro de HOY
      onFiltroFechaLimiteChange({ tipo: "HOY", ...getHoy() });
    }
  };

  return (
    <div className="hidden lg:flex lg:items-center lg:justify-between gap-4 p-4 bg-white">

      {/* 🔹 SECCIÓN IZQUIERDA: BOTÓN HOY */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleHoy}
          className={`
            flex items-center gap-2 px-5 py-2.5 text-sm font-extrabold rounded-lg border transition-all h-[46px] shadow-sm cursor-pointer
            ${isHoyActivo
              ? "bg-blue-600 border-blue-700 text-white ring-2 ring-blue-200"
              : "bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
            }
          `}
        >
          {/* Tu SVG personalizado */}
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
            <path d="M289-329q-29-29-29-71t29-71q29-29 71-29t71 29q29 29 29 71t-29 71q-29 29-71 29t-71-29ZM200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Z" />
          </svg>
          TAREAS DE HOY
        </button>
      </div>
    </div>
  );
};

export default FiltrosPendientesDesktop;