// 📍 src/pages/Pendientes.tsx
import React, { useState } from "react";
import ResumenPendientes from "../components/Pendientes/ResumenPendientes";
import TablaPendientes from "../components/Pendientes/TablaPendientes";
import type { Usuario } from "../types/usuario";

interface Props {
  user: Usuario | null;
}

const Pendientes: React.FC<Props> = ({ user }) => {
  // 1. Estado de loading para el botón giratorio
  const [loading, setLoading] = useState(false);

  // 2. Lógica de Refresh SIMPLE (Igual que en Admin y Principal)
  const handleRefresh = () => {
    setLoading(true);

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // 3. Lógica para determinar si el usuario es un ENCARGADO
  const esEncargado = user?.rol === "ENCARGADO";

  // Lógica para el título principal si no es ENCARGADO
  const esRolPersonal = user?.rol === "USUARIO" || user?.rol === "INVITADO";
  const tituloNormal = esRolPersonal
    ? "MIS TAREAS PENDIENTES"
    : "TAREAS PENDIENTES";

  // Función helper para renderizar una sección completa
  const renderSection = (
    title: string,
    viewType?: "MIS_TAREAS" | "ASIGNADAS"
  ) => (
    <div key={viewType || "default-view"} className="mb-8">
      <h1 className="text-3xl font-bold mb-3 text-center text-black tracking-wide font-sans">
        {title}
      </h1>

      <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 sm:pb-0">
        <div className="lg:static sticky top-[40px] md:top-[70px] z-40 bg-white border-b border-gray-200 m-1 px-1 pt-4 pb-1 lg:pb-4">
          <ResumenPendientes user={user} viewType={viewType} />
        </div>
        <div className="px-1">
          <TablaPendientes user={user} viewType={viewType} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative mx-auto max-w-7x2 px-6 lg:px-10 py-2">
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

      {/* 🔹 RENDERIZADO CONDICIONAL POR ROL */}
      {esEncargado ? (
        <>
          {renderSection("MIS PENDIENTES", "MIS_TAREAS")}
          {renderSection("TAREAS ASIGNADAS", "ASIGNADAS")}
        </>
      ) : (
        renderSection(tituloNormal)
      )}
    </div>
  );
};

export default Pendientes;
