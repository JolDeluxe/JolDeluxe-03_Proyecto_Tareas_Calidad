// 📍 src/pages/Admin.tsx

import React, { useState, useEffect, useCallback, useMemo } from "react";

// --- Componentes de Administración ---
import TablaAdmin from "../components/Admin/TablaAdmin";
import ResumenPrincipalAdmin from "../components/Admin/ResumenAdmin";
import FiltrosAdmin from "../components/Admin/FiltrosAdmin";
import ModalNueva from "../components/Admin/ModalNueva";

// --- Componentes de Métricas ---
import Fechas from "../components/Principal/Fechas";
import ResumenPrincipalDash from "../components/Principal/ResumenDash";
import DashboardMetricas from "../components/Principal/DashboardMetricas";

// --- API y Tipos ---
import { tareasService, type TareaFilters, type TareasResponse } from "../api/tareas.service";
import type { Tarea } from "../types/tarea";
import type { Usuario } from "../types/usuario";

// Tipo para el Switch de Vistas
type ViewMode = "TAREAS" | "INDICADORES";

interface AdminProps {
  user: Usuario | null;
}

const Admin: React.FC<AdminProps> = ({ user }) => {
  // --- Estados de Filtros de Administración ---
  const [filtro, setFiltro] = useState("total"); // Filtro visual (pestañas)
  const [responsable, setResponsable] = useState<string>("Todos"); // Filtro API
  const [query, setQuery] = useState<string>(""); // Filtro API

  // --- Estados para Modales y Carga ---
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [tareas, setTareas] = useState<Tarea[]>([]);

  // ✅ NUEVO: Estado para el resumen que viene del Backend
  const [resumenData, setResumenData] = useState<TareasResponse['meta']['resumen']['totales'] | null>(null);

  const [loading, setLoading] = useState(true);

  // --- Estado para Modo Kaizen ---
  const [isKaizen, setIsKaizen] = useState(false);

  // --- Estados para Métricas y Fechas ---
  const [viewMode, setViewMode] = useState<ViewMode>("TAREAS");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(0);

  // --- Lógica de Recarga Forzada ---
  const handleRefresh = () => {
    setLoading(true);
    // Recarga suave llamando al fetch
    fetchTareas();
  };

  const handleNuevaTarea = () => {
    setOpenModal(true);
  };

  const handleFechaChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  // --- Fetch de Tareas (Server-Side Filtering) ---
  const fetchTareas = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Construir filtros para la API
      const apiFilters: TareaFilters = {
        query: query,
        // Si es "Todos", no enviamos el ID. Si es un número, lo enviamos.
        responsableId: responsable !== "Todos" ? Number(responsable) : undefined,
        // Mantenemos paginación alta por ahora para la tabla
        limit: 100
      };

      // 2. Llamada al servicio actualizado
      const { data, meta } = await tareasService.getAll(apiFilters);

      // 3. Parseo de fechas para que funcionen las métricas y tablas
      const tareasConFechas = data.map((t: any) => ({
        ...t,
        fechaRegistro: t.fechaRegistro ? new Date(t.fechaRegistro) : null,
        fechaLimite: t.fechaLimite ? new Date(t.fechaLimite) : null,
        fechaEntrega: t.fechaEntrega ? new Date(t.fechaEntrega) : null, // Importante para lógica de tiempos
        fechaConclusion: t.fechaConclusion ? new Date(t.fechaConclusion) : null,
        historialFechas:
          t.historialFechas?.map((h: any) => ({
            ...h,
            fechaCambio: h.fechaCambio ? new Date(h.fechaCambio) : null,
            fechaAnterior: h.fechaAnterior ? new Date(h.fechaAnterior) : null,
            nuevaFecha: h.nuevaFecha ? new Date(h.nuevaFecha) : null,
          })) || [],
      }));

      // 4. Actualizar estados
      setTareas(tareasConFechas as Tarea[]);

      // ✅ Guardamos el resumen calculado por el backend
      if (meta && meta.resumen) {
        setResumenData(meta.resumen.totales);
      }

    } catch (error) {
      console.error("Error al cargar tareas:", error);
      setTareas([]);
      setResumenData(null);
    } finally {
      setLoading(false);
    }
  }, [responsable, query]); // ✅ Dependencias: se recarga si cambian los filtros

  // Ejecutar fetch cuando cambien dependencias
  useEffect(() => {
    fetchTareas();
  }, [fetchTareas]);

  // --- Lógica de Filtrado Visual (Pestañas de Estatus) ---
  // Aunque filtramos en servidor por Responsable/Query, las pestañas (Pendientes/En Revisión)
  // suelen filtrar visualmente los datos que ya trajimos, o podríamos pedir al backend filtrar también.
  // Para mantener la agilidad de la UI, filtramos el array `tareas` localmente según la pestaña `filtro`.
  const tareasParaTabla = useMemo(() => {
    // 1. Filtro Kaizen (Local)
    let filtered = tareas.filter((t) => {
      const nombreTarea = t.tarea || "";
      const esKaizen = nombreTarea.trim().toUpperCase().startsWith("KAIZEN");
      return isKaizen ? esKaizen : !esKaizen;
    });

    // 2. Filtro por Pestaña (Pendientes, En Revisión, Total)
    if (filtro === "pendientes") {
      filtered = filtered.filter(t => t.estatus === "PENDIENTE");
    } else if (filtro === "en_revision") {
      filtered = filtered.filter(t => t.estatus === "EN_REVISION");
    }
    // "total" muestra todo lo que trajo el backend

    return filtered;
  }, [tareas, isKaizen, filtro]);

  // --- Título Dinámico ---
  const tituloDinamico = useMemo(() => {
    if (viewMode === "INDICADORES") return "DASHBOARD DE MÉTRICAS";
    return isKaizen ? "ADMINISTRA KAIZEN" : "ADMINISTRA TAREAS";
  }, [viewMode, isKaizen]);

  // ✅ SWITCH DE VISTAS (DISEÑO IDÉNTICO A PRINCIPAL)
  const renderSwitch = () => {
    const buttons = [
      {
        type: "TAREAS",
        label: "Gestión Tareas",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
        disabled: false
      },
      {
        type: "INDICADORES",
        label: "Métricas (En mantenimiento 🚧🚧🚧)",
        icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
        disabled: true
      },
    ];

    return (
      <div className="mb-6 px-2 lg:px-0">
        <div className="flex w-full max-w-md mx-auto md:max-w-none lg:w-auto lg:mx-auto p-1.5 bg-white border border-gray-200 rounded-xl shadow-sm">
          {buttons.map((btn) => {
            const isActive = viewMode === btn.type;
            return (
              <button
                key={btn.type}
                onClick={() => !btn.disabled && setViewMode(btn.type as ViewMode)}
                disabled={btn.disabled}
                className={`
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 
                  text-sm md:text-base font-bold rounded-lg transition-all duration-300
                  ${isActive
                    ? "bg-blue-600 text-white shadow-md transform scale-[1.02]"
                    : btn.disabled
                      ? "bg-gray-100 text-gray-300 cursor-not-allowed border border-transparent"
                      : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-blue-600 border border-transparent hover:border-gray-200"
                  }
                `}
                title={btn.disabled ? "Módulo en mantenimiento / reestructuración" : ""}
              >
                {btn.icon}
                <span>{btn.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="relative mx-auto max-w-7x2 px-6 lg:px-10 py-2">
      {/* Botón Flotante de Recarga */}
      <button
        onClick={handleRefresh}
        disabled={loading}
        className={`
          p-3 bg-blue-600 text-white rounded-full shadow-xl 
          hover:bg-blue-700 transition-all duration-300
          active:scale-90 
          fixed bottom-20 right-6 z-50
          lg:bottom-180 lg:right-10
          ${loading ? "opacity-75 cursor-wait" : ""}
        `}
        aria-label="Actualizar tareas"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className={`w-8 h-8 ${loading ? "animate-spin" : ""}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      </button>

      {/* Título Principal */}
      <h1 className="text-3xl font-bold mb-3 text-center text-black tracking-wide font-sans">
        {tituloDinamico}
      </h1>

      {/* Switch de Vistas */}
      {renderSwitch()}

      {/* Renderizado Condicional de la Vista */}
      {viewMode === "TAREAS" ? (
        <>
          <div className="flex justify-end sm:justify-between items-center mb-4">
            <div className="hidden sm:block"></div>
            <button
              onClick={handleNuevaTarea}
              className="flex items-center justify-center gap-2 
                      bg-green-600 hover:bg-green-700 text-white 
                      font-semibold px-4 py-2 rounded-md shadow-md 
                      active:scale-[0.97] transition-all duration-200
                      fixed bottom-40 right-5 sm:static sm:bottom-auto sm:right-auto
                      sm:px-5 sm:py-2 sm:rounded-md sm:shadow 
                      z-30 sm:z-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                <path fillRule="evenodd" d="M12 4.5a.75.75 0 01.75.75v6h6a.75.75 0 010 1.5h-6v6a.75.75 0 01-1.5 0v-6h-6a.75.75 0 010-1.5h6v-6A.75.75 0 0112 4.5z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">Agregar nueva tarea</span>
            </button>
          </div>

          <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 lg:pb-0 animate-fade-in-up">
            <div className="lg:static sticky top-[40px] md:top-[70px] z-40 bg-white border-b border-gray-200 m-1 px-1 pt-4 pb-1 lg:pb-4">
              <ResumenPrincipalAdmin
                filtro={filtro}
                onFiltroChange={setFiltro}
                // ✅ Pasamos directamente el objeto de totales calculado por el backend
                conteo={resumenData}
                loading={loading}
              />
              <FiltrosAdmin
                onResponsableChange={setResponsable}
                onBuscarChange={setQuery}
                user={user}
              // onKaizenChange={setIsKaizen}
              />
            </div>

            <div className="px-1">
              <TablaAdmin
                filtro={filtro}
                responsable={responsable}
                query={query}
                tareas={tareasParaTabla} // ✅ Usamos la lista filtrada visualmente
                loading={loading}
                onRecargarTareas={fetchTareas}
                user={user}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="animate-fade-in-up">
          <div className="mb-4">
            <Fechas onChange={handleFechaChange} />
          </div>

          <ResumenPrincipalDash
            year={year}
            month={month}
            responsable={responsable}
            query={query}
            tareas={tareas} // Se pasa el array completo para métricas cliente-side (legacy por ahora)
            loading={loading}
            user={user}
          />

          <div className="mt-6">
            <DashboardMetricas
              tareas={tareas}
              year={year}
              month={month}
            />
          </div>
        </div>
      )}

      {openModal && (
        <ModalNueva
          onClose={() => setOpenModal(false)}
          onTareaAgregada={fetchTareas}
          user={user}
        />
      )}
    </div>
  );
};

export default Admin;