// 📍 src/components/Admin/ResumenAdmin.tsx

import React from "react";

// Estructura de los contadores que devuelve el Backend (resumen.totales)
interface TotalesResumen {
  activas: number;
  pendientes: number;
  enRevision: number;
  concluidas: number;
  canceladas: number;
  todas: number;
}

interface ResumenPrincipalProps {
  filtro: string;
  onFiltroChange: (filtro: string) => void;
  conteo: TotalesResumen | null;
  loading: boolean;
  // ✅ NUEVO: Recibimos el estado de la papelera
  verCanceladas?: boolean;
}

const ResumenAdmin: React.FC<ResumenPrincipalProps> = ({
  filtro,
  onFiltroChange,
  conteo,
  loading,
  verCanceladas = false, // Valor por defecto false
}) => {
  // Valores calculados
  const pendientes = conteo?.pendientes || 0;
  const enRevision = conteo?.enRevision || 0;
  const concluidas = conteo?.concluidas || 0;
  const canceladas = conteo?.canceladas || 0; // ✅ Obtenemos canceladas

  // ✅ Total Operativo: Suma exacta de lo visualizado (sin canceladas)
  const totalOperativo = pendientes + enRevision + concluidas;

  // 1. Configuración de botones normales
  const botonesNormales = [
    {
      id: "total",
      label: "Total",
      value: totalOperativo,
      baseDesktop: "bg-gray-100 border border-gray-400 text-gray-800",
      baseMobile: "bg-gray-100 border border-gray-300 text-gray-700",
      activeDesktop: "bg-gray-700 border border-gray-800 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-gray-700 border border-gray-800 text-white shadow-md",
      titleClassBase: "text-gray-900",
      titleClassActive: "text-white"
    },
    {
      id: "pendientes",
      label: "Pendientes",
      value: pendientes,
      baseDesktop: "bg-blue-100 border border-blue-400 text-blue-800",
      baseMobile: "bg-blue-100 border border-blue-300 text-blue-700",
      activeDesktop: "bg-blue-600 border border-blue-700 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-blue-600 border border-blue-700 text-white shadow-md",
      titleClassBase: "text-blue-900",
      titleClassActive: "text-white"
    },
    {
      id: "en_revision",
      label: "En Revisión",
      value: enRevision,
      baseDesktop: "bg-indigo-100 border border-indigo-400 text-indigo-800",
      baseMobile: "bg-indigo-100 border border-indigo-300 text-indigo-700",
      activeDesktop: "bg-indigo-600 border border-indigo-700 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-indigo-600 border border-indigo-700 text-white shadow-md",
      titleClassBase: "text-indigo-900",
      titleClassActive: "text-white"
    },
    {
      id: "concluidas",
      label: "Concluidas",
      value: concluidas,
      baseDesktop: "bg-green-100 border border-green-400 text-green-800",
      baseMobile: "bg-green-100 border border-green-300 text-green-700",
      activeDesktop: "bg-green-600 border border-green-700 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-green-600 border border-green-700 text-white shadow-md",
      titleClassBase: "text-green-900",
      titleClassActive: "text-white"
    },
  ];

  // 2. Configuración del botón SOLO para canceladas (Rojo)
  const botonCanceladas = [
    {
      id: "canceladas", // Este ID coincide con lo que mandamos desde Admin.tsx
      label: "Total Canceladas",
      value: canceladas,
      // Estilos Rojos
      baseDesktop: "bg-red-100 border border-red-400 text-red-800",
      baseMobile: "bg-red-100 border border-red-300 text-red-700",
      // Como siempre estará activo en este modo, usamos el estilo activo por defecto o el base reforzado
      activeDesktop: "bg-red-600 border border-red-700 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-red-600 border border-red-700 text-white shadow-md",
      titleClassBase: "text-red-900",
      titleClassActive: "text-white"
    }
  ];

  // ✅ 3. Decidir qué botones mostrar
  const botonesAMostrar = verCanceladas ? botonCanceladas : botonesNormales;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32 text-gray-500 italic">
        Cargando resumen...
      </div>
    );
  }

  return (
    <>
      {/* 💻 VERSIÓN ESCRITORIO */}
      {/* Si es canceladas, usamos flex para centrar el único botón, si no, grid de 4 */}
      <div className={`hidden lg:grid gap-4 mb-2 max-w-6xl mx-auto ${verCanceladas ? 'grid-cols-1 place-items-center' : 'grid-cols-4'}`}>
        {botonesAMostrar.map((btn) => {
          // Si estamos en modo canceladas, forzamos que parezca activo o usamos el estilo base pero resaltado
          const isActive = verCanceladas ? true : filtro === btn.id;

          return (
            <div
              key={btn.id}
              className={`flex justify-center cursor-pointer select-none ${verCanceladas ? 'w-1/3' : 'w-full'}`} // Si es cancelada, limitamos el ancho
              onClick={() => !verCanceladas && onFiltroChange(btn.id)} // Desactivamos click si es solo visualización de canceladas
            >
              <div className={`
                rounded-lg p-2 text-center shadow-sm w-full transition-all duration-200
                ${isActive ? btn.activeDesktop : btn.baseDesktop}
              `}>
                <div className="text-md font-semibold">
                  {btn.label}
                </div>
                <div className={`text-2xl font-extrabold ${isActive ? btn.titleClassActive : btn.titleClassBase}`}>
                  {btn.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 📱 VERSIÓN MÓVIL */}
      <div className="lg:hidden flex flex-col items-center mb-4 px-3">
        {/* Renderizamos la lista dinámica */}
        <div className="w-full flex flex-col items-center space-y-2">
          {botonesAMostrar.map((btn) => {
            const isActive = verCanceladas ? true : filtro === btn.id;
            return (
              <div
                key={btn.id}
                onClick={() => !verCanceladas && onFiltroChange(btn.id)}
                className={`
                  flex justify-between items-center 
                  w-60 md:w-80 max-w-xs px-4 py-2 
                  rounded-full border shadow-sm cursor-pointer select-none transition-all duration-200
                  ${isActive ? btn.activeMobile : btn.baseMobile}
                `}
              >
                <span className="text-center font-semibold text-[14px] md:text-[18px]">
                  {btn.label}
                </span>
                <span className={`text-right font-bold text-[15px] md:text-[19px] opacity-90 ${isActive ? 'text-white' : ''}`}>
                  {btn.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ResumenAdmin;