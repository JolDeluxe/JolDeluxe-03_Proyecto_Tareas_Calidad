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
  verCanceladas: boolean;
  onToggleCanceladas: () => void;
  // ✅ Nuevas Props
  filtroUrgencia: "TODAS" | "ALTA" | "MEDIA" | "BAJA";
  onUrgenciaChange: (val: "TODAS" | "ALTA" | "MEDIA" | "BAJA") => void;
  filtroExtra: "NINGUNO" | "ATRASADAS" | "CORRECCIONES" | "RETRASO" | "AUTOCOMPLETAR";
  onFiltroExtraChange: (val: "NINGUNO" | "ATRASADAS" | "CORRECCIONES" | "RETRASO" | "AUTOCOMPLETAR") => void;
  filtroActivo: string;
  totalTareas: number; // ✅ Nueva Prop para mostrar el conteo
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
  filtroUrgencia,
  onUrgenciaChange,
  filtroExtra,
  onFiltroExtraChange,
  filtroActivo,
  totalTareas,
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

      {/* 🔽 PANEL DE FILTROS DESPLEGABLE */}
      {mostrarFiltrosMovil && (
        <div className="flex flex-col gap-2 animate-fade-in-down bg-gray-50 p-3 rounded-lg border border-gray-200">

          {/* FILA 1: Responsable + Urgencia + Papelera */}
          <div className="flex gap-2 items-center w-full">

            {/* 1. Filtro Responsable */}
            <div
              className={`
                relative flex-1 flex items-center justify-between 
                rounded-lg border px-3 py-2 transition-colors cursor-pointer min-w-0
                ${loading
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : selectedUsuarioId !== "Todos"
                    ? "bg-amber-100 border-amber-300 text-amber-900"
                    : "bg-white border-gray-300 text-gray-700"
                }
              `}
            >
              <span className="text-xs font-bold truncate">
                {loading ? "..." : (selectedUsuarioId === "Todos" ? "Responsable" : nombreResumido)}
              </span>

              {/* Icono o Tachita */}
              {selectedUsuarioId === "Todos" ? (
                <svg
                  className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <button
                  onClick={onLimpiarResponsable}
                  className="z-20 bg-amber-200/50 hover:bg-amber-200 rounded-full p-0.5 text-amber-800 flex-shrink-0 ml-1 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* SELECT NATIVO */}
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

            {/* ✅ 2. Selector de Urgencia (DISEÑO IGUALADO) - Solo si NO es papelera */}
            {!verCanceladas && (
              <div
                className={`
                relative flex-1 flex items-center justify-between 
                rounded-lg border px-3 py-2 transition-colors cursor-pointer min-w-0
                ${filtroUrgencia !== "TODAS"
                    ? "bg-purple-100 border-purple-300 text-purple-900"
                    : "bg-white border-gray-300 text-gray-700"
                  }
              `}
              >
                <span className="text-xs font-bold truncate">
                  {filtroUrgencia === "TODAS" ? "Urgencia" : filtroUrgencia}
                </span>

                {/* Icono o Tachita */}
                {filtroUrgencia === "TODAS" ? (
                  <svg
                    className="w-3.5 h-3.5 flex-shrink-0 text-gray-400 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUrgenciaChange("TODAS"); }}
                    className="z-20 bg-purple-200/50 hover:bg-purple-200 rounded-full p-0.5 text-purple-800 flex-shrink-0 ml-1 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* SELECT NATIVO URGENCIA */}
                <select
                  value={filtroUrgencia}
                  onChange={(e) => onUrgenciaChange(e.target.value as any)}
                  className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                >
                  <option value="TODAS">Todas</option>
                  <option value="ALTA">Alta</option>
                  <option value="MEDIA">Media</option>
                  <option value="BAJA">Baja</option>
                </select>
              </div>
            )}

            {/* 3. Botón Papelera */}
            <button
              onClick={onToggleCanceladas}
              className={`
                p-2 rounded-lg border shadow-sm transition-all duration-200 flex-shrink-0 flex items-center justify-center cursor-pointer h-[40px] w-[40px]
                ${verCanceladas
                  ? "bg-red-600 border-red-700 text-white shadow-md"
                  : "bg-white border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600"
                }
              `}
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                <path d="M580-280h80q25 0 42.5-17.5T720-340v-160h40v-60H660v-40h-80v40H480v60h40v160q0 25 17.5 42.5T580-280Zm0-220h80v160h-80v-160ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z" />
              </svg>
            </button>
          </div>

          {/* FILA 2: Botones Extras - PENDIENTES - SOLO SI NO ES PAPELERA */}
          {filtroActivo === "pendientes" && !verCanceladas && (
            <div className="grid grid-cols-2 gap-2 mt-1">
              {/* Botón Atrasadas */}
              <button
                onClick={() => onFiltroExtraChange(filtroExtra === "ATRASADAS" ? "NINGUNO" : "ATRASADAS")}
                className={`
                  flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-sm
                  ${filtroExtra === "ATRASADAS"
                    ? "bg-red-100 border-red-300 text-red-800 ring-1 ring-red-300"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-red-50"
                  }
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4 fill-current">
                  <path d="M200-640h560v-80H200v80Zm0 0v-80 80Zm0 560q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v227q-19-9-39-15t-41-9v-43H200v400h252q7 22 16.5 42T491-80H200Zm378.5-18.5Q520-157 520-240t58.5-141.5Q637-440 720-440t141.5 58.5Q920-323 920-240T861.5-98.5Q803-40 720-40T578.5-98.5ZM787-145l28-28-75-75v-112h-40v128l87 87Z" />
                </svg>
                Atrasadas
                {filtroExtra === "ATRASADAS" && <span className="ml-1">({totalTareas})</span>}
              </button>

              {/* Botón Correcciones */}
              <button
                onClick={() => onFiltroExtraChange(filtroExtra === "CORRECCIONES" ? "NINGUNO" : "CORRECCIONES")}
                className={`
                  flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-sm
                  ${filtroExtra === "CORRECCIONES"
                    ? "bg-amber-100 border-amber-300 text-amber-800 ring-1 ring-amber-300"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-amber-50"
                  }
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4 fill-current">
                  <path d="M480-120q-33 0-56.5-23.5T400-200q0-33 23.5-56.5T480-280q33 0 56.5 23.5T560-200q0 33-23.5 56.5T480-120Zm-80-240h160v-400H400v400Z" />
                </svg>
                Correcciones
                {filtroExtra === "CORRECCIONES" && <span className="ml-1">({totalTareas})</span>}
              </button>
            </div>
          )}

          {/* ✅ FILA 2: Botones Extras - EN REVISIÓN - SOLO SI NO ES PAPELERA */}
          {filtroActivo === "en_revision" && !verCanceladas && (
            <div className="grid grid-cols-2 gap-2 mt-1">
              {/* Botón Retraso */}
              <button
                onClick={() => onFiltroExtraChange(filtroExtra === "RETRASO" ? "NINGUNO" : "RETRASO")}
                className={`
                  flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-sm
                  ${filtroExtra === "RETRASO"
                    ? "bg-red-100 border-red-300 text-red-800 ring-1 ring-red-300"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-red-50"
                  }
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4 fill-current">
                  <path d="M200-640h560v-80H200v80Zm0 0v-80 80Zm0 560q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v227q-19-9-39-15t-41-9v-43H200v400h252q7 22 16.5 42T491-80H200Zm378.5-18.5Q520-157 520-240t58.5-141.5Q637-440 720-440t141.5 58.5Q920-323 920-240T861.5-98.5Q803-40 720-40T578.5-98.5ZM787-145l28-28-75-75v-112h-40v128l87 87Z" />
                </svg>
                Retraso
                {filtroExtra === "RETRASO" && <span className="ml-1">({totalTareas})</span>}
              </button>

              {/* Botón Por Autocompletar */}
              <button
                onClick={() => onFiltroExtraChange(filtroExtra === "AUTOCOMPLETAR" ? "NINGUNO" : "AUTOCOMPLETAR")}
                className={`
                  flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-sm
                  ${filtroExtra === "AUTOCOMPLETAR"
                    ? "bg-orange-100 border-orange-300 text-orange-800 ring-1 ring-orange-300"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-orange-50"
                  }
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4 fill-current">
                  <path d="M324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880t156 31.5Q709-817 763-763t85.5 127Q880-563 880-480t-31.5 156Q817-251 763-197t-127 85.5Q563-80 480-80t-156-31.5ZM253-707l227 227v-320q-64 0-123 24t-104 69Z" />
                </svg>
                Por Autocompletar
                {filtroExtra === "AUTOCOMPLETAR" && <span className="ml-1">({totalTareas})</span>}
              </button>
            </div>
          )}

          {/* ✅ FILA 3: Botones Extras - CONCLUIDAS - SOLO SI NO ES PAPELERA */}
          {filtroActivo === "concluidas" && !verCanceladas && (
            <div className="grid grid-cols-1 mt-1">
              {/* Botón Entrega Tardía */}
              <button
                onClick={() => onFiltroExtraChange(filtroExtra === "RETRASO" ? "NINGUNO" : "RETRASO")}
                className={`
                  flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-sm
                  ${filtroExtra === "RETRASO"
                    ? "bg-red-100 border-red-300 text-red-800 ring-1 ring-red-300"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-red-50"
                  }
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4 fill-current">
                  <path d="M200-640h560v-80H200v80Zm0 0v-80 80Zm0 560q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v227q-19-9-39-15t-41-9v-43H200v400h252q7 22 16.5 42T491-80H200Zm378.5-18.5Q520-157 520-240t58.5-141.5Q637-440 720-440t141.5 58.5Q920-323 920-240T861.5-98.5Q803-40 720-40T578.5-98.5ZM787-145l28-28-75-75v-112h-40v128l87 87Z" />
                </svg>
                Entrega Tardía
                {filtroExtra === "RETRASO" && <span className="ml-1">({totalTareas})</span>}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FiltrosAdminMobile;