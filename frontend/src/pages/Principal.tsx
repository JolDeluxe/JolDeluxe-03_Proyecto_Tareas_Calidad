// src/components/Principal.tsx

import React, { useState, useEffect } from "react";
import Tabla from "../components/Principal/Tabla";
import Fechas from "../components/Principal/Fechas";
import ResumenPrincipal from "../components/Principal/Resumen";
import Filtros from "../components/Principal/Filtros";
import { tareasService } from "../api/tareas.service";
import type { Tarea } from "../types/tarea";
import type { Usuario } from "../types/usuario";

interface PrincipalProps {
  user: Usuario | null;
}
{
}
const Principal: React.FC<PrincipalProps> = ({ user }) => {
  // 3. Mantenemos tu estado de filtros
  const [filtro, setFiltro] = useState<string>("pendientes");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(0);
  const [filtroUsuarioId, setFiltroUsuarioId] = useState<string>("Todos");
  const [query, setQuery] = useState<string>("");

  const [isKaizen, setIsKaizen] = useState(false);

  // 4. AÑADIMOS estado para los datos y la carga
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);

  // Tu lógica de refresh (¡Correcta!)
  // const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    // 1. Activa la animación del spinner
    setLoading(true);

    // 2. setTimeout ejecuta lo que está ADENTRO después de 3000ms
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

  const tareasFiltradasPorModo = tareas.filter((t) => {
    const esKaizen = t.tarea.trim().toUpperCase().startsWith("KAIZEN");
    return isKaizen ? esKaizen : !esKaizen;
  });

  return (
    <div className="relative mx-auto max-w-7x2 px-6 lg:px-10 py-2">
      <button
        onClick={handleRefresh}
        disabled={loading}
        className={`
          /* --- Estilos base (comunes) --- */
          p-3 bg-blue-600 text-white rounded-full shadow-xl 
          hover:bg-blue-700 transition-all duration-300
          
          /* --- Efecto al presionar (Click): Se hunde ligeramente --- */
          active:scale-90 
          
          /* --- Móvil/Tablet: Fijo en la esquina --- */
          fixed bottom-20 right-6 z-50
          
          /* --- Escritorio (lg): Vuelve a su lugar original --- */
          lg:bottom-180 lg:right-10

          /* --- Opacidad visual si está cargando --- */
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

      <h1 className="text-3xl font-bold mb-3 text-center text-black tracking-wide font-sans">
        TAREAS ASIGNADAS
      </h1>

      <Fechas onChange={handleFechaChange} />

      <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 lg:pb-0">
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
    </div>
  );
};

export default Principal;
