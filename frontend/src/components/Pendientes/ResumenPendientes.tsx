// 📍 src/components/Pendientes/ResumenPendientes.tsx

import React, { useState, useEffect } from "react";
import { tareasService } from "../../api/tareas.service";
import type { Tarea } from "../../types/tarea";
import type { Usuario } from "../../types/usuario";

// Tipo de vista de tareas
type ActiveView = "MIS_TAREAS" | "ASIGNADAS" | "TODAS";

// Hook auxiliar (sin cambios)
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(
    typeof window !== "undefined" ? window.matchMedia(query).matches : false
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};

interface Props {
  user: Usuario | null;
  viewType?: ActiveView;
}

const ResumenPendientes: React.FC<Props> = ({ user, viewType }) => {
  // ✅ 1. Nuevo estado para el segundo contador
  const [totalPendientes, setTotalPendientes] = useState<number>(0);
  const [totalRevision, setTotalRevision] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const fetchResumen = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let tareasDesdeServicio: Tarea[] = [];

      // Obtenemos TODAS las tareas (sin filtrar por estatus en la API para poder contar ambas aquí)
      // Nota: Si tu API soporta filtrar por múltiples estatus a la vez, sería más eficiente.
      // Por ahora, asumimos que traemos el bloque correspondiente a la vista y filtramos en memoria.

      if (viewType === "ASIGNADAS") {
        tareasDesdeServicio = await tareasService.getAsignadas();
      } else if (viewType === "MIS_TAREAS") {
        tareasDesdeServicio = await tareasService.getMisTareas();
      } else {
        tareasDesdeServicio = await tareasService.getAll();
      }

      // ✅ 2. Filtrar y contar por separado
      const pendientes = tareasDesdeServicio.filter((t: Tarea) => t.estatus === "PENDIENTE");
      const enRevision = tareasDesdeServicio.filter((t: Tarea) => t.estatus === "EN_REVISION");

      setTotalPendientes(pendientes.length);
      setTotalRevision(enRevision.length);

    } catch (error) {
      console.error("Error al cargar resumen:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumen();

    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (isDesktop) {
      intervalId = setInterval(() => {
        fetchResumen();
      }, 30000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, isDesktop, viewType]);

  // Títulos dinámicos
  const titlePendientes = viewType === "ASIGNADAS" ? "Pendientes de Validar" : "Mis Pendientes";
  const titleRevision = viewType === "ASIGNADAS" ? "Por Revisar" : "En Revisión";

  return (
    <>
      {/* 💻 VERSIÓN ESCRITORIO (Dos tarjetas lado a lado) */}
      <div className="hidden lg:grid grid-cols-2 gap-4 mb-2 max-w-4xl mx-auto">

        {/* Tarjeta PENDIENTES */}
        <div className="flex justify-center">
          <div className="bg-blue-100 border border-blue-400 rounded-lg p-2 text-center shadow-sm w-full">
            <div className="text-md font-semibold text-blue-800">
              {titlePendientes}
            </div>
            <div className="text-2xl font-extrabold text-blue-900">
              {loading ? "..." : totalPendientes}
            </div>
          </div>
        </div>

        {/* Tarjeta EN REVISIÓN */}
        <div className="flex justify-center">
          <div className="bg-indigo-100 border border-indigo-400 rounded-lg p-2 text-center shadow-sm w-full">
            <div className="text-md font-semibold text-indigo-800">
              {titleRevision}
            </div>
            <div className="text-2xl font-extrabold text-indigo-900">
              {loading ? "..." : totalRevision}
            </div>
          </div>
        </div>

      </div>

      {/* 📱 VERSIÓN MÓVIL (Dos píldoras apiladas) */}
      <div className="lg:hidden flex flex-col items-center mb-4 px-3 space-y-2">

        {/* 1. Píldora PENDIENTES (Azul) */}
        <div
          className={`
          flex justify-between items-center 
          w-60 md:w-80 max-w-xs px-4 py-2 
          rounded-full border border-blue-300 
          shadow-sm bg-blue-100 text-blue-700
        `}
        >
          <span className="text-center font-semibold text-[14px] md:text-[18px] flex items-center gap-1.5">
            Pendientes
          </span>
          <span className="text-right font-bold text-[15px] md:text-[19px] opacity-90">
            {loading ? "..." : totalPendientes}
          </span>
        </div>

        {/* 2. Píldora EN REVISIÓN (Índigo/Morado para diferenciar) */}
        <div
          className={`
          flex justify-between items-center 
          w-60 md:w-80 max-w-xs px-4 py-2 
          rounded-full border border-indigo-300 
          shadow-sm bg-indigo-100 text-indigo-700
        `}
        >
          <span className="text-center font-semibold text-[14px] md:text-[18px] flex items-center gap-1.5">
            En Revisión
          </span>
          <span className="text-right font-bold text-[15px] md:text-[19px] opacity-90">
            {loading ? "..." : totalRevision}
          </span>
        </div>

      </div>
    </>
  );
};

export default ResumenPendientes;