import React from "react";
import type { Usuario } from "../../../types/usuario";

interface Props {
  usuarios: Usuario[];
  onFilterChange: (filtro: string) => void;
  filtroActual: string;
  loading?: boolean;
}

const ResumenUsuarios: React.FC<Props> = ({ usuarios, onFilterChange, filtroActual, loading }) => {
  // Filtramos INVITADOS para el cálculo base global del Super Admin
  const usuariosValidos = usuarios.filter((u) => u.rol !== "INVITADO");

  const total = usuariosValidos.length;
  const adminCount = usuariosValidos.filter((u) => u.rol === "ADMIN").length;
  const encargadosCount = usuariosValidos.filter((u) => u.rol === "ENCARGADO").length;
  const usuariosCount = usuariosValidos.filter((u) => u.rol === "USUARIO").length;

  const botones = [
    {
      id: "ALL",
      label: "Todos",
      value: total,
      baseDesktop: "bg-indigo-50 border border-indigo-200 text-indigo-800",
      baseMobile: "bg-indigo-50 border border-indigo-200 text-indigo-800",
      activeDesktop: "bg-indigo-600 border border-indigo-700 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-indigo-600 border border-indigo-700 text-white shadow-md",
      titleClassBase: "text-indigo-900",
      titleClassActive: "text-white"
    },
    {
      id: "ADMIN",
      label: "Administrativos",
      value: adminCount,
      baseDesktop: "bg-blue-100 border border-blue-400 text-blue-800",
      baseMobile: "bg-blue-100 border border-blue-300 text-blue-700",
      activeDesktop: "bg-blue-600 border border-blue-700 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-blue-600 border border-blue-700 text-white shadow-md",
      titleClassBase: "text-blue-900",
      titleClassActive: "text-white"
    },
    {
      id: "ENCARGADO",
      label: "Encargados",
      value: encargadosCount,
      baseDesktop: "bg-amber-100 border border-amber-400 text-amber-800",
      baseMobile: "bg-amber-100 border border-amber-300 text-amber-700",
      activeDesktop: "bg-amber-500 border border-amber-600 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-amber-500 border border-amber-600 text-white shadow-md",
      titleClassBase: "text-amber-900",
      titleClassActive: "text-white"
    },
    {
      id: "USUARIO",
      label: "Operativos",
      value: usuariosCount,
      baseDesktop: "bg-slate-100 border border-slate-400 text-slate-800",
      baseMobile: "bg-slate-100 border border-slate-300 text-slate-700",
      activeDesktop: "bg-slate-700 border border-slate-800 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-slate-700 border border-slate-800 text-white shadow-md",
      titleClassBase: "text-slate-900",
      titleClassActive: "text-white"
    },
  ];

  return (
    <>
      {/* 💻 VERSIÓN ESCRITORIO */}
      <div className="hidden lg:grid grid-cols-4 gap-4 mb-2 w-full">
        {botones.map((btn) => {
          const isActive = filtroActual === btn.id;
          return (
            <div
              key={btn.id}
              className="flex justify-center cursor-pointer select-none transition-all duration-200 active:scale-95"
              onClick={() => !loading && onFilterChange(btn.id)}
            >
              <div className={`
                rounded-xl p-3 text-center shadow-sm w-full transition-all duration-200 border
                ${isActive ? btn.activeDesktop : btn.baseDesktop}
                ${loading ? "opacity-50 cursor-wait" : ""}
              `}>
                <div className="text-xs font-bold uppercase tracking-wider mb-1">
                  {btn.label}
                </div>
                <div className={`text-3xl font-extrabold ${isActive ? btn.titleClassActive : btn.titleClassBase}`}>
                  {loading ? "-" : btn.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 📱 VERSIÓN MÓVIL */}
      <div className="lg:hidden flex flex-col items-center mb-4 space-y-2">
        {botones.map((btn) => {
          const isActive = filtroActual === btn.id;
          return (
            <div
              key={btn.id}
              onClick={() => !loading && onFilterChange(isActive ? "ALL" : btn.id)}
              className={`
                flex justify-between items-center 
                w-[90%] max-w-sm px-5 py-3 
                rounded-full border shadow-sm cursor-pointer select-none transition-all duration-200 active:scale-95
                ${isActive ? btn.activeMobile : btn.baseMobile}
                ${loading ? "opacity-70 cursor-wait" : ""}
              `}
            >
              <span className="text-center font-bold text-[15px] uppercase">
                {btn.label}
              </span>
              <span className={`text-right font-extrabold text-[18px] opacity-90 ${isActive ? 'text-white' : ''}`}>
                {loading ? "..." : btn.value}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ResumenUsuarios;