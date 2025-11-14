// 📍 src/components/Pendientes/ResumenPendientes.tsx

import React, { useState, useEffect } from "react";
import { tareasService } from "../../api/tareas.service";
import type { Tarea } from "../../types/tarea";
import type { Usuario } from "../../types/usuario";

// Tipo de vista de tareas (debe coincidir con Pendientes.tsx)
type ActiveView = "MIS_TAREAS" | "ASIGNADAS" | "TODAS";

const Dot: React.FC<{ className?: string; title?: string }> = ({
  className = "",
  title,
}) => (
  <svg
    className={`inline-block w-2.5 h-2.5 mr-1 align-middle ${className}`}
    viewBox="0 0 10 10"
    aria-hidden="true"
  >
    {title ? <title>{title}</title> : null}
    <circle cx="5" cy="5" r="5" fill="currentColor" />
  </svg>
);

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

// 2. Define la interfaz de Props, incluyendo ActiveView
interface Props {
  user: Usuario | null;
  viewType?: ActiveView; // Usamos el nuevo tipo
}

const ResumenPendientes: React.FC<Props> = ({ user, viewType }) => {
  const [totalPendientes, setTotalPendientes] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const fetchPendientes = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let tareasDesdeServicio: Tarea[] = [];
      const filters = { estatus: "PENDIENTE" as const };

      // 💡 LÓGICA CLAVE: Seleccionar el endpoint del servicio según viewType
      if (viewType === "ASIGNADAS") {
        tareasDesdeServicio = await tareasService.getAsignadas(filters);
      } else if (viewType === "MIS_TAREAS") {
        tareasDesdeServicio = await tareasService.getMisTareas(filters);
      } else {
        // "TODAS" (para ADMIN/SUPER_ADMIN) o undefined (en caso de que no se pase)
        tareasDesdeServicio = await tareasService.getAll(filters);
      }

      // Solo filtramos por estatus PENDIENTE, aunque ya viene prefiltrado por la API
      const pendientes = tareasDesdeServicio.filter((t: Tarea) => {
        return t.estatus === "PENDIENTE";
      });

      setTotalPendientes(pendientes.length);
    } catch (error) {
      console.error("Error al cargar tareas pendientes:", error);
    } finally {
      setLoading(false);
    }
  };

  // 7. Agrega 'user' y 'viewType' a las dependencias del useEffect
  useEffect(() => {
    const initialFetch = async () => {
      await fetchPendientes();
    };

    initialFetch();

    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (isDesktop) {
      intervalId = setInterval(() => {
        fetchPendientes();
      }, 30000);
    }

    // Limpieza
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, isDesktop, viewType]); // Depende del usuario y la vista

  // Lógica para el título en escritorio
  const desktopTitle =
    viewType === "ASIGNADAS"
      ? "Pendientes Asignadas"
      : viewType === "TODAS"
      ? "Total Pendientes"
      : "Mis Pendientes"; // Por defecto MIS_TAREAS

  return (
    <>
      {/* 💻 VERSIÓN ESCRITORIO */}
      <div className="hidden lg:grid grid-cols-4 gap-4 mb-2">
        <div className="col-span-4 flex justify-center">
          <div className="bg-blue-100 border border-blue-400 rounded-lg p-2 text-center shadow-sm w-full max-w-md">
            <div className="text-md font-semibold text-blue-800">
              {/* Usamos el título adaptado */}
              {desktopTitle}
            </div>
            <div className="text-2xl font-extrabold text-blue-900">
              {loading ? "..." : totalPendientes}
            </div>
          </div>
        </div>
      </div>

      {/* 📱 VERSIÓN MÓVIL (Con el estilo de botón) */}
      <div className="lg:hidden flex justify-center mb-4 px-3">
        <div
          className={`
          flex justify-between items-center 
          w-60
          md:w-80
          max-w-xs px-4 py-2 rounded-full border border-blue-300 
          shadow-sm bg-blue-100 text-blue-700
        `}
        >
          <span
            className="
          text-center font-semibold 
          text-[14px] 
          md:text-[18px]
          flex items-center gap-1.5"
          >
            Pendientes
          </span>

          <span
            className="text-right font-bold 
          text-[15px]
          md:text-[19px]
            opacity-90"
          >
            {loading ? "..." : totalPendientes}
          </span>
        </div>
      </div>
    </>
  );
};

export default ResumenPendientes;
