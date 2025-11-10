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

  // 1. Lógica para definir el título según el rol
  const esRolPersonal = user?.rol === "USUARIO" || user?.rol === "INVITADO";
  const titulo = esRolPersonal ? "MIS TAREAS PENDIENTES" : "TAREAS PENDIENTES";

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

      {/* 2. Título dinámico aplicado */}
      <h1 className="text-3xl font-bold mb-3 text-center text-black tracking-wide font-sans">
        {titulo}
      </h1>

      <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 sm:pb-0">
        <div className="lg:static sticky top-[40px] md:top-[70px] z-40 bg-white border-b border-gray-200 m-1 px-1 pt-4 pb-1 lg:pb-4">
          {/* Los errores aquí son normales, los arreglamos en el paso 2 */}
          <ResumenPendientes key={`resumen-${refreshKey}`} user={user} />
        </div>
        <div className="px-1">
          {/* Los errores aquí son normales, los arreglamos en el paso 3 */}
          <TablaPendientes key={`tabla-${refreshKey}`} user={user} />
        </div>
      </div>
    </div>
  );
};

export default Pendientes;
