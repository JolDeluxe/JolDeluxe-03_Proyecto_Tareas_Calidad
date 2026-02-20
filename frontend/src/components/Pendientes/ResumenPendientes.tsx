// 📍 src/components/Pendientes/ResumenPendientes.tsx

import React from "react";

type ActiveView = "MIS_TAREAS" | "ASIGNADAS" | "TODAS";

interface TotalesResumen {
  activas: number;
  pendientes: number;
  enRevision: number;
  concluidas: number;
  canceladas: number;
  todas: number;
}

interface Props {
  viewType?: ActiveView;
  filtro: string;
  onFiltroChange: (filtro: string) => void;
  conteo: TotalesResumen | null;
  loading?: boolean;
  // ✅ Nueva bandera para saber si ocultamos las otras pestañas
  isHoyActivo?: boolean;
}

const ResumenPendientes: React.FC<Props> = ({
  viewType,
  filtro,
  onFiltroChange,
  conteo,
  loading = false,
  isHoyActivo = false // por defecto false
}) => {
  const totalPendientes = conteo?.pendientes || 0;
  const totalRevision = conteo?.enRevision || 0;

  const totalActivas = totalPendientes + totalRevision;

  const titlePendientes = viewType === "ASIGNADAS" ? "Pendientes" : "Pendientes";
  const titleRevision = viewType === "ASIGNADAS" ? "Pendientes" : "En Revisión";

  const botonesNormales = [
    {
      id: "total",
      label: "Total Activas",
      value: totalActivas,
      baseDesktop: "bg-gray-100 border border-gray-400 text-gray-800",
      baseMobile: "bg-gray-100 border border-gray-300 text-gray-700",
      activeDesktop: "bg-gray-700 border border-gray-800 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-gray-700 border border-gray-800 text-white shadow-md",
      titleClassBase: "text-gray-900",
      titleClassActive: "text-white"
    },
    {
      id: "pendientes",
      label: titlePendientes,
      value: totalPendientes,
      baseDesktop: "bg-blue-100 border border-blue-400 text-blue-800",
      baseMobile: "bg-blue-100 border border-blue-300 text-blue-700",
      activeDesktop: "bg-blue-600 border border-blue-700 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-blue-600 border border-blue-700 text-white shadow-md",
      titleClassBase: "text-blue-900",
      titleClassActive: "text-white"
    },
    {
      id: "en_revision",
      label: titleRevision,
      value: totalRevision,
      baseDesktop: "bg-indigo-100 border border-indigo-400 text-indigo-800",
      baseMobile: "bg-indigo-100 border border-indigo-300 text-indigo-700",
      activeDesktop: "bg-indigo-600 border border-indigo-700 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-indigo-600 border border-indigo-700 text-white shadow-md",
      titleClassBase: "text-indigo-900",
      titleClassActive: "text-white"
    }
  ];

  // ✅ Lógica de Ocultamiento: Si "HOY" está activo, SOLO muestra "pendientes"
  const botonesVisibles = isHoyActivo
    ? botonesNormales.filter((btn) => btn.id === "pendientes")
    : botonesNormales;

  // Ajuste de columnas en escritorio: Si hay 1 botón, que no se estire demasiado usando grid-cols-1 y max-w-xs
  const gridClasses = isHoyActivo
    ? "grid-cols-1 max-w-sm"
    : "grid-cols-3 max-w-4xl";

  return (
    <>
      {/* 💻 VERSIÓN ESCRITORIO */}
      <div className={`hidden lg:grid gap-4 mb-2 mx-auto px-4 ${gridClasses} transition-all duration-300`}>
        {botonesVisibles.map((btn) => {
          const isActive = filtro === btn.id;

          return (
            <div
              key={btn.id}
              className="flex justify-center cursor-pointer select-none w-full animate-fade-in"
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
                  {loading ? "..." : btn.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 📱 VERSIÓN MÓVIL */}
      <div className="lg:hidden flex flex-col items-center mb-4 px-3 space-y-2 transition-all duration-300">
        {botonesVisibles.map((btn) => {
          const isActive = filtro === btn.id;
          return (
            <div
              key={btn.id}
              onClick={() => onFiltroChange(btn.id)}
              className={`
                flex justify-between items-center animate-fade-in
                w-60 md:w-80 max-w-xs px-4 py-2 
                rounded-full border shadow-sm cursor-pointer select-none transition-all duration-200
                ${isActive ? btn.activeMobile : btn.baseMobile}
              `}
            >
              <span className="text-center font-semibold text-[14px] md:text-[18px]">
                {btn.label}
              </span>
              <span className={`text-right font-bold text-[15px] md:text-[19px] opacity-90 ${isActive ? 'text-white' : ''}`}>
                {loading ? "..." : btn.value}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ResumenPendientes;