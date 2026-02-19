// 📍 src/components/Admin/FiltrosAdminDesktop.tsx

import React, { useState, useRef, useEffect } from "react";
import type { Usuario } from "../../types/usuario";
// ✅ IMPORTACIÓN CORREGIDA DEL TIPO DE FECHAS
import type { RangoFechaEspecial } from "../../pages/Admin";

// ✅ FUNCIONES HELPERS AGREGADAS AQUÍ PARA QUE EL COMPONENTE FUNCIONE
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
  filtroUrgencia: "TODAS" | "ALTA" | "MEDIA" | "BAJA";
  onUrgenciaChange: (val: "TODAS" | "ALTA" | "MEDIA" | "BAJA") => void;
  filtroExtra: "NINGUNO" | "ATRASADAS" | "CORRECCIONES" | "RETRASO" | "AUTOCOMPLETAR";
  onFiltroExtraChange: (val: "NINGUNO" | "ATRASADAS" | "CORRECCIONES" | "RETRASO" | "AUTOCOMPLETAR") => void;
  filtroActivo: string;
  totalTareas: number;
  // ✅ NUEVAS PROPS DECLARADAS CORRECTAMENTE
  filtroFechaRegistro: RangoFechaEspecial;
  filtroFechaLimite: RangoFechaEspecial;
  onFiltroFechaRegistroChange: (val: RangoFechaEspecial) => void;
  onFiltroFechaLimiteChange: (val: RangoFechaEspecial) => void;
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
  // ✅ NUEVAS PROPS RECIBIDAS AQUÍ
  filtroFechaRegistro,
  filtroFechaLimite,
  onFiltroFechaRegistroChange,
  onFiltroFechaLimiteChange,
}) => {
  const [responsableOpen, setResponsableOpen] = useState(false);
  const [urgenciaOpen, setUrgenciaOpen] = useState(false);

  // ✅ Estados para abrir/cerrar dropdowns de fechas
  const [registroOpen, setRegistroOpen] = useState(false);
  const [limiteOpen, setLimiteOpen] = useState(false);
  const [customRangeReg, setCustomRangeReg] = useState({ in: "", fin: "" });
  const [customRangeLim, setCustomRangeLim] = useState({ in: "", fin: "" });

  const responsableRef = useRef<HTMLDivElement>(null);
  const urgenciaRef = useRef<HTMLDivElement>(null);
  // ✅ REFS AÑADIDOS PARA CLICKS AFUERA
  const registroRef = useRef<HTMLDivElement>(null);
  const limiteRef = useRef<HTMLDivElement>(null);

  const formatearTextoFecha = (filtro: RangoFechaEspecial, defaultText: string) => {
    if (filtro.tipo === "TODAS") return <strong>{defaultText}</strong>;

    const formatoCorto = (d: Date) => d.toLocaleDateString("es-MX", { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formatoDia = (d: Date) => d.toLocaleDateString("es-MX", { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });

    let label = "";
    let subLabel: React.ReactNode = ""; // ✅ Ahora soporta código React para meter <br />

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
      label = "PERSONALIZADO"; // ✅ Se fuerza el título
      if (filtro.inicio && filtro.fin) {
        // Checamos si es el mismo día
        if (filtro.inicio.toDateString() === filtro.fin.toDateString()) {
          subLabel = formatoCorto(filtro.inicio);
        } else {
          // ✅ Metemos el <br /> para que se parta en dos líneas
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
        <strong className="text-xs">{label}</strong>
        {subLabel && <span className="text-[10px] font-normal opacity-80 -mt-0.5">{subLabel}</span>}
      </div>
    );
  };

  // ✅ CLICK OUTSIDE CORREGIDO INCLUYENDO FECHAS
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (responsableRef.current && !responsableRef.current.contains(event.target as Node)) {
        setResponsableOpen(false);
      }
      if (urgenciaRef.current && !urgenciaRef.current.contains(event.target as Node)) {
        setUrgenciaOpen(false);
      }
      if (registroRef.current && !registroRef.current.contains(event.target as Node)) {
        setRegistroOpen(false);
      }
      if (limiteRef.current && !limiteRef.current.contains(event.target as Node)) {
        setLimiteOpen(false);
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
      <div className="flex items-center flex-wrap gap-3">

        {/* 1. Dropdown Responsable */}
        <div className="relative" ref={responsableRef}>
          <button
            disabled={loading}
            onClick={() => setResponsableOpen(!responsableOpen)}
            className={`
              flex items-center justify-between gap-2 px-4 py-2.5 
              text-sm font-medium rounded-lg border shadow-sm transition-all min-w-[180px] h-[46px]
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
            <span className="flex items-center">
              {/* ✅ ICONO ADAPTADO PARA RESPONSABLE */}
              <svg className="w-4 h-4 mr-1.5 opacity-70" fill="currentColor" viewBox="0 -960 960 960">
                <path d="M560-680v-80h320v80H560Zm0 160v-80h320v80H560Zm0 160v-80h320v80H560Zm-325-75q-35-35-35-85t35-85q35-35 85-35t85 35q35 35 35 85t-35 85q-35 35-85 35t-85-35ZM80-160v-76q0-21 10-40t28-30q45-27 95.5-40.5T320-360q56 0 106.5 13.5T522-306q18 11 28 30t10 40v76H80Zm86-80h308q-35-20-74-30t-80-10q-41 0-80 10t-74 30Zm182.5-251.5Q360-503 360-520t-11.5-28.5Q337-560 320-560t-28.5 11.5Q280-537 280-520t11.5 28.5Q303-480 320-480t28.5-11.5ZM320-520Zm0 280Z" />
              </svg>
              Responsable:&nbsp;
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

        {/* 2. Selector de Urgencia */}
        {!verCanceladas && (
          <div className="relative" ref={urgenciaRef}>
            <button
              onClick={() => setUrgenciaOpen(!urgenciaOpen)}
              className={`
              flex items-center justify-between gap-2 px-4 py-2.5 
              text-sm font-medium rounded-lg border shadow-sm transition-all min-w-[140px] h-[46px] cursor-pointer
              ${filtroUrgencia !== "TODAS"
                  ? "bg-purple-50 border-purple-200 text-purple-900 ring-1 ring-purple-200"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }
            `}
            >
              <span className="flex items-center">
                {/* ✅ ICONO ADAPTADO PARA PRIORIDAD */}
                <svg className="w-4 h-4 mr-1.5 opacity-70" fill="currentColor" viewBox="0 -960 960 960">
                  <path d="M467-360Zm-24 80ZM320-440h80v-120q0-33 23.5-56.5T480-640v-80q-66 0-113 47t-47 113v120ZM160-120q-33 0-56.5-23.5T80-200v-80q0-33 23.5-56.5T160-360h40v-200q0-117 81.5-198.5T480-840q117 0 198.5 81.5T760-560v43q-10-2-19.5-2.5T720-520q-11 0-20.5.5T680-517v-43q0-83-58.5-141.5T480-760q-83 0-141.5 58.5T280-560v200h187q-9 19-15 39t-9 41H160v80h283q3 21 9 41t15 39H160Zm418.5 21.5Q520-157 520-240t58.5-141.5Q637-440 720-440t141.5 58.5Q920-323 920-240T861.5-98.5Q803-40 720-40T578.5-98.5ZM648-140l112-112v92h40v-160H640v40h92L620-168l28 28Z" />
                </svg>
                Prioridad:&nbsp;
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

        {/* ✅ FILTRO FECHA REGISTRO / ASIGNACIÓN */}
        <div className="relative" ref={registroRef}>
          <button
            onClick={() => setRegistroOpen(!registroOpen)}
            className={`
              flex items-center justify-between gap-2 px-4 py-2 text-sm font-medium rounded-lg border shadow-sm transition-all min-w-[160px] h-[46px] cursor-pointer
              ${filtroFechaRegistro.tipo !== "TODAS"
                ? "bg-emerald-50 border-emerald-200 text-emerald-900 ring-1 ring-emerald-200"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }
            `}
          >
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              Asignación:&nbsp;{formatearTextoFecha(filtroFechaRegistro, "Todas")}
            </span>

            {/* Icono Flecha o Tachita */}
            <div className="flex items-center ml-1">
              {filtroFechaRegistro.tipo !== "TODAS" ? (
                <div
                  role="button"
                  onClick={(e) => { e.stopPropagation(); onFiltroFechaRegistroChange({ tipo: "TODAS", inicio: null, fin: null }); }}
                  className="p-1 hover:bg-emerald-200 rounded-full text-emerald-700 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
              ) : (
                <svg className={`w-4 h-4 transition-transform ${registroOpen ? "rotate-180" : ""} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              )}
            </div>
          </button>

          {/* Dropdown Fecha Registro */}
          {registroOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
              <div className="flex flex-col py-1">
                {[
                  { id: "HOY", label: "Hoy" },
                  { id: "ESTA_SEMANA", label: "Esta Semana" },
                  { id: "TODAS", label: "Cualquier Fecha" }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (opt.id === "HOY") onFiltroFechaRegistroChange({ tipo: "HOY", ...getHoy() });
                      if (opt.id === "ESTA_SEMANA") onFiltroFechaRegistroChange({ tipo: "ESTA_SEMANA", ...getEstaSemana() });
                      if (opt.id === "TODAS") onFiltroFechaRegistroChange({ tipo: "TODAS", inicio: null, fin: null });
                      setRegistroOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors border-b border-gray-50 cursor-pointer ${filtroFechaRegistro.tipo === opt.id ? "bg-emerald-50 font-bold text-emerald-900" : "text-gray-600"}`}
                  >
                    {opt.label}
                  </button>
                ))}

                {/* Opción Personalizada con Inputs Mejorada (UX/UI) */}
                <div className="p-4 bg-gray-50 flex flex-col gap-3 border-t border-gray-200">

                  {/* Título de sección */}
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider text-center border-b border-gray-200 pb-1.5 mb-1">
                    Rango Específico
                  </span>

                  {/* Input Desde */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase pl-1">Desde</label>
                    <input
                      type="date"
                      className="text-sm border-gray-300 rounded-md p-1.5 w-full focus:ring-emerald-500 focus:border-emerald-500 shadow-sm transition-colors"
                      onChange={(e) => setCustomRangeReg(p => ({ ...p, in: e.target.value }))}
                    />
                  </div>

                  {/* Input Hasta */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center pl-1 pr-1">
                      <label className="text-[10px] text-gray-500 font-bold uppercase">Hasta</label>
                      <span className="text-[9px] text-gray-400 italic">Opcional</span>
                    </div>
                    <input
                      type="date"
                      className="text-sm border-gray-300 rounded-md p-1.5 w-full focus:ring-emerald-500 focus:border-emerald-500 shadow-sm transition-colors"
                      onChange={(e) => setCustomRangeReg(p => ({ ...p, fin: e.target.value }))}
                    />
                  </div>

                  {/* Botón Dinámico */}
                  <button
                    disabled={!customRangeReg.in}
                    className={`mt-2 text-white text-xs py-2 rounded-md font-bold shadow-sm transition-all duration-200
                      ${customRangeReg.in
                        ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-md cursor-pointer'
                        : 'bg-gray-300 cursor-not-allowed'}
                    `}
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

        {/* ✅ FILTRO FECHA LÍMITE (El que faltaba) */}
        <div className="relative" ref={limiteRef}>
          <button
            onClick={() => setLimiteOpen(!limiteOpen)}
            className={`
              flex items-center justify-between gap-2 px-4 py-2 text-sm font-medium rounded-lg border shadow-sm transition-all min-w-[160px] h-[46px] cursor-pointer
              ${filtroFechaLimite.tipo !== "TODAS"
                ? "bg-indigo-50 border-indigo-200 text-indigo-900 ring-1 ring-indigo-200"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }
            `}
          >
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Límite:&nbsp;{formatearTextoFecha(filtroFechaLimite, "Todas")}
            </span>

            {/* Icono Flecha o Tachita */}
            <div className="flex items-center ml-1">
              {filtroFechaLimite.tipo !== "TODAS" ? (
                <div
                  role="button"
                  onClick={(e) => { e.stopPropagation(); onFiltroFechaLimiteChange({ tipo: "TODAS", inicio: null, fin: null }); }}
                  className="p-1 hover:bg-indigo-200 rounded-full text-indigo-700 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
              ) : (
                <svg className={`w-4 h-4 transition-transform ${limiteOpen ? "rotate-180" : ""} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              )}
            </div>
          </button>

          {/* Dropdown Fecha Límite */}
          {limiteOpen && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
              <div className="flex flex-col py-1">
                {[
                  { id: "HOY", label: "Hoy" },
                  { id: "MANANA", label: "Mañana" },
                  { id: "ESTA_SEMANA", label: "Esta Semana" },
                  { id: "TODAS", label: "Cualquier Fecha" }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (opt.id === "HOY") onFiltroFechaLimiteChange({ tipo: "HOY", ...getHoy() });
                      if (opt.id === "MANANA") onFiltroFechaLimiteChange({ tipo: "MANANA", ...getManana() });
                      if (opt.id === "ESTA_SEMANA") onFiltroFechaLimiteChange({ tipo: "ESTA_SEMANA", ...getEstaSemana() });
                      if (opt.id === "TODAS") onFiltroFechaLimiteChange({ tipo: "TODAS", inicio: null, fin: null });
                      setLimiteOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors border-b border-gray-50 cursor-pointer ${filtroFechaLimite.tipo === opt.id ? "bg-indigo-50 font-bold text-indigo-900" : "text-gray-600"}`}
                  >
                    {opt.label}
                  </button>
                ))}

                {/* Opción Personalizada con Inputs Mejorada (UX/UI) */}
                <div className="p-4 bg-gray-50 flex flex-col gap-3 border-t border-gray-200">

                  {/* Título de sección */}
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider text-center border-b border-gray-200 pb-1.5 mb-1">
                    Rango Específico
                  </span>

                  {/* Input Desde */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-500 font-bold uppercase pl-1">Desde</label>
                    <input
                      type="date"
                      className="text-sm border-gray-300 rounded-md p-1.5 w-full focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors"
                      onChange={(e) => setCustomRangeLim(p => ({ ...p, in: e.target.value }))}
                    />
                  </div>

                  {/* Input Hasta */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center pl-1 pr-1">
                      <label className="text-[10px] text-gray-500 font-bold uppercase">Hasta</label>
                      <span className="text-[9px] text-gray-400 italic">Opcional</span>
                    </div>
                    <input
                      type="date"
                      className="text-sm border-gray-300 rounded-md p-1.5 w-full focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition-colors"
                      onChange={(e) => setCustomRangeLim(p => ({ ...p, fin: e.target.value }))}
                    />
                  </div>

                  {/* Botón Dinámico */}
                  <button
                    disabled={!customRangeLim.in}
                    className={`mt-2 text-white text-xs py-2 rounded-md font-bold shadow-sm transition-all duration-200
                      ${customRangeLim.in
                        ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md cursor-pointer'
                        : 'bg-gray-300 cursor-not-allowed'}
                    `}
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


        {/* 3. Filtros Extras: PENDIENTES */}
        {filtroActivo === "pendientes" && !verCanceladas && (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300 animate-fade-in h-[46px]">
            <button
              onClick={() => onFiltroExtraChange(filtroExtra === "ATRASADAS" ? "NINGUNO" : "ATRASADAS")}
              className={`
                flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg border transition-all cursor-pointer select-none h-full
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

            <button
              onClick={() => onFiltroExtraChange(filtroExtra === "CORRECCIONES" ? "NINGUNO" : "CORRECCIONES")}
              className={`
                flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg border transition-all cursor-pointer select-none h-full
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

        {/* 4. Filtros Extras: EN REVISIÓN */}
        {filtroActivo === "en_revision" && !verCanceladas && (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300 animate-fade-in h-[46px]">
            <button
              onClick={() => onFiltroExtraChange(filtroExtra === "RETRASO" ? "NINGUNO" : "RETRASO")}
              className={`
                flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg border transition-all cursor-pointer select-none h-full
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

            <button
              onClick={() => onFiltroExtraChange(filtroExtra === "AUTOCOMPLETAR" ? "NINGUNO" : "AUTOCOMPLETAR")}
              className={`
                flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg border transition-all cursor-pointer select-none h-full
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

        {/* 5. Filtros Extras: CONCLUIDAS */}
        {filtroActivo === "concluidas" && !verCanceladas && (
          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300 animate-fade-in h-[46px]">
            <button
              onClick={() => onFiltroExtraChange(filtroExtra === "RETRASO" ? "NINGUNO" : "RETRASO")}
              className={`
                flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-lg border transition-all cursor-pointer select-none h-full
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
              p-2.5 rounded-lg border shadow-sm transition-all duration-200 flex items-center justify-center cursor-pointer h-[46px]
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
              block w-full pl-10 pr-10 py-2.5 h-[46px]
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