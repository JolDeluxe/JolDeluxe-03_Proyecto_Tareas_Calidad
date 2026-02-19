// 📍 src/components/Admin/FiltrosAdminMobile.tsx

import React, { useState, useRef, useEffect } from "react";
import type { Usuario } from "../../types/usuario";
import type { RangoFechaEspecial } from "../../pages/Admin";

// ✅ Helpers de Fechas
const getEstaSemana = () => {
  const hoy = new Date();
  const diaSemana = hoy.getDay();
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() + diffLunes);
  lunes.setHours(0, 0, 0, 0);

  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);

  return { inicio: lunes, fin: domingo };
};

const getHoy = () => {
  const i = new Date(); i.setHours(0, 0, 0, 0);
  const f = new Date(); f.setHours(23, 59, 59, 999);
  return { inicio: i, fin: f };
};

const getManana = () => {
  const i = new Date(); i.setDate(i.getDate() + 1); i.setHours(0, 0, 0, 0);
  const f = new Date(); f.setDate(f.getDate() + 1); f.setHours(23, 59, 59, 999);
  return { inicio: i, fin: f };
};

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
  filtroUrgencia: "TODAS" | "ALTA" | "MEDIA" | "BAJA";
  onUrgenciaChange: (val: "TODAS" | "ALTA" | "MEDIA" | "BAJA") => void;
  filtroExtra: "NINGUNO" | "ATRASADAS" | "CORRECCIONES" | "RETRASO" | "AUTOCOMPLETAR";
  onFiltroExtraChange: (val: "NINGUNO" | "ATRASADAS" | "CORRECCIONES" | "RETRASO" | "AUTOCOMPLETAR") => void;
  filtroActivo: string;
  totalTareas: number;
  filtroFechaRegistro: RangoFechaEspecial;
  filtroFechaLimite: RangoFechaEspecial;
  onFiltroFechaRegistroChange: (val: RangoFechaEspecial) => void;
  onFiltroFechaLimiteChange: (val: RangoFechaEspecial) => void;
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
  filtroFechaRegistro,
  filtroFechaLimite,
  onFiltroFechaRegistroChange,
  onFiltroFechaLimiteChange,
}) => {
  const [mostrarFiltrosMovil, setMostrarFiltrosMovil] = useState(false);

  // Estados y Refs para los dropdowns de fechas
  const [registroOpen, setRegistroOpen] = useState(false);
  const [limiteOpen, setLimiteOpen] = useState(false);
  const [customRangeReg, setCustomRangeReg] = useState({ in: "", fin: "" });
  const [customRangeLim, setCustomRangeLim] = useState({ in: "", fin: "" });

  const registroRef = useRef<HTMLDivElement>(null);
  const limiteRef = useRef<HTMLDivElement>(null);

  // ✅ Formateador de Fechas con Tamaños Estandarizados
  const formatearTextoFecha = (filtro: RangoFechaEspecial, defaultText: string) => {
    if (filtro.tipo === "TODAS") return <strong>{defaultText}</strong>;

    const formatoCorto = (d: Date) => d.toLocaleDateString("es-MX", { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formatoDia = (d: Date) => d.toLocaleDateString("es-MX", { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

    let label = "";
    let subLabel: React.ReactNode = "";

    if (filtro.tipo === "HOY") {
      label = "HOY";
      subLabel = formatoCorto(filtro.inicio!);
    } else if (filtro.tipo === "MANANA") {
      label = "MAÑANA";
      subLabel = formatoCorto(filtro.inicio!);
    } else if (filtro.tipo === "ESTA_SEMANA") {
      label = "ESTA SEMANA";
      subLabel = `del ${formatoDia(filtro.inicio!)} al ${formatoDia(filtro.fin!)}`;
    } else if (filtro.tipo === "PERSONALIZADO") {
      label = "PERSONALIZADO";
      if (filtro.inicio && filtro.fin) {
        if (filtro.inicio.toDateString() === filtro.fin.toDateString()) {
          subLabel = formatoCorto(filtro.inicio);
        } else {
          subLabel = (
            <>
              del {formatoCorto(filtro.inicio)} <br />
              al {formatoCorto(filtro.fin)}
            </>
          );
        }
      }
    }

    return (
      <div className="flex flex-col text-left ml-1 leading-tight">
        <strong className="text-xs leading-none">{label}</strong>
        {subLabel && <span className="text-[10px] font-normal opacity-80 mt-1 leading-none">{subLabel}</span>}
      </div>
    );
  };

  // Click Outside para cerrar calendarios
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (registroRef.current && !registroRef.current.contains(event.target as Node)) setRegistroOpen(false);
      if (limiteRef.current && !limiteRef.current.contains(event.target as Node)) setLimiteOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div className="block lg:hidden p-3">

      {/* ========================================================
          NIVEL 1: BÚSQUEDA Y PAPELERA (+ Botón de Filtros Extras)
          ======================================================== */}
      <div className="flex gap-2 items-center mb-3">
        {/* Buscador */}
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
            className="w-full pl-10 pr-10 py-2.5 h-[46px] text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none transition-shadow"
          />
          {searchText && (
            <button
              onClick={onLimpiarBusqueda}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Botón Papelera */}
        <button
          onClick={onToggleCanceladas}
          className={`
            flex-shrink-0 flex items-center justify-center rounded-lg border shadow-sm transition-all duration-200 h-[46px] w-[46px] cursor-pointer
            ${verCanceladas ? "bg-red-600 border-red-700 text-white shadow-md" : "bg-white border-gray-300 text-gray-500 hover:bg-red-50 hover:text-red-600"}
          `}
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
            <path d="M580-280h80q25 0 42.5-17.5T720-340v-160h40v-60H660v-40h-80v40H480v60h40v160q0 25 17.5 42.5T580-280Zm0-220h80v160h-80v-160ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z" />
          </svg>
        </button>

        {/* Botón Toggle Filtros */}
        <button
          onClick={() => setMostrarFiltrosMovil(!mostrarFiltrosMovil)}
          className={`flex-shrink-0 flex items-center justify-center rounded-lg border transition-colors cursor-pointer h-[46px] w-[46px] 
            ${mostrarFiltrosMovil || filtroExtra !== "NINGUNO" || filtroUrgencia !== "TODAS" || selectedUsuarioId !== "Todos" || filtroFechaRegistro.tipo !== "TODAS" || filtroFechaLimite.tipo !== "TODAS"
              ? "bg-amber-100 border-amber-300 text-amber-800"
              : "bg-white border-gray-300 text-gray-600"
            }`}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </button>
      </div>

      {/* 🔽 PANEL DE FILTROS DESPLEGABLE */}
      {mostrarFiltrosMovil && (
        <div className="flex flex-col gap-3 text-xs animate-fade-in-down bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-inner">

          {/* ========================================================
              NIVEL 2: RESPONSABLES Y PRIORIDAD
              ======================================================== */}
          <div className="flex gap-2 items-center w-full">
            {/* Responsable */}
            <div
              className={`
                relative flex-1 flex items-center justify-between h-[46px]
                rounded-lg border px-2.5 py-2 transition-colors cursor-pointer min-w-0 shadow-sm
                ${loading
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : selectedUsuarioId !== "Todos"
                    ? "bg-blue-100 border-blue-300 text-blue-900"
                    : "bg-white border-gray-300 text-gray-700"
                }
              `}
            >
              <span className="flex items-center text-xs font-bold truncate">
                <svg className="w-4 h-4 mr-1.5 opacity-70 flex-shrink-0" fill="currentColor" viewBox="0 -960 960 960">
                  <path d="M560-680v-80h320v80H560Zm0 160v-80h320v80H560Zm0 160v-80h320v80H560Zm-325-75q-35-35-35-85t35-85q35-35 85-35t85 35q35 35 35 85t-35 85q-35 35-85 35t-85-35ZM80-160v-76q0-21 10-40t28-30q45-27 95.5-40.5T320-360q56 0 106.5 13.5T522-306q18 11 28 30t10 40v76H80Zm86-80h308q-35-20-74-30t-80-10q-41 0-80 10t-74 30Zm182.5-251.5Q360-503 360-520t-11.5-28.5Q337-560 320-560t-28.5 11.5Q280-537 280-520t11.5 28.5Q303-480 320-480t28.5-11.5ZM320-520Zm0 280Z" />
                </svg>
                <span className="truncate">{loading ? "..." : (selectedUsuarioId === "Todos" ? "Responsable" : nombreResumido)}</span>
              </span>

              {selectedUsuarioId === "Todos" ? (
                <svg className="w-4 h-4 flex-shrink-0 text-gray-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <button
                  onClick={onLimpiarResponsable}
                  className="z-20 bg-blue-200/50 hover:bg-blue-300 rounded-full p-0.5 text-blue-800 flex-shrink-0 ml-1 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              <select
                disabled={loading}
                value={selectedUsuarioId}
                onChange={(e) => onUsuarioSelect(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              >
                <option value="Todos">Todos</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id.toString()}>{u.nombre}</option>
                ))}
              </select>
            </div>

            {/* Prioridad */}
            {!verCanceladas && (
              <div
                className={`
                  relative flex-1 flex items-center justify-between h-[46px]
                  rounded-lg border px-2.5 py-2 transition-colors cursor-pointer min-w-0 shadow-sm
                  ${filtroUrgencia !== "TODAS"
                    ? "bg-purple-100 border-purple-300 text-purple-900"
                    : "bg-white border-gray-300 text-gray-700"
                  }
                `}
              >
                <span className="flex items-center text-xs font-bold truncate">
                  <svg className="w-4 h-4 mr-1.5 opacity-70 flex-shrink-0" fill="currentColor" viewBox="0 -960 960 960">
                    <path d="M467-360Zm-24 80ZM320-440h80v-120q0-33 23.5-56.5T480-640v-80q-66 0-113 47t-47 113v120ZM160-120q-33 0-56.5-23.5T80-200v-80q0-33 23.5-56.5T160-360h40v-200q0-117 81.5-198.5T480-840q117 0 198.5 81.5T760-560v43q-10-2-19.5-2.5T720-520q-11 0-20.5.5T680-517v-43q0-83-58.5-141.5T480-760q-83 0-141.5 58.5T280-560v200h187q-9 19-15 39t-9 41H160v80h283q3 21 9 41t15 39H160Zm418.5 21.5Q520-157 520-240t58.5-141.5Q637-440 720-440t141.5 58.5Q920-323 920-240T861.5-98.5Q803-40 720-40T578.5-98.5ZM648-140l112-112v92h40v-160H640v40h92L620-168l28 28Z" />
                  </svg>
                  <span className="truncate">{filtroUrgencia === "TODAS" ? "Prioridad" : filtroUrgencia}</span>
                </span>

                {filtroUrgencia === "TODAS" ? (
                  <svg className="w-4 h-4 flex-shrink-0 text-gray-400 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onUrgenciaChange("TODAS"); }}
                    className="z-20 bg-purple-200/50 hover:bg-purple-300 rounded-full p-0.5 text-purple-800 flex-shrink-0 ml-1 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

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
          </div>

          {/* ========================================================
              NIVEL 3: FECHAS (ASIGNACIÓN Y LÍMITE)
              ======================================================== */}
          {!verCanceladas && (
            <div className="grid grid-cols-2 gap-2">

              {/* Filtro Asignación */}
              <div className="relative" ref={registroRef}>
                <button
                  onClick={() => setRegistroOpen(!registroOpen)}
                  className={`
                    flex items-center justify-between w-full gap-1 px-2.5 py-2 rounded-lg border shadow-sm transition-all h-[46px] cursor-pointer
                    ${filtroFechaRegistro.tipo !== "TODAS"
                      ? "bg-emerald-100 border-emerald-300 text-emerald-900 ring-1 ring-emerald-300"
                      : "bg-white border-gray-300 text-gray-700"
                    }
                  `}
                >
                  <span className="flex items-center flex-1 min-w-0">
                    <svg className="w-4 h-4 mr-1.5 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    {formatearTextoFecha(filtroFechaRegistro, "Asignación")}
                  </span>

                  {filtroFechaRegistro.tipo !== "TODAS" ? (
                    <div
                      role="button"
                      onClick={(e) => { e.stopPropagation(); onFiltroFechaRegistroChange({ tipo: "TODAS", inicio: null, fin: null }); }}
                      className="p-0.5 bg-emerald-200/50 hover:bg-emerald-300 rounded-full text-emerald-800 flex-shrink-0 cursor-pointer ml-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                  ) : (
                    <svg className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${registroOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  )}
                </button>

                {registroOpen && (
                  <div className="absolute top-full left-0 mt-2 w-[260px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-down">
                    <div className="flex flex-col py-1">
                      {[{ id: "HOY", label: "Hoy" }, { id: "ESTA_SEMANA", label: "Esta Semana" }, { id: "TODAS", label: "Cualquier Fecha" }].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (opt.id === "HOY") onFiltroFechaRegistroChange({ tipo: "HOY", ...getHoy() });
                            if (opt.id === "ESTA_SEMANA") onFiltroFechaRegistroChange({ tipo: "ESTA_SEMANA", ...getEstaSemana() });
                            if (opt.id === "TODAS") onFiltroFechaRegistroChange({ tipo: "TODAS", inicio: null, fin: null });
                            setRegistroOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-xs hover:bg-emerald-50 border-b border-gray-50 ${filtroFechaRegistro.tipo === opt.id ? "bg-emerald-50 font-bold text-emerald-900" : "text-gray-700"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                      <div className="p-4 bg-gray-50 flex flex-col gap-3">
                        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1.5 text-center">Rango Específico</span>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-500 font-bold uppercase pl-1">Desde</label>
                          <input type="date" className="text-xs border-gray-300 rounded-md p-2 w-full focus:ring-emerald-500 focus:border-emerald-500 shadow-sm" onChange={(e) => setCustomRangeReg(p => ({ ...p, in: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center pl-1 pr-1"><label className="text-[10px] text-gray-500 font-bold uppercase">Hasta</label><span className="text-[10px] text-gray-400 italic">Opcional</span></div>
                          <input type="date" className="text-xs border-gray-300 rounded-md p-2 w-full focus:ring-emerald-500 focus:border-emerald-500 shadow-sm" onChange={(e) => setCustomRangeReg(p => ({ ...p, fin: e.target.value }))} />
                        </div>
                        <button
                          disabled={!customRangeReg.in}
                          className={`mt-2 text-white text-xs py-2.5 rounded-md font-bold transition-all shadow-sm ${customRangeReg.in ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-300 cursor-not-allowed'}`}
                          onClick={() => {
                            const ini = new Date(customRangeReg.in + "T00:00:00");
                            const fin = customRangeReg.fin ? new Date(customRangeReg.fin + "T23:59:59") : new Date(customRangeReg.in + "T23:59:59");
                            onFiltroFechaRegistroChange({ tipo: "PERSONALIZADO", inicio: ini, fin: fin });
                            setRegistroOpen(false);
                          }}
                        >
                          {customRangeReg.fin ? "Aplicar Rango" : "Aplicar Fecha"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Filtro Límite */}
              <div className="relative" ref={limiteRef}>
                <button
                  onClick={() => setLimiteOpen(!limiteOpen)}
                  className={`
                    flex items-center justify-between w-full gap-1 px-2.5 py-2 rounded-lg border shadow-sm transition-all h-[46px] cursor-pointer
                    ${filtroFechaLimite.tipo !== "TODAS"
                      ? "bg-indigo-100 border-indigo-300 text-indigo-900 ring-1 ring-indigo-300"
                      : "bg-white border-gray-300 text-gray-700"
                    }
                  `}
                >
                  <span className="flex items-center flex-1 min-w-0">
                    <svg className="w-4 h-4 mr-1.5 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {formatearTextoFecha(filtroFechaLimite, "Límite")}
                  </span>

                  {filtroFechaLimite.tipo !== "TODAS" ? (
                    <div
                      role="button"
                      onClick={(e) => { e.stopPropagation(); onFiltroFechaLimiteChange({ tipo: "TODAS", inicio: null, fin: null }); }}
                      className="p-0.5 bg-indigo-200/50 hover:bg-indigo-300 rounded-full text-indigo-800 flex-shrink-0 cursor-pointer ml-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </div>
                  ) : (
                    <svg className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${limiteOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  )}
                </button>

                {limiteOpen && (
                  <div className="absolute top-full right-0 mt-2 w-[260px] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-down">
                    <div className="flex flex-col py-1">
                      {[{ id: "HOY", label: "Hoy" }, { id: "MANANA", label: "Mañana" }, { id: "ESTA_SEMANA", label: "Esta Semana" }, { id: "TODAS", label: "Cualquier Fecha" }].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (opt.id === "HOY") onFiltroFechaLimiteChange({ tipo: "HOY", ...getHoy() });
                            if (opt.id === "MANANA") onFiltroFechaLimiteChange({ tipo: "MANANA", ...getManana() });
                            if (opt.id === "ESTA_SEMANA") onFiltroFechaLimiteChange({ tipo: "ESTA_SEMANA", ...getEstaSemana() });
                            if (opt.id === "TODAS") onFiltroFechaLimiteChange({ tipo: "TODAS", inicio: null, fin: null });
                            setLimiteOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-xs hover:bg-indigo-50 border-b border-gray-50 ${filtroFechaLimite.tipo === opt.id ? "bg-indigo-50 font-bold text-indigo-900" : "text-gray-700"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                      <div className="p-4 bg-gray-50 flex flex-col gap-3">
                        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1.5 text-center">Rango Específico</span>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-gray-500 font-bold uppercase pl-1">Desde</label>
                          <input type="date" className="text-xs border-gray-300 rounded-md p-2 w-full focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" onChange={(e) => setCustomRangeLim(p => ({ ...p, in: e.target.value }))} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center pl-1 pr-1"><label className="text-[10px] text-gray-500 font-bold uppercase">Hasta</label><span className="text-[10px] text-gray-400 italic">Opcional</span></div>
                          <input type="date" className="text-xs border-gray-300 rounded-md p-2 w-full focus:ring-indigo-500 focus:border-indigo-500 shadow-sm" onChange={(e) => setCustomRangeLim(p => ({ ...p, fin: e.target.value }))} />
                        </div>
                        <button
                          disabled={!customRangeLim.in}
                          className={`mt-2 text-white text-xs py-2.5 rounded-md font-bold transition-all shadow-sm ${customRangeLim.in ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'}`}
                          onClick={() => {
                            const ini = new Date(customRangeLim.in + "T00:00:00");
                            const fin = customRangeLim.fin ? new Date(customRangeLim.fin + "T23:59:59") : new Date(customRangeLim.in + "T23:59:59");
                            onFiltroFechaLimiteChange({ tipo: "PERSONALIZADO", inicio: ini, fin: fin });
                            setLimiteOpen(false);
                          }}
                        >
                          {customRangeLim.fin ? "Aplicar Rango" : "Aplicar Fecha"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              NIVEL 4: FILTROS EXTRA (POR STATUS)
              ======================================================== */}
          {filtroActivo === "pendientes" && !verCanceladas && (
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => onFiltroExtraChange(filtroExtra === "ATRASADAS" ? "NINGUNO" : "ATRASADAS")}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-sm
                  ${filtroExtra === "ATRASADAS" ? "bg-red-100 border-red-300 text-red-800 ring-1 ring-red-300" : "bg-white border-gray-300 text-gray-600 hover:bg-red-50"}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4 fill-current"><path d="M200-640h560v-80H200v80Zm0 0v-80 80Zm0 560q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v227q-19-9-39-15t-41-9v-43H200v400h252q7 22 16.5 42T491-80H200Zm378.5-18.5Q520-157 520-240t58.5-141.5Q637-440 720-440t141.5 58.5Q920-323 920-240T861.5-98.5Q803-40 720-40T578.5-98.5ZM787-145l28-28-75-75v-112h-40v128l87 87Z" /></svg>
                Atrasadas {filtroExtra === "ATRASADAS" && `(${totalTareas})`}
              </button>

              <button
                onClick={() => onFiltroExtraChange(filtroExtra === "CORRECCIONES" ? "NINGUNO" : "CORRECCIONES")}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-sm
                  ${filtroExtra === "CORRECCIONES" ? "bg-amber-100 border-amber-300 text-amber-800 ring-1 ring-amber-300" : "bg-white border-gray-300 text-gray-600 hover:bg-amber-50"}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4 fill-current"><path d="M480-120q-33 0-56.5-23.5T400-200q0-33 23.5-56.5T480-280q33 0 56.5 23.5T560-200q0 33-23.5 56.5T480-120Zm-80-240h160v-400H400v400Z" /></svg>
                Correcciones {filtroExtra === "CORRECCIONES" && `(${totalTareas})`}
              </button>
            </div>
          )}

          {filtroActivo === "en_revision" && !verCanceladas && (
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => onFiltroExtraChange(filtroExtra === "RETRASO" ? "NINGUNO" : "RETRASO")}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-sm
                  ${filtroExtra === "RETRASO" ? "bg-red-100 border-red-300 text-red-800 ring-1 ring-red-300" : "bg-white border-gray-300 text-gray-600 hover:bg-red-50"}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4 fill-current"><path d="M200-640h560v-80H200v80Zm0 0v-80 80Zm0 560q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v227q-19-9-39-15t-41-9v-43H200v400h252q7 22 16.5 42T491-80H200Zm378.5-18.5Q520-157 520-240t58.5-141.5Q637-440 720-440t141.5 58.5Q920-323 920-240T861.5-98.5Q803-40 720-40T578.5-98.5ZM787-145l28-28-75-75v-112h-40v128l87 87Z" /></svg>
                Retraso {filtroExtra === "RETRASO" && `(${totalTareas})`}
              </button>

              <button
                onClick={() => onFiltroExtraChange(filtroExtra === "AUTOCOMPLETAR" ? "NINGUNO" : "AUTOCOMPLETAR")}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-sm
                  ${filtroExtra === "AUTOCOMPLETAR" ? "bg-orange-100 border-orange-300 text-orange-800 ring-1 ring-orange-300" : "bg-white border-gray-300 text-gray-600 hover:bg-orange-50"}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4 fill-current"><path d="M324-111.5Q251-143 197-197t-85.5-127Q80-397 80-480t31.5-156Q143-709 197-763t127-85.5Q397-880 480-880t156 31.5Q709-817 763-763t85.5 127Q880-563 880-480t-31.5 156Q817-251 763-197t-127 85.5Q563-80 480-80t-156-31.5ZM253-707l227 227v-320q-64 0-123 24t-104 69Z" /></svg>
                Autocompletar {filtroExtra === "AUTOCOMPLETAR" && `(${totalTareas})`}
              </button>
            </div>
          )}

          {filtroActivo === "concluidas" && !verCanceladas && (
            <div className="grid grid-cols-1 mt-1">
              <button
                onClick={() => onFiltroExtraChange(filtroExtra === "RETRASO" ? "NINGUNO" : "RETRASO")}
                className={`flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-sm
                  ${filtroExtra === "RETRASO" ? "bg-red-100 border-red-300 text-red-800 ring-1 ring-red-300" : "bg-white border-gray-300 text-gray-600 hover:bg-red-50"}
                `}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-4 h-4 fill-current"><path d="M200-640h560v-80H200v80Zm0 0v-80 80Zm0 560q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v227q-19-9-39-15t-41-9v-43H200v400h252q7 22 16.5 42T491-80H200Zm378.5-18.5Q520-157 520-240t58.5-141.5Q637-440 720-440t141.5 58.5Q920-323 920-240T861.5-98.5Q803-40 720-40T578.5-98.5ZM787-145l28-28-75-75v-112h-40v128l87 87Z" /></svg>
                Entrega Tardía {filtroExtra === "RETRASO" && `(${totalTareas})`}
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default FiltrosAdminMobile;