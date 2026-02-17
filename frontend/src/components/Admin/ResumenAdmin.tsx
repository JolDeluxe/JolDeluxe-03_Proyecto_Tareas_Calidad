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
}

const ResumenAdmin: React.FC<ResumenPrincipalProps> = ({
  filtro,
  onFiltroChange,
  conteo,
  loading,
}) => {
  // Valores calculados
  const pendientes = conteo?.pendientes || 0;
  const enRevision = conteo?.enRevision || 0;
  const concluidas = conteo?.concluidas || 0;

  // ✅ Total Operativo: Suma exacta de lo visualizado (sin canceladas)
  const totalOperativo = pendientes + enRevision + concluidas;

  const botones = [
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32 text-gray-500 italic">
        Cargando resumen...
      </div>
    );
  }

  return (
    <>
      {/* 💻 VERSIÓN ESCRITORIO (Ajustada a text-md y text-2xl) */}
      <div className="hidden lg:grid grid-cols-4 gap-4 mb-2 max-w-6xl mx-auto">
        {botones.map((btn) => {
          const isActive = filtro === btn.id;
          return (
            <div
              key={btn.id}
              className="flex justify-center cursor-pointer select-none"
              onClick={() => onFiltroChange(btn.id)}
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

      {/* 📱 VERSIÓN MÓVIL (Ajustada a text-[14px]/[18px] y [15px]/[19px]) */}
      <div className="lg:hidden flex flex-col items-center mb-4 px-3">
        {/* Bloque Superior: Total (Siguiendo estructura de Usuarios) */}
        <div className="w-full flex justify-center mb-4">
          <div
            onClick={() => onFiltroChange(botones[0].id)}
            className={`
              flex justify-between items-center 
              w-60 md:w-80 max-w-xs px-4 py-2 
              rounded-full border shadow-sm cursor-pointer select-none transition-all duration-200
              ${filtro === botones[0].id ? botones[0].activeMobile : botones[0].baseMobile}
            `}
          >
            <span className="text-center font-semibold text-[14px] md:text-[18px]">
              {botones[0].label}
            </span>
            <span className={`text-right font-bold text-[15px] md:text-[19px] opacity-90 ${filtro === botones[0].id ? 'text-white' : ''}`}>
              {botones[0].value}
            </span>
          </div>
        </div>

        {/* Bloque Inferior: Estatus específicos */}
        <div className="flex flex-col items-center space-y-2 w-full">
          {botones.slice(1).map((btn) => {
            const isActive = filtro === btn.id;
            return (
              <div
                key={btn.id}
                onClick={() => onFiltroChange(btn.id)}
                className={`
                  flex justify-between items-center 
                  w-60 md:w-80 max-w-xs px-4 py-2 
                  rounded-full border shadow-sm cursor-pointer select-none transition-all duration-200
                  ${isActive ? btn.activeMobile : btn.baseMobile}
                `}
              >
                <span className="text-center font-semibold text-[14px] md:text-[18px] flex items-center gap-1.5">
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