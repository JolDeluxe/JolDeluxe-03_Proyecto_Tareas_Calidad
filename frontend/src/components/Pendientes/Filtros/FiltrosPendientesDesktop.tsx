import React from "react";
import type { Usuario, Departamento } from "../../../types/usuario"; // 👈 Importamos el tipo Usuario y Departamento
import type { RangoFechaEspecial } from "../../../pages/Admin";

// Helper para calcular el inicio y fin del día de HOY
const getHoy = () => {
  const i = new Date(); i.setHours(0, 0, 0, 0);
  const f = new Date(); f.setHours(23, 59, 59, 999);
  return { inicio: i, fin: f };
};

interface DesktopProps {
  user?: Usuario | null;
  onProyectar?: () => void;
  searchText: string;
  onSearchChange: (val: string) => void;
  onLimpiarBusqueda: () => void;
  filtroFechaLimite: RangoFechaEspecial;
  onFiltroFechaLimiteChange: (val: RangoFechaEspecial) => void;
  filtroExterno: boolean;
  onFiltroExternoChange: (val: boolean) => void;
  conteoTareasExternas: number;
  esDeptoConExternasHabilitadas: boolean;
  esDesdeCalidad: boolean;
  departamentos: Departamento[];
  filtroDepartamento: number | "Todos";
  onDepartamentoChange: (deptoId: number | "Todos") => void;
  [key: string]: any;
}

const FiltrosPendientesDesktop: React.FC<DesktopProps> = ({
  user,
  onProyectar,
  searchText,
  onSearchChange,
  onLimpiarBusqueda,
  filtroFechaLimite,
  onFiltroFechaLimiteChange,
  filtroExterno,
  onFiltroExternoChange,
  conteoTareasExternas,
  esDeptoConExternasHabilitadas,
  esDesdeCalidad,
  departamentos,
  filtroDepartamento,
  onDepartamentoChange
}) => {

  const isHoyActivo = filtroFechaLimite.tipo === "HOY";

  // 👈 Verificamos si tiene permisos de Management
  const isManagementRole = user?.rol === "ADMIN" || user?.rol === "SUPER_ADMIN" || user?.rol === "ENCARGADO";

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

      {/* 🔹 SECCIÓN IZQUIERDA: BOTONES */}
      <div className="flex items-center gap-3">

        {/* BOTÓN TAREAS DE HOY */}
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

        {/* ====== BOTÓN FILTRO KAIZEN / EXTERNAS ====== */}
        {esDeptoConExternasHabilitadas && (
          <button
            onClick={() => onFiltroExternoChange(!filtroExterno)}
            className={`
              flex items-center gap-2 px-5 py-2.5 text-sm font-extrabold rounded-lg border transition-all h-[46px] shadow-sm cursor-pointer
              ${filtroExterno
                ? (esDesdeCalidad 
                  ? "bg-indigo-600 border-indigo-700 text-white ring-2 ring-indigo-200 font-black"
                  : "bg-amber-600 border-amber-700 text-white ring-2 ring-amber-200 font-black")
                : (esDesdeCalidad
                  ? "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold"
                  : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 font-bold")
              }
            `}
            title={`Filtrar tareas ${esDesdeCalidad ? "KAIZEN" : "externas"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
            {esDesdeCalidad ? "KAIZEN" : "EXTERNAS"}
            <span className={`
              ml-1 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full
              ${filtroExterno ? "bg-white/20 text-white" : (esDesdeCalidad ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-700")}
            `}>
              {conteoTareasExternas}
            </span>
          </button>
        )}

        {/* Departamento select (Visible only when filtroExterno is true) */}
        {(filtroExterno || esDesdeCalidad || (user && user.rol === "SUPER_ADMIN")) && (
          <div className="relative">
            <select
              value={filtroDepartamento}
              onChange={(e) => {
                const val = e.target.value;
                onDepartamentoChange(val === "Todos" ? "Todos" : Number(val));
              }}
              className={`
                flex items-center justify-between gap-2 px-4 py-2.5 
                text-sm font-medium rounded-lg border shadow-sm transition-all h-[46px] bg-white
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                cursor-pointer min-w-[180px]
                ${filtroDepartamento !== "Todos"
                  ? "bg-blue-50 border-blue-200 text-blue-900 font-semibold"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              <option value="Todos">Departamento: Todos</option>
              {departamentos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 🔹 BOTÓN PROYECTAR (SOLO PARA ADMIN Y ENCARGADOS) */}
        {isManagementRole && (
          <button
            onClick={onProyectar}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-extrabold rounded-lg border transition-all h-[46px] shadow-sm cursor-pointer bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 active:scale-95"
          >
            {/* Tu SVG personalizado */}
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
              <path d="M560-280h200v-200h-80v120H560v80ZM200-480h80v-120h120v-80H200v200Zm-40 320q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z" />
            </svg>
            PROYECTAR TAREAS DE HOY
          </button>
        )}
      </div>
    </div>
  );
};

export default FiltrosPendientesDesktop;