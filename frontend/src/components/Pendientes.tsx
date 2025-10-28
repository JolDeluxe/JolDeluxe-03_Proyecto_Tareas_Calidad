// 1. Importa 'useState'
import React, { useEffect, useState } from "react";
import TablaPendientes from "./Pendientes/TablaPendientes";
import ResumenPendientes from "./Pendientes/ResumenPendientes";

const Inicio: React.FC = () => {
  // 2. Añade el estado y la función para refrescar
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  // 🔋 Evitar suspensión del sistema (Tu código original)
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
          console.log("🔋 Bloqueo de suspensión activado");

          wakeLock.addEventListener("release", () => {
            console.log("⚠️ WakeLock liberado, intentando reactivar...");
          });
        }
      } catch (err) {
        console.error("Error al solicitar WakeLock:", err);
      }
    };

    requestWakeLock();

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") requestWakeLock();
    });

    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, []);

  return (
    // 3. Añade 'relative' al contenedor principal para posicionar el botón
    <div className="relative mx-auto max-w-7x2 px-6 lg:px-10">
      {/* 4. Aquí está el botón de recarga con SVG */}
      <button
        onClick={handleRefresh}
        className="absolute top-6 right-6 lg:right-10 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-transform"
        aria-label="Actualizar tareas"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
      </button>

      <h1 className="text-3xl font-bold mb-2 text-center text-black tracking-wide font-sans">
        TAREAS PENDIENTES | CALIDAD
      </h1>

      {/* 5. (Importante) Pasa las 'key' para forzar la recarga */}
      <ResumenPendientes key={`resumen-${refreshKey}`} />

      <div className="max-h-[calc(100vh-300)] shadow-lg rounded-lg border border-gray-400 overflow-hidden bg-white">
        <TablaPendientes key={`tabla-${refreshKey}`} />
      </div>
    </div>
  );
};

export default Inicio;
