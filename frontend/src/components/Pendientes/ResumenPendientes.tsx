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

// 2. Define la interfaz de Props
interface Props {
  user: Usuario | null;
}

// 3. Aplica la interfaz y desestructura 'user'
const ResumenPendientes: React.FC<Props> = ({ user }) => {
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
      const todasLasTareas = await tareasService.getAll();

      // 5. Define los roles que ven todo
      const rolesDeGestion = ["SUPER_ADMIN", "ADMIN", "ENCARGADO"];
      const esRolGestion = user.rol ? rolesDeGestion.includes(user.rol) : false;

      // 6. Aplica el filtro condicional
      const pendientes = todasLasTareas.filter((t: Tarea) => {
        // Filtro base: siempre PENDIENTE
        if (t.estatus !== "PENDIENTE") {
          return false;
        }

        // Si es rol de gestión, se aprueba (ve todas las pendientes)
        if (esRolGestion) {
          return true;
        }

        // Si es USUARIO o INVITADO, filtra por sus tareas
        // (Usamos resp.id, como corregimos antes)
        return t.responsables.some((resp) => resp.id === user.id);
      });

      setTotalPendientes(pendientes.length);
    } catch (error) {
      console.error("Error al cargar tareas pendientes:", error);
    } finally {
      setLoading(false);
    }
  };

  // 7. Agrega 'user' a las dependencias del useEffect
  useEffect(() => {
    const initialFetch = async () => {
      await fetchPendientes();
    };

    initialFetch();

    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (isDesktop) {
      // Solo activa el intervalo si es escritorio
      intervalId = setInterval(() => {
        console.log("🔄 [Desktop] Recargando resumen de pendientes...");
        fetchPendientes();
      }, 30000);
    }

    // Limpieza
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user, isDesktop]);

  return (
    <>
      {/* 💻 VERSIÓN ESCRITORIO */}
      <div className="hidden lg:grid grid-cols-4 gap-4 mb-2">
        <div className="col-span-4 flex justify-center">
          <div className="bg-blue-100 border border-blue-400 rounded-lg p-2 text-center shadow-sm w-full max-w-md">
            <div className="text-md font-semibold text-blue-800">
              {/* 8. Título condicional (opcional, pero coherente) */}
              {user?.rol === "USUARIO" || user?.rol === "INVITADO"
                ? "Mis Pendientes"
                : "Total Pendientes"}
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
