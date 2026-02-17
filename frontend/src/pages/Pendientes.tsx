// 📍 src/pages/Pendientes.tsx
import React, { useState, useMemo } from "react";
import ResumenPendientes from "../components/Pendientes/ResumenPendientes";
import TablaPendientes from "../components/Pendientes/TablaPendientes";
import type { Usuario } from "../types/usuario";

// Nuevo tipo para manejar las 3 vistas posibles
export type ActiveView = "MIS_TAREAS" | "ASIGNADAS" | "TODAS";

interface Props {
  user: Usuario | null;
}

const Pendientes: React.FC<Props> = ({ user }) => {
  // 1. Estado de loading para el botón giratorio
  const [loading, setLoading] = useState(false);

  // --- LÓGICA DE ROLES Y VISTA ACTIVA ---
  const esEncargado = user?.rol === "ENCARGADO";
  const esAdminOSuperAdmin =
    user?.rol === "ADMIN" || user?.rol === "SUPER_ADMIN";
  const esRolPersonal = user?.rol === "USUARIO" || user?.rol === "INVITADO";
  const isManagementRole = esEncargado || esAdminOSuperAdmin;

  // Determina la vista por defecto al cargar.
  const defaultView: ActiveView = esAdminOSuperAdmin ? "TODAS" : "MIS_TAREAS";
  const [activeView, setActiveView] = useState<ActiveView>(defaultView);

  // 2. Lógica de Refresh SIMPLE
  const handleRefresh = () => {
    setLoading(true);

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // 💡 TÍTULO PRINCIPAL DINÁMICO
  const mainTitle = useMemo(() => {
    if (esRolPersonal) {
      return "MIS TAREAS PENDIENTES";
    }

    if (activeView === "MIS_TAREAS") {
      return "MIS TAREAS ASIGNADAS";
    } else if (activeView === "ASIGNADAS") {
      return "TAREAS ASIGNADAS";
    } else {
      // activeView === "TODAS"
      return "TAREAS PENDIENTES";
    }
  }, [esRolPersonal, activeView]);

  // 💡 COMPONENTE DE SWITCH MEJORADO (Con Iconos)
  const renderSwitch = () => {
    if (!isManagementRole) {
      return null;
    }

    // Definimos los botones dinámicamente según el rol
    const buttons = esEncargado
      ? [
        {
          type: "MIS_TAREAS",
          label: "Mis Tareas",
          // Icono de Usuario
          icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        },
        {
          type: "ASIGNADAS",
          label: "Asignadas por Mí",
          // Icono de Lista/Clipboard
          icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
        },
      ]
      : [
        // ADMIN, SUPER_ADMIN
        {
          type: "TODAS",
          label: "Todas",
          // Icono de Colección/Stack
          icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
        },
        {
          type: "ASIGNADAS",
          label: "Asignadas por Mí",
          // Icono de Lista/Clipboard
          icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
        },
      ];

    return (
      <div className="mb-6 px-2 lg:px-0">
        <div
          className="
                flex w-full max-w-md mx-auto 
                md:max-w-none lg:w-auto lg:mx-0 
                p-1.5 bg-white border border-gray-200 rounded-xl shadow-sm
            "
        >
          {buttons.map((btn) => {
            // ⚠️ Nota: Aquí usamos activeView en lugar de viewMode
            const isActive = activeView === btn.type;

            return (
              <button
                key={btn.type}
                onClick={() => setActiveView(btn.type as ActiveView)}
                className={`
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2.5 
                    text-sm md:text-base font-bold rounded-lg transition-all duration-300
                    ${isActive
                    ? "bg-blue-600 text-white shadow-md transform scale-[1.02]"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-blue-600 border border-transparent hover:border-gray-200"
                  }
                `}
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

  // Función helper para renderizar la sección principal (sin título)
  const renderSectionContent = (currentViewType: ActiveView) => (
    <div key={currentViewType} className="mb-8 animate-fade-in-up">
      <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 sm:pb-0">
        <div className="lg:static sticky top-[40px] md:top-[70px] z-40 bg-white border-b border-gray-200 m-1 px-1 pt-4 pb-1 lg:pb-4">
          {/* Se pasa el viewType correcto al Resumen */}
          <ResumenPendientes user={user} viewType={currentViewType} />
        </div>
        <div className="px-1">
          {/* Se pasa el viewType correcto a la Tabla */}
          <TablaPendientes user={user} viewType={currentViewType} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative mx-auto max-w-7x2 px-6 lg:px-10 py-2">
      {/* Título principal (siempre visible) */}
      <h1 className="text-3xl font-bold mb-3 text-center text-black tracking-wide font-sans">
        {mainTitle}
      </h1>

      {/* Switch de Vistas (Solo roles de gestión) */}
      {renderSwitch()}

      {/* 🔹 RENDERIZADO DE LA VISTA ACTIVA */}
      {renderSectionContent(activeView)}

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

export default Pendientes;