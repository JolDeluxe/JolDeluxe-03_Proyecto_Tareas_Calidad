// src/components/Pendientes/ResumenPendientes.tsx

import React, { useState, useEffect } from "react";
// 1. Importa tu NUEVO servicio
import { tareasService } from "../../api/tareas.service";
// 2. Importa el tipo (ajusta la ruta si es necesario)
import type { Tarea } from "../../types/tarea";

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

const ResumenPendientes: React.FC = () => {
  const [totalPendientes, setTotalPendientes] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // 🔹 FUNCIÓN CENTRAL DE CARGA DE DATOS (MODIFICADA)
  const fetchPendientes = async () => {
    try {
      // 3. Llama al método del servicio
      const todasLasTareas = await tareasService.getAll();

      // 4. Filtra por estatus "PENDIENTE"
      // (Usamos el tipo Tarea, por lo que comparamos directamente)
      const pendientes = todasLasTareas.filter(
        (t: Tarea) => t.estatus === "PENDIENTE"
      );

      setTotalPendientes(pendientes.length);
    } catch (error) {
      console.error("Error al cargar tareas pendientes:", error);
    }
  };

  // 🔄 POLLING: (Sin cambios)
  useEffect(() => {
    const initialFetch = async () => {
      setLoading(true);
      await fetchPendientes();
      setLoading(false);
    };

    initialFetch();

    const intervalId = setInterval(() => {
      console.log("🔄 Recargando resumen de pendientes automáticamente...");
      fetchPendientes();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      {/* 💻 VERSIÓN ESCRITORIO */}
      <div className="hidden lg:grid grid-cols-4 gap-4 mb-2">
        <div className="col-span-4 flex justify-center">
          <div className="bg-blue-100 border border-blue-400 rounded-lg p-2 text-center shadow-sm w-full max-w-md">
            <div className="text-md font-semibold text-blue-800">
              Total de Pendientes
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
          {/* 🔹 Texto a la izquierda (con tu componente Dot) */}
          <span
            className="
          text-center font-semibold 
          text-[14px] 
          md:text-[18px]
          flex items-center gap-1.5"
          >
            {/* Usamos 'text-blue-700' para que la bolita combine */}
            Pendientes
          </span>

          {/* 🔸 Número a la derecha */}
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
