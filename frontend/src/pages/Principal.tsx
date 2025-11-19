// 📍 src/pages/Principal.tsx

import React, { useState, useEffect, useMemo } from "react";
import Tabla from "../components/Principal/Tabla";
import Fechas from "../components/Principal/Fechas";
import ResumenPrincipal from "../components/Principal/Resumen";
import ResumenPrincipalDash from "../components/Principal/ResumenDash";
import Filtros from "../components/Principal/Filtros";
// Asegúrate de haber creado este componente en el paso anterior
import DashboardMetricas from "../components/Principal/DashboardMetricas";
import { tareasService } from "../api/tareas.service";
import type { Tarea } from "../types/tarea";
import type { Usuario } from "../types/usuario";

// Tipo para el Switch de Vistas
type ViewMode = "TAREAS" | "INDICADORES";

interface PrincipalProps {
  user: Usuario | null;
}

const Principal: React.FC<PrincipalProps> = ({ user }) => {
  // --- Estados de Filtros ---
  const [filtro, setFiltro] = useState<string>("pendientes");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(0);
  const [filtroUsuarioId, setFiltroUsuarioId] = useState<string>("Todos");
  const [query, setQuery] = useState<string>("");
  const [isKaizen, setIsKaizen] = useState(false);

  // --- Estados de Datos ---
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Estado para el Switch de Vista ---
  const [viewMode, setViewMode] = useState<ViewMode>("TAREAS");

  // --- Lógica de Permisos ---
  const canViewMetrics = ["SUPER_ADMIN", "ADMIN", "ENCARGADO"].includes(
    user?.rol || ""
  );

  // 💡 TÍTULO PRINCIPAL DINÁMICO
  const mainTitle = useMemo(() => {
    return viewMode === "TAREAS"
      ? "TAREAS ASIGNADAS"
      : "INDICADORES DE DESEMPEÑO";
  }, [viewMode]);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  useEffect(() => {
    const fetchTareas = async () => {
      try {
        setLoading(true);
        const data = await tareasService.getAll();

        const tareasConFechas = data.map((t: any) => ({
          ...t,
          fechaRegistro: t.fechaRegistro ? new Date(t.fechaRegistro) : null,
          fechaLimite: t.fechaLimite ? new Date(t.fechaLimite) : null,
          fechaConclusion: t.fechaConclusion
            ? new Date(t.fechaConclusion)
            : null,
          historialFechas:
            t.historialFechas?.map((h: any) => ({
              ...h,
              fechaCambio: h.fechaCambio ? new Date(h.fechaCambio) : null,
              fechaAnterior: h.fechaAnterior ? new Date(h.fechaAnterior) : null,
              nuevaFecha: h.nuevaFecha ? new Date(h.nuevaFecha) : null,
            })) || [],
        }));

        setTareas(tareasConFechas as Tarea[]);
      } catch (error) {
        console.error("Error al cargar tareas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTareas();
  }, []);

  const handleFechaChange = (newYear: number, newMonth: number) => {
    setYear(newYear);
    setMonth(newMonth);
  };

  // Filtro Kaizen global (Aplica tanto a tabla como a métricas si se desea)
  const tareasFiltradasPorModo = tareas.filter((t) => {
    const esKaizen = t.tarea.trim().toUpperCase().startsWith("KAIZEN");
    return isKaizen ? esKaizen : !esKaizen;
  });

  // 💡 COMPONENTE DE SWITCH (Igual a Pendientes.tsx)
  const renderSwitch = () => {
    if (!canViewMetrics) {
      return null;
    }

    const buttons = [
      { type: "TAREAS", label: "Gestión Tareas" },
      { type: "INDICADORES", label: "Métricas" },
    ];

    return (
      <div className="mb-6 px-2 lg:px-0">
        <div
          className="
                flex w-full max-w-md mx-auto 
                md:max-w-none lg:w-auto lg:mx-0 
                p-1 bg-gray-100 rounded-lg shadow-inner
            "
        >
          {buttons.map((btn) => (
            <button
              key={btn.type}
              onClick={() => setViewMode(btn.type as ViewMode)}
              className={`
                    flex-1 text-center 
                    px-4 py-2 
                    text-sm md:text-base font-bold rounded-md transition-all duration-200
                    ${
                      viewMode === btn.type
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-transparent text-gray-700 hover:bg-white hover:text-blue-600"
                    }
                `}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative mx-auto max-w-7x2 px-6 lg:px-10 py-2">
      {/* Título Principal */}
      <h1 className="text-3xl font-bold mb-3 text-center text-black tracking-wide font-sans">
        {mainTitle}
      </h1>

      {/* Switch de Vistas (Solo roles de gestión) */}
      {renderSwitch()}

      {/* Selector de Fechas (Compartido para ambas vistas) */}
      <Fechas onChange={handleFechaChange} />

      {/* Contenido Condicional */}
      {viewMode === "TAREAS" ? (
        // --- VISTA 1: GESTIÓN (TABLA) ---
        <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 lg:pb-0 animate-fade-in-up">
          <div className="lg:static sticky top-[40px] md:top-[70px] z-40 bg-white border-b border-gray-200 m-1 px-1 pt-4 pb-1 lg:pb-4">
            <ResumenPrincipal
              filtro={filtro}
              onFiltroChange={setFiltro}
              year={year}
              month={month}
              responsable={filtroUsuarioId}
              query={query}
              tareas={tareasFiltradasPorModo}
              loading={loading}
              user={user}
            />
            <Filtros
              onResponsableChange={setFiltroUsuarioId}
              onBuscarChange={setQuery}
              onKaizenChange={setIsKaizen}
              user={user}
            />
          </div>
          <div className="px-1">
            <Tabla
              filtro={filtro}
              year={year}
              month={month}
              responsable={filtroUsuarioId}
              query={query}
              tareas={tareasFiltradasPorModo}
              loading={loading}
              user={user}
            />
          </div>
        </div>
      ) : (
        // --- VISTA 2: INDICADORES (MÉTRICAS) ---
        <div className="mt-4">
          <ResumenPrincipalDash
              year={year}
              month={month}
              responsable={filtroUsuarioId}
              query={query}
              tareas={tareasFiltradasPorModo}
              loading={loading}
              user={user}
            />

          <DashboardMetricas
            tareas={tareasFiltradasPorModo}
            year={year}
            month={month}
          />
        </div>
      )}

      {/* Botón FAB de Recarga */}
      <button
        onClick={handleRefresh}
        disabled={loading}
        className={`
          /* --- Estilos base --- */
          p-3 bg-blue-600 text-white rounded-full shadow-xl 
          hover:bg-blue-700 transition-all duration-300
          
          /* --- Efecto click --- */
          active:scale-90 
          
          /* --- Posición --- */
          fixed bottom-20 right-6 z-50
          lg:bottom-180 lg:right-10

          /* --- Estado loading --- */
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
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>
    </div>
  );
};

export default Principal;
