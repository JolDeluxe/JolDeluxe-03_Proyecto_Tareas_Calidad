import React from "react";
import type { Departamento } from "../../../api/departamentos.service";

interface Props {
  deptos: Departamento[];
  loading: boolean;
}

const ResumenDeptos = ({ deptos, loading }: Props) => {
  const totalDeptos = deptos.length;
  const totalPersonal = deptos.reduce((acc, d) => acc + (d._count?.usuarios || 0), 0);

  const stats = [
    {
      id: "TOTAL",
      label: "Total Áreas Operativas",
      value: totalDeptos,
      color: "bg-indigo-600 border-indigo-700",
      textColor: "text-indigo-900",
      baseDesktop: "bg-indigo-50 border border-indigo-200",
      baseMobile: "bg-indigo-600 border border-indigo-700 text-white"
    },
    {
      id: "PERSONAL",
      label: "Personal Total Asignado",
      value: totalPersonal,
      color: "bg-emerald-600 border-emerald-700",
      textColor: "text-emerald-900",
      baseDesktop: "bg-emerald-50 border border-emerald-200",
      baseMobile: "bg-emerald-600 border border-emerald-700 text-white"
    }
  ];

  return (
    <>
      {/* 💻 VERSIÓN ESCRITORIO */}
      <div className="hidden lg:grid grid-cols-2 gap-4 mb-2 max-w-4xl mx-auto">
        {stats.map((stat) => (
          <div key={stat.id} className={`rounded-xl p-4 text-center shadow-sm w-full border ${stat.baseDesktop}`}>
            <div className={`text-sm font-bold uppercase tracking-wider mb-1 ${stat.textColor}`}>
              {stat.label}
            </div>
            <div className={`text-4xl font-extrabold ${stat.textColor}`}>
              {loading ? "-" : stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* 📱 VERSIÓN MÓVIL */}
      <div className="lg:hidden flex flex-col items-center mb-4 space-y-2">
        {stats.map((stat) => (
          <div key={stat.id} className={`flex justify-between items-center w-[90%] max-w-sm px-5 py-3 rounded-full border shadow-md ${stat.baseMobile}`}>
            <span className="text-center font-bold text-[15px] uppercase">
              {stat.label}
            </span>
            <span className="text-right font-extrabold text-[19px] opacity-90">
              {loading ? "..." : stat.value}
            </span>
          </div>
        ))}
      </div>
    </>
  );
};

export default ResumenDeptos;