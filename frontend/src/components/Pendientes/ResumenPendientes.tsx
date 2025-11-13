// 📍 src/components/Pendientes/ResumenPendientes.tsx

import React, { useState, useEffect } from "react";
import { tareasService } from "../../api/tareas.service";
import type { Tarea } from "../../types/tarea";
import type { Usuario } from "../../types/usuario"; // 1. Importa Usuario

// ... (El componente Dot SVG se queda igual) ...
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

// 🔹 1. AÑADIMOS EL HOOK 'useMediaQuery' (lg = 1024px)
const useMediaQuery = (query: string) => {
  // Asegurarse de que window exista (para SSR)
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

// 2. Define la interfaz de Props, incluyendo viewType
interface Props {
  user: Usuario | null;
  viewType?: "MIS_TAREAS" | "ASIGNADAS";
}

// 3. Aplica la interfaz y desestructura 'user' y 'viewType'
const ResumenPendientes: React.FC<Props> = ({ user, viewType }) => {
  const [totalPendientes, setTotalPendientes] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const fetchPendientes = async () => {
    // 4. Si no hay usuario, no hacemos nada
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 💡 CAMBIO CLAVE 1: Llama al servicio y pasa el viewType al backend
      const todasLasTareas = await tareasService.getAll({ viewType });

      // 💡 CAMBIO CLAVE 2: Solo filtramos por estatus PENDIENTE.
      // El backend ya se encargó de filtrar por rol, asignador, o responsable.
      const pendientes = todasLasTareas.filter((t: Tarea) => {
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
      // Solo activa el intervalo si es escritorio
      intervalId = setInterval(() => {
        // console.log("🔄 [Desktop] Recargando resumen de pendientes...");
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
  const isPersonalRole = user?.rol === "USUARIO" || user?.rol === "INVITADO";
  const desktopTitle =
    viewType === "ASIGNADAS"
      ? "Pendientes Asignadas"
      : isPersonalRole
      ? "Mis Pendientes"
      : "Total Pendientes";

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
