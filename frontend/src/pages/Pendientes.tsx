// 📍 src/pages/Pendientes.tsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import ResumenPendientes from "../components/Pendientes/ResumenPendientes";
import TablaPendientes from "../components/Pendientes/TablaPendientes";
import ModalNueva from "../components/Admin/ModalNueva";
import { tareasService } from "../api/tareas.service";
import type { Usuario } from "../types/usuario";
import type { Tarea } from "../types/tarea";
import FiltrosPendientes from "../components/Pendientes/Filtros/FiltrosPendientes";

// ✅ Importamos los tipos de fechas
import type { RangoFechaEspecial } from "./Admin";

export type ActiveView = "MIS_TAREAS" | "ASIGNADAS" | "TODAS";

interface Props {
  user: Usuario | null;
}
const defaultRango: RangoFechaEspecial = { tipo: "TODAS", inicio: null, fin: null };

const Pendientes: React.FC<Props> = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState<boolean>(false);

  const esEncargado = user?.rol === "ENCARGADO";
  const esAdminOSuperAdmin = user?.rol === "ADMIN" || user?.rol === "SUPER_ADMIN";
  const esRolPersonal = user?.rol === "USUARIO" || user?.rol === "INVITADO";
  const isManagementRole = esEncargado || esAdminOSuperAdmin;

  const defaultView: ActiveView = esAdminOSuperAdmin ? "TODAS" : "MIS_TAREAS";
  const [activeView, setActiveView] = useState<ActiveView>(defaultView);

  // --- ESTADOS DE FILTROS ---
  const [filtro, setFiltro] = useState<string>("total");
  const [query, setQuery] = useState<string>("");
  const [filtroUrgencia, setFiltroUrgencia] = useState<"TODAS" | "ALTA" | "MEDIA" | "BAJA">("TODAS");
  const [filtroExtra, setFiltroExtra] = useState<"NINGUNO" | "ATRASADAS" | "CORRECCIONES" | "RETRASO" | "AUTOCOMPLETAR">("NINGUNO");
  const [filtroFechaRegistro, setFiltroFechaRegistro] = useState<RangoFechaEspecial>(defaultRango);
  const [filtroFechaLimite, setFiltroFechaLimite] = useState<RangoFechaEspecial>(defaultRango);

  // --- ESTADOS DE DATOS ---
  const [tareas, setTareas] = useState<Tarea[]>([]);

  // Resetear filtros al cambiar de vista
  useEffect(() => {
    setFiltro("total");
    setFiltroExtra("NINGUNO");
  }, [activeView]);

  // ✅ Saber si "HOY" está activo
  const isHoyActivo = filtroFechaLimite.tipo === "HOY";

  // ✅ EFECTO MAGICO: Si pican HOY, se va a pestaña Pendientes. Si lo quitan, regresa a Total.
  useEffect(() => {
    if (isHoyActivo) {
      setFiltro("pendientes");
    } else {
      setFiltro("total");
    }
  }, [isHoyActivo]);

  // --- OBTENCIÓN DE DATOS ---
  const fetchTareasCentralizadas = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const config = { limit: 1000, query: query };
      let res;

      if (activeView === "ASIGNADAS") {
        res = await tareasService.getAsignadas(config);
      } else if (activeView === "MIS_TAREAS") {
        res = await tareasService.getMisTareas(config);
      } else {
        res = await tareasService.getAll(config);
      }

      const tareasConFechas = res.data.map((t: any) => ({
        ...t,
        fechaRegistro: t.fechaRegistro ? new Date(t.fechaRegistro) : null,
        fechaLimite: t.fechaLimite ? new Date(t.fechaLimite) : null,
        fechaConclusion: t.fechaConclusion ? new Date(t.fechaConclusion) : null,
        fechaEntrega: t.fechaEntrega ? new Date(t.fechaEntrega) : null,
        historialFechas: t.historialFechas?.map((h: any) => ({
          ...h,
          fechaCambio: h.fechaCambio ? new Date(h.fechaCambio) : null,
          fechaAnterior: h.fechaAnterior ? new Date(h.fechaAnterior) : null,
          nuevaFecha: h.nuevaFecha ? new Date(h.nuevaFecha) : null,
        })) || [],
      }));
      setTareas(tareasConFechas as Tarea[]);
    } catch (error) {
      console.error("❌ Error al cargar tareas:", error);
    } finally {
      setLoading(false);
    }
  }, [user, activeView, query]);

  useEffect(() => {
    fetchTareasCentralizadas();
  }, [fetchTareasCentralizadas]);

  // ✅ CONTEO DINÁMICO: Para que los botones del resumen cuenten solo las de HOY si está activo
  const conteoDinamico = useMemo(() => {
    let base = [...tareas];

    if (filtroFechaLimite.tipo !== "TODAS" && filtroFechaLimite.inicio) {
      base = base.filter(t => {
        const flObj = t.historialFechas && t.historialFechas.length > 0
          ? new Date(t.historialFechas[t.historialFechas.length - 1].nuevaFecha!)
          : (t.fechaLimite ? new Date(t.fechaLimite) : null);
        if (!flObj) return false;
        const finEfectivo = filtroFechaLimite.fin ? filtroFechaLimite.fin.getTime() : filtroFechaLimite.inicio!.getTime();
        return flObj.getTime() >= filtroFechaLimite.inicio!.getTime() && flObj.getTime() <= finEfectivo;
      });
    }

    return {
      activas: base.filter(t => t.estatus === "PENDIENTE" || t.estatus === "EN_REVISION").length,
      pendientes: base.filter(t => t.estatus === "PENDIENTE").length,
      enRevision: base.filter(t => t.estatus === "EN_REVISION").length,
      concluidas: base.filter(t => t.estatus === "CONCLUIDA").length,
      canceladas: base.filter(t => t.estatus === "CANCELADA").length,
      todas: base.length
    };
  }, [tareas, filtroFechaLimite]);

  // --- LÓGICA DE FILTRADO VISUAL A LA TABLA ---
  const tareasFiltradas = useMemo(() => {
    let filtered = [...tareas];

    // 1. Filtro por Pestaña
    if (filtro === "pendientes") {
      filtered = filtered.filter(t => t.estatus === "PENDIENTE");
    } else if (filtro === "en_revision") {
      filtered = filtered.filter(t => t.estatus === "EN_REVISION");
    } else {
      filtered = filtered.filter(t => t.estatus !== "CONCLUIDA" && t.estatus !== "CANCELADA");
    }

    // 2. Filtro de Fechas
    if (filtroFechaLimite.tipo !== "TODAS" && filtroFechaLimite.inicio) {
      filtered = filtered.filter(t => {
        const flObj = t.historialFechas && t.historialFechas.length > 0
          ? new Date(t.historialFechas[t.historialFechas.length - 1].nuevaFecha!)
          : (t.fechaLimite ? new Date(t.fechaLimite) : null);
        if (!flObj) return false;
        const finEfectivo = filtroFechaLimite.fin ? filtroFechaLimite.fin.getTime() : filtroFechaLimite.inicio!.getTime();
        return flObj.getTime() >= filtroFechaLimite.inicio!.getTime() && flObj.getTime() <= finEfectivo;
      });
    }

    return filtered;
  }, [tareas, filtro, filtroFechaLimite]);

  // --- RENDERIZADO PRINCIPAL ---
  const mainTitle = useMemo(() => {
    if (esRolPersonal) return "MIS TAREAS PENDIENTES";
    if (activeView === "MIS_TAREAS") return "MIS TAREAS ASIGNADAS";
    if (activeView === "ASIGNADAS") return "TAREAS ASIGNADAS";
    return "TAREAS PENDIENTES";
  }, [esRolPersonal, activeView]);

  const renderSwitch = () => {
    if (!isManagementRole) return null;
    const buttons = esEncargado
      ? [
        { type: "MIS_TAREAS", label: "Mis Tareas", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        { type: "ASIGNADAS", label: "Asignadas por Mí", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
      ]
      : [
        { type: "TODAS", label: "Todas", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
        { type: "ASIGNADAS", label: "Asignadas por Mí", icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg> },
      ];

    return (
      <div className="mb-6 px-2 lg:px-0">
        <div className="flex w-full max-w-md mx-auto md:max-w-none lg:w-auto lg:mx-0 p-1.5 bg-white border border-gray-200 rounded-xl shadow-sm">
          {buttons.map((btn) => (
            <button
              key={btn.type}
              onClick={() => setActiveView(btn.type as ActiveView)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm md:text-base font-bold rounded-lg transition-all duration-300 ${activeView === btn.type ? "bg-blue-600 text-white shadow-md transform scale-[1.02]" : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-blue-600 border border-transparent"}`}
            >
              {btn.icon}
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderSectionContent = (currentViewType: ActiveView) => (
    <div key={currentViewType} className="mb-8 animate-fade-in-up">
      <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 sm:pb-0">
        <div className="lg:static sticky top-[40px] md:top-[70px] z-40 bg-white border-b border-gray-200 m-1 px-1 pt-4 pb-1 lg:pb-4">

          {/* ✅ PASAMOS LA BANDERA DE "HOY ACTIVO" AL RESUMEN */}
          <ResumenPendientes
            viewType={currentViewType}
            filtro={filtro}
            onFiltroChange={setFiltro}
            conteo={conteoDinamico}
            loading={loading}
            isHoyActivo={isHoyActivo}
          />

          <FiltrosPendientes
            onBuscarChange={setQuery}
            user={user}
            filtroUrgencia={filtroUrgencia}
            onUrgenciaChange={setFiltroUrgencia}
            filtroExtra={filtroExtra}
            onFiltroExtraChange={setFiltroExtra}
            filtroActivo={filtro}
            totalTareas={tareasFiltradas.length}
            filtroFechaRegistro={filtroFechaRegistro}
            filtroFechaLimite={filtroFechaLimite}
            onFiltroFechaRegistroChange={setFiltroFechaRegistro}
            onFiltroFechaLimiteChange={setFiltroFechaLimite}
          />

        </div>
        <div className="px-1">
          <TablaPendientes
            user={user}
            tareas={tareasFiltradas}
            filtro={filtro}
            loading={loading}
            onRecargar={fetchTareasCentralizadas}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative mx-auto max-w-7x2 px-6 lg:px-10 py-2">
      <h1 className="text-3xl font-bold mb-3 text-center text-black tracking-wide font-sans">
        {mainTitle}
      </h1>

      {renderSwitch()}

      {isManagementRole && (
        <div className="flex justify-end sm:justify-between items-center mb-4">
          <div className="hidden sm:block"></div>
          <button
            onClick={() => setOpenModal(true)}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-md shadow-md active:scale-[0.97] transition-all duration-200 fixed bottom-40 right-5 sm:static sm:bottom-auto sm:right-auto sm:px-5 sm:py-2 sm:rounded-md sm:shadow z-50 sm:z-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7"><path fillRule="evenodd" d="M12 4.5a.75.75 0 01.75.75v6h6a.75.75 0 010 1.5h-6v6a.75.75 0 01-1.5 0v-6h-6a.75.75 0 010-1.5h6v-6A.75.75 0 0112 4.5z" clipRule="evenodd" /></svg>
            <span className="hidden sm:inline">Agregar nueva tarea</span>
          </button>
        </div>
      )}

      {renderSectionContent(activeView)}

      <button
        onClick={fetchTareasCentralizadas}
        disabled={loading}
        className={`p-3 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-700 transition-all duration-300 active:scale-90 fixed bottom-20 right-6 z-50 lg:bottom-180 lg:right-10 ${loading ? "opacity-75 cursor-wait" : ""}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-8 h-8 ${loading ? "animate-spin" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      </button>

      {openModal && (
        <ModalNueva
          onClose={() => setOpenModal(false)}
          onTareaAgregada={fetchTareasCentralizadas}
          user={user}
        />
      )}
    </div>
  );
};

export default Pendientes;