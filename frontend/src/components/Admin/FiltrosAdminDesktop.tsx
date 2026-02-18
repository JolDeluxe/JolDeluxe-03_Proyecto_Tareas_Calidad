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
  verCanceladas: boolean;
  onToggleCanceladas: () => void;
  // ✅ Nuevas Props
  filtroUrgencia: "TODAS" | "ALTA" | "MEDIA" | "BAJA";
  onUrgenciaChange: (val: "TODAS" | "ALTA" | "MEDIA" | "BAJA") => void;
  filtroExtra: "NINGUNO" | "ATRASADAS" | "CORRECCIONES" | "RETRASO" | "AUTOCOMPLETAR";
  onFiltroExtraChange: (val: "NINGUNO" | "ATRASADAS" | "CORRECCIONES" | "RETRASO" | "AUTOCOMPLETAR") => void;
  filtroActivo: string;
  totalTareas: number;
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
  filtroUrgencia,
  onUrgenciaChange,
  filtroExtra,
  onFiltroExtraChange,
  filtroActivo,
  totalTareas,
}) => {
  const [responsableOpen, setResponsableOpen] = useState(false);
  const [urgenciaOpen, setUrgenciaOpen] = useState(false); // ✅ Estado dropdown urgencia

  const responsableRef = useRef<HTMLDivElement>(null);
  const urgenciaRef = useRef<HTMLDivElement>(null); // ✅ Ref dropdown urgencia

  // Click Outside para cerrar los dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Cerrar Responsable
      if (
        responsableRef.current &&
        !responsableRef.current.contains(event.target as Node)
      ) {
        setResponsableOpen(false);
      }
      // Cerrar Urgencia
      if (
        urgenciaRef.current &&
        !urgenciaRef.current.contains(event.target as Node)
      ) {
        setUrgenciaOpen(false);
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
      {/* 🔹 SECCIÓN IZQUIERDA: TODOS LOS FILTROS */}
      <div className="flex items-center gap-3">

        {/* 1. Dropdown Responsable */}
        <div className="relative" ref={responsableRef}>
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
                  ? "bg-blue-50 border-blue-200 text-blue-900"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }
            `}
            type="button"
          >
            <span>
              Responsable:{" "}
              <strong className={selectedUsuarioId !== "Todos" ? "text-blue-700 ml-1" : "font-normal ml-1"}>
                {loading ? "Cargando..." : nombreResumido}
              </strong>
            </span>

            {/* ICONO: Flecha abajo O Tachita si hay selección */}
            <div className="flex items-center">
              {selectedUsuarioId !== "Todos" && !loading ? (
                <div
                  role="button"
                  onClick={onLimpiarResponsable}
                  className="p-0.5 hover:bg-blue-200 rounded-full ml-2 text-blue-700 transition-colors cursor-pointer"
                  title="Limpiar filtro"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              ) : (
                <svg className={`w-4 h-4 ml-2 transition-transform ${responsableOpen ? "rotate-180" : ""} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              )}
            </div>
          </button>

          {/* Menú Desplegable Responsable */}
          {responsableOpen && !loading && (
            <div className="absolute top-full left-0 mt-2 w-60 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
              <div className="max-h-72 overflow-y-auto py-1">
                <button
                  onClick={() => handleSelectAndClose("Todos")}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors cursor-pointer ${selectedUsuarioId === "Todos" ? "bg-gray-50 font-semibold text-gray-900" : "text-gray-600"}`}
                >
                  Todos
                </button>
                {usuarios.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleSelectAndClose(u.id.toString())}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors border-t border-gray-50 cursor-pointer ${selectedUsuarioId === u.id.toString() ? "bg-blue-50 font-semibold text-blue-900" : "text-gray-600"}`}
                  >
                    {u.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ✅ 2. Selector de Urgencia (Con lógica de limpieza igualada) */}
        {/* Solo visible si NO estamos en papelera */}
        {!verCanceladas && (
          <div className="relative" ref={urgenciaRef}>
            <button
              onClick={() => setUrgenciaOpen(!urgenciaOpen)}
              className={`
              flex items-center justify-between gap-2 px-4 py-2.5 
              text-sm font-medium rounded-lg border shadow-sm transition-all min-w-[140px] cursor-pointer
              ${filtroUrgencia !== "TODAS"
                  ? "bg-purple-50 border-purple-200 text-purple-900 ring-1 ring-purple-200"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }
            `}
            >
              <span>
                Urgencia:
                <strong className="ml-1">
                  {filtroUrgencia === "TODAS" ? "Todas" : filtroUrgencia.charAt(0) + filtroUrgencia.slice(1).toLowerCase()}
                </strong>
              </span>

              {/* Icono Flecha o Tachita */}
              <div className="flex items-center">
                {filtroUrgencia !== "TODAS" ? (
                  <div
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUrgenciaChange("TODAS");
                    }}
                    className="p-0.5 hover:bg-purple-200 rounded-full ml-2 text-purple-700 transition-colors cursor-pointer"
                    title="Limpiar filtro"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                ) : (
                  <svg className={`w-4 h-4 ml-2 transition-transform ${urgenciaOpen ? "rotate-180" : ""} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                )}
              </div>
            </button>

            {/* Menú Desplegable Urgencia */}
            {urgenciaOpen && (
              <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                <div className="py-1">
                  {["TODAS", "ALTA", "MEDIA", "BAJA"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        onUrgenciaChange(opt as any);
                        setUrgenciaOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition-colors border-t border-gray-50 cursor-pointer 
                      ${filtroUrgencia === opt ? "bg-purple-50 font-bold text-purple-900" : "text-gray-600"}`}
                    >
                      {opt === "TODAS" ? "Todas" : opt.charAt(0) + opt.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}


        {/* ✅ 3. Filtros Extras: PENDIENTES - SOLO SI NO ES PAPELERA */}
        {filtroActivo === "pendientes" && !verCanceladas && (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300 animate-fade-in">
            {/* Botón Atrasadas */}
            <button
              onClick={() => onFiltroExtraChange(filtroExtra === "ATRASADAS" ? "NINGUNO" : "ATRASADAS")}
              className={`
                flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg border transition-all cursor-pointer select-none
                ${filtroExtra === "ATRASADAS"
                  ? "bg-red-100 border-red-300 text-red-800 shadow-inner"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 shadow-sm"
                }
              `}
              title="Ver solo tareas pendientes y vencidas"
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
                flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg border transition-all cursor-pointer select-none
                ${filtroExtra === "CORRECCIONES"
                  ? "bg-amber-100 border-amber-300 text-amber-800 shadow-inner"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 shadow-sm"
                }
              `}
              title="Ver tareas que requieren corrección"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4 fill-current">
                <path d="M480-120q-33 0-56.5-23.5T400-200q0-33 23.5-56.5T480-280q33 0 56.5 23.5T560-200q0 33-23.5 56.5T480-120Zm-80-240h160v-400H400v400Z" />
              </svg>
              Correcciones
              {filtroExtra === "CORRECCIONES" && <span className="ml-1">({totalTareas})</span>}
            </button>
          </div>
        )}

        {/* ✅ 4. Filtros Extras: EN REVISIÓN - SOLO SI NO ES PAPELERA */}
        {filtroActivo === "en_revision" && !verCanceladas && (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300 animate-fade-in">
            {/* Botón Retraso (Usa el mismo estilo que Atrasadas) */}
            <button
              onClick={() => onFiltroExtraChange(filtroExtra === "RETRASO" ? "NINGUNO" : "RETRASO")}
              className={`
                flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg border transition-all cursor-pointer select-none
                ${filtroExtra === "RETRASO"
                  ? "bg-red-100 border-red-300 text-red-800 shadow-inner"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 shadow-sm"
                }
              `}
              title="Ver entregadas con retraso"
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
                flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg border transition-all cursor-pointer select-none
                ${filtroExtra === "AUTOCOMPLETAR"
                  ? "bg-orange-100 border-orange-300 text-orange-800 shadow-inner"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 shadow-sm"
                }
              `}
              title="Próximas a autocompletarse"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4 fill-current">
                <path d="M324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880t156 31.5Q709-817 763-763t85.5 127Q880-563 880-480t-31.5 156Q817-251 763-197t-127 85.5Q563-80 480-80t-156-31.5ZM253-707l227 227v-320q-64 0-123 24t-104 69Z" />
              </svg>
              Por Autocompletar
              {filtroExtra === "AUTOCOMPLETAR" && <span className="ml-1">({totalTareas})</span>}
            </button>
          </div>
        )}

        {/* ✅ 5. Filtros Extras: CONCLUIDAS - SOLO SI NO ES PAPELERA */}
        {filtroActivo === "concluidas" && !verCanceladas && (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300 animate-fade-in">
            {/* Botón Entrega Tardía */}
            <button
              onClick={() => onFiltroExtraChange(filtroExtra === "RETRASO" ? "NINGUNO" : "RETRASO")}
              className={`
                flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg border transition-all cursor-pointer select-none
                ${filtroExtra === "RETRASO"
                  ? "bg-red-100 border-red-300 text-red-800 shadow-inner"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 shadow-sm"
                }
              `}
              title="Ver tareas que se entregaron o concluyeron después de la fecha límite"
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

      {/* 🔹 SECCIÓN DERECHA: BOTÓN PAPELERA + BUSCADOR */}
      <div className="flex items-center gap-3">

        {/* Botón Papelera */}
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
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
              <path d="M580-280h80q25 0 42.5-17.5T720-340v-160h40v-60H660v-40h-80v40H480v60h40v160q0 25 17.5 42.5T580-280Zm0-220h80v160h-80v-160ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z" />
            </svg>
          </button>

          {/* Tooltip Papelera */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {verCanceladas ? "Salir de Papelera" : "Ver Papelera"}
            <div className="absolute top-full left-1/2 -ml-1.5 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>

        {/* Buscador */}
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

              {/* Tooltip Borrar Búsqueda */}
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