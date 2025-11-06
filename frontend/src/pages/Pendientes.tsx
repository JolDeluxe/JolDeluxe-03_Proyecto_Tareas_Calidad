// pages/Pendientes.tsx
import React, { useEffect, useState } from "react";
import ResumenPendientes from "../components/Pendientes/ResumenPendientes";
import TablaPendientes from "../components/Pendientes/TablaPendientes";

const Inicio: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  };

  // 🔋 Evitar suspensión del sistema (tu código original)
  // useEffect(() => {
  //   let wakeLock: any = null;

  //   const requestWakeLock = async () => {
  //     try {
  //       if ("wakeLock" in navigator) {
  //         wakeLock = await navigator.wakeLock.request("screen");
  //         console.log("🔋 Bloqueo de suspensión activado");

  //         wakeLock.addEventListener("release", () => {
  //           console.log("⚠️ WakeLock liberado, intentando reactivar...");
  //         });
  //       }
  //     } catch (err) {
  //       console.error("Error al solicitar WakeLock:", err);
  //     }
  //   };

  //   requestWakeLock();

  //   document.addEventListener("visibilitychange", () => {
  //     if (document.visibilityState === "visible") requestWakeLock();
  //   });

  //   return () => {
  //     if (wakeLock) wakeLock.release();
  //   };
  // }, []);

  return (
    <div className="relative mx-auto max-w-7x2 px-6 lg:px-10 py-2">
      <button
        onClick={handleRefresh}
        className="
          p-2 bg-blue-600 text-white rounded-full shadow-lg 
          hover:bg-blue-700 active:scale-95 transition-all
          
          /* --- Móvil/Tablet: Fijo en la esquina --- */
          fixed bottom-20 right-6 z-50
          
          /* --- Escritorio (lg): 
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

      <h1 className="text-3xl font-bold mb-3 text-center text-black tracking-wide font-sans">
        TAREAS PENDIENTES
      </h1>
      <div className="shadow-lg rounded-lg border border-gray-400 bg-white overflow-visible pb-5 sm:pb-0">
        <div className="lg:static sticky top-[40px] md:top-[70px] z-40 bg-white border-b border-gray-200 m-1 px-1 pt-4 pb-1 lg:pb-4">
          <ResumenPendientes key={`resumen-${refreshKey}`} />
        </div>
        <div className="px-1">
          <TablaPendientes key={`tabla-${refreshKey}`} />
        </div>
      </div>
    </div>
  );
};

export default Inicio;
