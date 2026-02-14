import React from "react";
import { Rol } from "../../types/usuario";

interface Props {
  total: number; // Viene de meta.totalItems
  conteos: Record<string, number>; // Viene de meta.resumenRoles
  loading?: boolean;
  filtroActual: string;
  onFilterChange: (filtro: string) => void;
}

const ResumenUsuarios: React.FC<Props> = ({
  total,
  conteos,
  onFilterChange,
  filtroActual,
  loading,
}) => {

  // --- Definición de Botones ---
  const botones = [
    {
      id: "TODOS",
      label: "Total",
      // Usamos el total que viene del servidor
      value: total,
      baseDesktop: "bg-gray-100 border border-gray-400 text-gray-800",
      baseMobile: "bg-gray-100 border border-gray-300 text-gray-700",
      activeDesktop: "bg-gray-700 border border-gray-800 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-gray-700 border border-gray-800 text-white shadow-md",
      titleClassBase: "text-gray-900",
      titleClassActive: "text-white"
    },
    {
      id: Rol.ADMIN,
      label: "Gestión",
      // Obtenemos el valor directo del objeto de conteos del backend, o 0 si no existe
      value: conteos[Rol.ADMIN] || 0,
      baseDesktop: "bg-yellow-100 border border-yellow-400 text-yellow-800",
      baseMobile: "bg-yellow-100 border border-yellow-300 text-yellow-700",
      activeDesktop: "bg-yellow-500 border border-yellow-600 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-yellow-500 border border-yellow-600 text-white shadow-md",
      titleClassBase: "text-yellow-900",
      titleClassActive: "text-white"
    },
    {
      id: Rol.ENCARGADO,
      label: "Supervisión",
      value: conteos[Rol.ENCARGADO] || 0,
      baseDesktop: "bg-blue-100 border border-blue-400 text-blue-800",
      baseMobile: "bg-blue-100 border border-blue-300 text-blue-700",
      activeDesktop: "bg-blue-600 border border-blue-700 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-blue-600 border border-blue-700 text-white shadow-md",
      titleClassBase: "text-blue-900",
      titleClassActive: "text-white"
    },
    {
      id: Rol.USUARIO,
      label: "Operativo",
      value: conteos[Rol.USUARIO] || 0,
      baseDesktop: "bg-rose-100 border border-rose-400 text-rose-800",
      baseMobile: "bg-rose-100 border border-rose-300 text-rose-700",
      activeDesktop: "bg-rose-900 border border-rose-950 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-rose-900 border border-rose-950 text-white shadow-md",
      titleClassBase: "text-rose-900",
      titleClassActive: "text-white"
    },
  ];

  return (
    <>
      {/* 💻 VERSIÓN ESCRITORIO */}
      <div className="hidden lg:grid grid-cols-4 gap-4 mb-2 max-w-6xl mx-auto">
        {botones.map((btn) => {
          const isActive = filtroActual === btn.id;
          return (
            <div
              key={btn.id}
              className="flex justify-center cursor-pointer select-none"
              onClick={() => !loading && onFilterChange(btn.id)} // Prevenir clicks si carga
            >
              <div className={`
                rounded-lg p-2 text-center shadow-sm w-full transition-all duration-200
                ${isActive ? btn.activeDesktop : btn.baseDesktop}
                ${loading ? "opacity-50 cursor-wait" : ""}
              `}>
                <div className="text-md font-semibold">
                  {btn.label}
                </div>
                <div className={`text-2xl font-extrabold ${isActive ? btn.titleClassActive : btn.titleClassBase}`}>
                  {loading ? "-" : btn.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 📱 VERSIÓN MÓVIL */}
      <div className="lg:hidden flex flex-col items-center mb-4 px-3">
        {/* --- BLOQUE SUPERIOR: TOTAL --- */}
        <div className="w-full flex justify-center mb-4">
          <div
            onClick={() => !loading && onFilterChange(botones[0].id)}
            className={`
              flex justify-between items-center 
              w-60 md:w-80 max-w-xs px-4 py-2 
              rounded-full border shadow-sm cursor-pointer select-none transition-all duration-200
              ${filtroActual === botones[0].id ? botones[0].activeMobile : botones[0].baseMobile}
              ${loading ? "opacity-70" : ""}
            `}
          >
            <span className="text-center font-semibold text-[14px] md:text-[18px]">
              {botones[0].label}
            </span>
            <span className={`text-right font-bold text-[15px] md:text-[19px] opacity-90 ${filtroActual === botones[0].id ? 'text-white' : ''}`}>
              {loading ? "..." : botones[0].value}
            </span>
          </div>
        </div>

        {/* --- BLOQUE INFERIOR: ROLES --- */}
        <div className="flex flex-col items-center space-y-2 w-full">
          {botones.slice(1).map((btn) => {
            const isActive = filtroActual === btn.id;
            return (
              <div
                key={btn.id}
                onClick={() => !loading && onFilterChange(isActive ? "TODOS" : btn.id)}
                className={`
                  flex justify-between items-center 
                  w-60 md:w-80 max-w-xs px-4 py-2 
                  rounded-full border shadow-sm cursor-pointer select-none transition-all duration-200
                  ${isActive ? btn.activeMobile : btn.baseMobile}
                  ${loading ? "opacity-70" : ""}
                `}
              >
                <span className="text-center font-semibold text-[14px] md:text-[18px] flex items-center gap-1.5">
                  {btn.label}
                </span>
                <span className={`text-right font-bold text-[15px] md:text-[19px] opacity-90 ${isActive ? 'text-white' : ''}`}>
                  {loading ? "..." : btn.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ResumenUsuarios;