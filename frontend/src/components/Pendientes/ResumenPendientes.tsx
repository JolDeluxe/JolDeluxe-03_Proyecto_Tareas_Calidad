import React, { useState, useEffect } from "react";
import { api } from "../data/api"; // 👈 Asegúrate que esta ruta sea correcta

// 🔹 Puntero redondo como SVG (toma el color de currentColor)
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

  // 🔹 FUNCIÓN CENTRAL DE CARGA DE DATOS
  // 💡 Mantenemos la función separada para llamarla en el intervalo
  const fetchPendientes = async () => {
    try {
      // ❌ No usamos setLoading(true) aquí para evitar parpadeo en cada intervalo.
      const res = await api.get("/tareas");

      // Filtra por estatus exactamente "PENDIENTE"
      const pendientes = res.data.filter(
        (t: any) => t.estatus?.toUpperCase() === "PENDIENTE"
      );

      setTotalPendientes(pendientes.length);
    } catch (error) {
      console.error("Error al cargar tareas pendientes:", error);
    }
    // ❌ No usamos finally aquí para no interferir con el loading inicial.
  };

  // 🔄 POLLING: Cargar tareas inicialmente y luego cada 30 segundos
  useEffect(() => {
    // 1. Carga inicial (con indicador de carga)
    const initialFetch = async () => {
      setLoading(true);
      await fetchPendientes();
      setLoading(false);
    };

    initialFetch();

    // 2. Configurar el intervalo de recarga (Polling)
    const intervalId = setInterval(() => {
      console.log("🔄 Recargando resumen de pendientes automáticamente...");
      fetchPendientes();
    }, 30000); // 30000 ms = 30 segundos

    // 3. Limpieza: Detener el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, []); // El array vacío asegura que solo se configure una vez

  return (
    <>
      {/* 💻 VERSIÓN ESCRITORIO */}
      <div className="hidden sm:grid grid-cols-4 gap-4 mb-2">
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

      {/* 📱 VERSIÓN MÓVIL */}
      <div className="sm:hidden flex flex-wrap justify-center text-xs font-semibold text-gray-700 mb-4 px-2 text-center leading-relaxed">
        <span className="mx-2 whitespace-nowrap text-amber-900">
          <Dot className="text-amber-900" title="Pendientes" />
          Pendientes:{" "}
          <span className="font-bold text-amber-900">
            {loading ? "..." : totalPendientes}
          </span>
        </span>
      </div>
    </>
  );
};

export default ResumenPendientes;
