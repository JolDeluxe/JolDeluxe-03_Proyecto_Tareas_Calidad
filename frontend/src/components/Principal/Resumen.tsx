// 📍 src/components/Principal/Resumen.tsx

import React from "react";
import type { Tarea } from "../../types/tarea";
import type { Usuario } from "../../types/usuario";

interface ResumenPrincipalProps {
  filtro: string;
  onFiltroChange: (filtro: string) => void;
  year: number;
  month: number;
  responsable: string;
  query: string;
  tareas: Tarea[];
  loading: boolean;
  user: Usuario | null;
}

const ResumenPrincipal: React.FC<ResumenPrincipalProps> = ({
  filtro,
  onFiltroChange,
  year,
  month,
  responsable,
  query,
  tareas,
  loading,
  user,
}) => {
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

  // 1. Filtramos primero por los criterios globales (Fecha, Responsable, Búsqueda)
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

  // 2. Calculamos contadores (Excluyendo basura)
  const pendientes = tareasFiltradas.filter(
    (t) => t.estatus.toUpperCase() === "PENDIENTE"
  ).length;

  const concluidas = tareasFiltradas.filter(
    (t) => t.estatus.toUpperCase() === "CONCLUIDA"
  ).length;

  // 🔥 LÓGICA DE NEGOCIO MEJORADA: 
  // El Total ahora representa la "Carga Real de Trabajo" (Pendientes + Hechas).
  // Las canceladas se ignoran para no inflar los números falsamente.
  const total = pendientes + concluidas;

  const botones = [
    { id: "pendientes", label: "Pendientes", color: "blue", value: pendientes },
    {
      id: "concluidas",
      label: "Concluidas",
      color: "green",
      value: concluidas,
    },
    // Botón "Canceladas" eliminado por diseño
    { id: "total", label: "Carga Real", color: "gray", value: total },
  ];

  if (loading) {
    return (
      <div className="text-2xl font-extrabold text-blue-900 justify-center text-center py-4">
        ...
      </div>
    );
  }

  return (
    <>
      {/* 💻 Versión escritorio */}
      <div className="hidden lg:grid grid-cols-3 gap-4 mb-6 text-center font-sans max-w-4xl mx-auto">
        {botones.map((btn) => {
          const isActive = filtro === btn.id;

          // Mapas de colores
          const baseColors: Record<string, string> = {
            blue: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
            green: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
            gray: "bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200",
          };

          const activeColors: Record<string, string> = {
            blue: "bg-blue-700 text-white border-blue-700 shadow-md ring-2 ring-blue-200",
            green: "bg-green-700 text-white border-green-700 shadow-md ring-2 ring-green-200",
            gray: "bg-gray-700 text-white border-gray-700 shadow-md ring-2 ring-gray-200",
          };

          return (
            <button
              key={btn.id}
              onClick={() => onFiltroChange(btn.id)}
              className={`
                rounded-xl p-4 border font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1
                ${isActive ? activeColors[btn.color] : baseColors[btn.color]}
              `}
            >
              <div className="text-xs uppercase tracking-wider font-bold opacity-90">{btn.label}</div>
              <div className="text-3xl font-extrabold">{btn.value}</div>
            </button>
          );
        })}
      </div>

      {/* 📱 Versión móvil */}
      <div className="lg:hidden grid grid-cols-3 gap-2 mb-3 px-1 text-[13px] font-semibold text-gray-700 text-center">
        {botones.map((btn) => {
          const isActive = filtro === btn.id;

          const activeClass = isActive
            ? `bg-${btn.color}-700 text-white border-${btn.color}-700 shadow-md`
            : `bg-${btn.color}-50 text-${btn.color}-700 border-${btn.color}-200`;

          return (
            <button
              key={btn.id}
              onClick={() => onFiltroChange(btn.id)}
              className={`
                flex flex-col justify-center items-center w-full py-2 rounded-lg border transition-all duration-200
                ${activeClass}
              `}
            >
              <span className="text-[10px] uppercase opacity-90">{btn.label}</span>
              <span className="text-lg font-bold leading-none mt-0.5">
                {btn.value}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default ResumenPrincipal;