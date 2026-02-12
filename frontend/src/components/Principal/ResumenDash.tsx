// 📍 src/components/Principal/ResumenDash.tsx

import React from "react";
import type { Tarea } from "../../types/tarea";
import type { Usuario } from "../../types/usuario";

interface ResumenPrincipalPropsDash {
  year: number;
  month: number;
  responsable: string;
  query: string;
  tareas: Tarea[];
  loading: boolean;
  user: Usuario | null;
}

const ResumenPrincipalDash: React.FC<ResumenPrincipalPropsDash> = ({
  year,
  month,
  responsable,
  query,
  tareas,
  loading,
  user,
}) => {
  // --- 1. Lógica de Filtrado ---
  const filtrarPorFecha = (fecha: Date | string | null): boolean => {
    if (!fecha) return false;
    const dateObj = fecha instanceof Date ? fecha : new Date(fecha);
    if (isNaN(dateObj.getTime())) return false;
    const y = dateObj.getFullYear();
    const m = dateObj.getMonth() + 1;
    if (y !== year) return false;
    if (month !== 0 && m !== month) return false;
    return true;
  };

  const tareasFiltradas = tareas.filter((t) => {
    const pasaFecha = filtrarPorFecha(t.fechaRegistro);
    const pasaResponsable =
      responsable === "Todos" ||
      t.responsables.some((r) => r.id.toString() === responsable);

    const texto = `${t.tarea} ${t.observaciones || ""}`.toLowerCase();
    const pasaBusqueda =
      query.trim() === "" || texto.includes(query.toLowerCase());

    return pasaFecha && pasaResponsable && pasaBusqueda;
  });

  // --- 2. Cálculos Numéricos ---
  const total = tareasFiltradas.length;

  const pendientes = tareasFiltradas.filter(
    (t) => t.estatus.toUpperCase() === "PENDIENTE"
  ).length;

  const concluidas = tareasFiltradas.filter(
    (t) => t.estatus.toUpperCase() === "CONCLUIDA"
  ).length;

  const canceladas = tareasFiltradas.filter(
    (t) => t.estatus.toUpperCase() === "CANCELADA"
  ).length;

  // 🚀 Cálculo de "Activas" para el denominador de porcentaje real (opcional)
  // Pero para este resumen general, solemos querer ver el % del pastel total.
  const getPercent = (val: number) => {
    if (total === 0) return 0;
    return Math.round((val / total) * 100);
  };

  const botones = [
    {
      id: "pendientes",
      label: "Pendientes",
      color: "blue",
      value: pendientes,
      percent: getPercent(pendientes),
    },
    {
      id: "concluidas",
      label: "Concluidas",
      color: "green",
      value: concluidas,
      percent: getPercent(concluidas),
    },
    {
      id: "canceladas",
      label: "Canceladas",
      color: "red", // Ojo: Las mantenemos rojas aquí para que se vean, pero no afectan DashboardMetricas
      value: canceladas,
      percent: getPercent(canceladas),
    },
    {
      id: "total",
      label: "Total Registros",
      color: "gray",
      value: total,
      percent: 100,
    },
  ];

  if (loading) {
    return (
      <div className="text-2xl font-extrabold text-blue-900 justify-center text-center animate-pulse mt-4">
        ...
      </div>
    );
  }

  return (
    <>
      {/* 💻 Versión Escritorio */}
      <div className="hidden lg:grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center font-sans">
        {botones.map((btn) => {
          const styleMap: Record<string, string> = {
            blue: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:shadow-blue-100",
            green: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 hover:shadow-green-100",
            red: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 hover:shadow-red-100",
            gray: "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400 hover:shadow-gray-200",
          };

          return (
            <div
              key={btn.id}
              className={`
                rounded-xl p-4 border 
                transition-all duration-300 ease-in-out
                transform hover:-translate-y-1 hover:shadow-lg
                cursor-default select-none
                ${styleMap[btn.color] || styleMap.gray}
              `}
            >
              <div className="text-xs uppercase tracking-wider font-bold opacity-70 mb-1">
                {btn.label}
              </div>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-4xl font-black tracking-tight">
                  {btn.value}
                </span>
                <span className="text-lg font-semibold opacity-60">
                  ({btn.percent}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 📱 Versión Móvil */}
      <div className="lg:hidden grid grid-cols-2 gap-2 mb-4 px-1 text-[12px] md:text-[15px] font-semibold text-center">
        {botones.map((btn) => {
          const mobileStyle = {
            blue: "bg-blue-50 border-blue-200 text-blue-800 active:bg-blue-100",
            green: "bg-green-50 border-green-200 text-green-800 active:bg-green-100",
            red: "bg-red-50 border-red-200 text-red-800 active:bg-red-100",
            gray: "bg-gray-100 border-gray-300 text-gray-800 active:bg-gray-200",
          }[btn.color];

          return (
            <div
              key={btn.id}
              className={`
                flex flex-col justify-center items-center 
                w-full py-3 rounded-lg border shadow-sm 
                transition-colors duration-200
                ${mobileStyle}
              `}
            >
              <span className="opacity-80 text-[11px] uppercase mb-0.5">
                {btn.label}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-2xl leading-none">
                  {btn.value}
                </span>
                <span className="text-xs font-medium opacity-70">
                  ({btn.percent}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ResumenPrincipalDash;