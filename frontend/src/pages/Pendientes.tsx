// 📍 src/pages/Pendientes.tsx
import React, { useState } from "react";
import ResumenPendientes from "../components/Pendientes/ResumenPendientes";
import TablaPendientes from "../components/Pendientes/TablaPendientes";
import type { Usuario } from "../types/usuario";

interface Props {
  user: Usuario | null;
}

const Pendientes: React.FC<Props> = ({ user }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  // 1. Lógica para determinar si el usuario es un ENCARGADO
  const esEncargado = user?.rol === "ENCARGADO";

  // Lógica para el título principal si no es ENCARGADO
  const esRolPersonal = user?.rol === "USUARIO" || user?.rol === "INVITADO";
  const tituloNormal = esRolPersonal
    ? "MIS TAREAS PENDIENTES"
    : "TAREAS PENDIENTES"; // ADMIN/SUPER_ADMIN/USUARIO/INVITADO

  // Función helper para renderizar una sección completa, adaptada para aceptar viewType
  const renderSection = (
    title: string,
    viewType?: "MIS_TAREAS" | "ASIGNADAS"
  ) => (
    // La clave dinámica asegura que React trate cada sección como única
    <div key={viewType || "default-view"} className="mb-8">
      {/* Título dinámico aplicado */}
      <h1 className="text-3xl font-bold mb-3 text-center text-black tracking-wide font-sans">
        {title}
      </h1>

      <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 sm:pb-0">
        <div className="lg:static sticky top-[40px] md:top-[70px] z-40 bg-white border-b border-gray-200 m-1 px-1 pt-4 pb-1 lg:pb-4">
          {/* Se pasa el viewType al ResumenPendientes */}
          <ResumenPendientes
            key={`resumen-${viewType}-${refreshKey}`}
            user={user}
            viewType={viewType}
          />
        </div>
        <div className="px-1">
          {/* Se pasa el viewType a la TablaPendientes */}
          <TablaPendientes
            key={`tabla-${viewType}-${refreshKey}`}
            user={user}
            viewType={viewType}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative mx-auto max-w-7x2 px-6 lg:px-10 py-2">
      <button
        onClick={handleRefresh}
        className="
          p-2 bg-blue-600 text-white rounded-full shadow-lg 
          hover:bg-blue-700 active:scale-95 transition-all
          fixed bottom-20 right-6 z-50
          lg:absolute lg:top-20 lg:right-10 lg:bottom-auto
        "
        aria-label="Actualizar tareas"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-8 h-8"
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
          {/* SECCIÓN 1: MIS PENDIENTES (Tareas asignadas AL ENCARGADO) */}
          {/* viewType="MIS_TAREAS" fuerza el filtro por responsable = user.id */}
          {renderSection("MIS PENDIENTES", "MIS_TAREAS")}

          {/* SECCIÓN 2: ASIGNADAS (Tareas asignadas POR EL ENCARGADO) */}
          {/* viewType="ASIGNADAS" fuerza el filtro por asignador = user.id */}
          {renderSection("TAREAS ASIGNADAS", "ASIGNADAS")}
        </>
      ) : (
        // RENDERIZADO PARA SUPER_ADMIN, ADMIN, USUARIO, INVITADO
        // Se llama a la función una sola vez, omitiendo viewType.
        // El backend aplica el filtro de rol por defecto (Ver todo el depto para ADMIN, solo sus tareas para USUARIO).
        renderSection(tituloNormal)
      )}
    </div>
  );
};

export default Pendientes;
