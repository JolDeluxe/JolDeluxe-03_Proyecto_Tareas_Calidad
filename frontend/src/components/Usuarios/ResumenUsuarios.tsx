import React, { useMemo } from "react";
import type { Usuario } from "../../types/usuario";
import { Rol } from "../../types/usuario";

interface Props {
  usuarios: Usuario[];
  loading?: boolean;
  query?: string;
  filtroActual: string;
  onFilterChange: (filtro: string) => void;
}

const ResumenUsuarios: React.FC<Props> = ({
  usuarios,
  onFilterChange,
  filtroActual,
  loading,
  query
}) => {

  // --- 1. Cálculo de Métricas (Solo Activos e ignorando Invitados) ---
  const metricas = useMemo(() => {
    if (!usuarios || !Array.isArray(usuarios)) {
      return { admins: 0, encargados: 0, usuarios: 0, total: 0 };
    }
    // Omitimos inactivos y omitimos invitados según tu regla de negocio
    const personalActivo = usuarios.filter(u => u.estatus === "ACTIVO" && u.rol !== Rol.INVITADO);

    return {
      admins: personalActivo.filter((u) => u.rol === Rol.ADMIN).length,
      encargados: personalActivo.filter((u) => u.rol === Rol.ENCARGADO).length,
      usuarios: personalActivo.filter((u) => u.rol === Rol.USUARIO).length,
      total: personalActivo.length
    };
  }, [usuarios]);

  // --- 2. Definición de Botones (Estilos idénticos a ResumenAdmin) ---
  const botones = [
    {
      id: "TODOS",
      label: "Total",
      value: metricas.total,
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
      value: metricas.admins,
      baseDesktop: "bg-yellow-100 border border-yellow-400 text-yellow-800",
      baseMobile: "bg-yellow-100 border border-yellow-300 text-yellow-700",
      activeDesktop: "bg-yellow-500 border border-yellow-600 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-yellow-500 border border-yellow-600 text-white shadow-md",
      titleClassBase: "text-yellow-900",
      titleClassActive: "text-white"
    },
    {
      id: Rol.ENCARGADO,
      label: "Coordinadores",
      value: metricas.encargados,
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
      value: metricas.usuarios,
      baseDesktop: "bg-rose-100 border border-rose-400 text-rose-800",
      baseMobile: "bg-rose-100 border border-rose-300 text-rose-700",
      activeDesktop: "bg-rose-900 border border-rose-950 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-rose-900 border border-rose-950 text-white shadow-md",
      titleClassBase: "text-rose-900",
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
      {/* Mensaje de búsqueda si existe */}

      {/* 💻 VERSIÓN ESCRITORIO (Estilo Tarjetas exactas a ResumenAdmin) */}
      <div className="hidden lg:grid grid-cols-4 gap-4 mb-2 max-w-6xl mx-auto">
        {botones.map((btn) => {
          const isActive = filtroActual === btn.id;
          return (
            <div
              key={btn.id}
              className="flex justify-center cursor-pointer select-none"
              onClick={() => onFilterChange(btn.id)}
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

      {/* 📱 VERSIÓN MÓVIL (Jerarquía Vertical Solicitada) */}
      <div className="lg:hidden flex flex-col items-center mb-4 px-3">

        {/* --- BLOQUE SUPERIOR: TOTAL --- */}
        <div className="w-full flex justify-center mb-4">
          <div
            onClick={() => onFilterChange(botones[0].id)}
            className={`
              flex justify-between items-center 
              w-60 md:w-80 max-w-xs px-4 py-2 
              rounded-full border shadow-sm cursor-pointer select-none transition-all duration-200
              ${filtroActual === botones[0].id ? botones[0].activeMobile : botones[0].baseMobile}
            `}
          >
            <span className="text-center font-semibold text-[14px] md:text-[18px]">
              {botones[0].label}
            </span>
            <span className={`text-right font-bold text-[15px] md:text-[19px] opacity-90 ${filtroActual === botones[0].id ? 'text-white' : ''}`}>
              {botones[0].value}
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
                onClick={() => onFilterChange(isActive ? "TODOS" : btn.id)}
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

export default ResumenUsuarios;