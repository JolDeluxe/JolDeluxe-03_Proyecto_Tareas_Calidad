// 📍 src/components/Admin/ResumenAdmin.tsx

import React from "react";
import type { Tarea } from "../../types/tarea";
import type { Usuario } from "../../types/usuario";

interface ResumenPrincipalProps {
  filtro: string;
  onFiltroChange: (filtro: string) => void;
  responsable: string;
  query: string;
  tareas: Tarea[];
  loading: boolean;
  user: Usuario | null;
}

const ResumenAdmin: React.FC<ResumenPrincipalProps> = ({
  filtro,
  onFiltroChange,
  responsable,
  query,
  tareas,
  loading,
  // user,
}) => {

  // 1. Filtrado base
  const tareasFiltradas = tareas.filter((t) => {
    const pasaResponsable =
      responsable === "Todos" ||
      t.responsables.some((r) => r.id.toString() === responsable);

    const texto = `${t.tarea} ${t.observaciones || ""}`.toLowerCase();
    const pasaBusqueda =
      query.trim() === "" || texto.includes(query.toLowerCase());

    return pasaResponsable && pasaBusqueda;
  });

  // 2. Cálculo de Contadores
  const pendientes = tareasFiltradas.filter(
    (t) => t.estatus.toUpperCase() === "PENDIENTE"
  ).length;

  const enRevision = tareasFiltradas.filter(
    (t) => t.estatus.toUpperCase() === "EN_REVISION"
  ).length;

  const concluidas = tareasFiltradas.filter(
    (t) => t.estatus.toUpperCase() === "CONCLUIDA"
  ).length;

  const totalActivo = pendientes + enRevision + concluidas;

  const botones = [
    {
      id: "pendientes",
      label: "Pendientes",
      value: pendientes,
      // Estilos Base (Inactivos)
      baseDesktop: "bg-blue-100 border border-blue-400 text-blue-800",
      baseMobile: "bg-blue-100 border border-blue-300 text-blue-700",
      // Estilos Activos (Más oscuros / Resaltados)
      activeDesktop: "bg-blue-600 border border-blue-700 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-blue-600 border border-blue-700 text-white shadow-md",
      // Color del número
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
      id: "total",
      label: "Total",
      value: totalActivo,
      baseDesktop: "bg-gray-100 border border-gray-400 text-gray-800",
      baseMobile: "bg-gray-100 border border-gray-300 text-gray-700",
      activeDesktop: "bg-gray-700 border border-gray-800 text-white shadow-md scale-[1.03]",
      activeMobile: "bg-gray-700 border border-gray-800 text-white shadow-md",
      titleClassBase: "text-gray-900",
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
      {/* 💻 VERSIÓN ESCRITORIO (Estilo Tarjetas) */}
      <div className="hidden lg:grid grid-cols-3 gap-4 mb-2 max-w-5xl mx-auto">
        {botones.map((btn) => {
          const isActive = filtro === btn.id;
          return (
            <div
              key={btn.id}
              className="flex justify-center cursor-pointer"
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

      {/* 📱 VERSIÓN MÓVIL (Estilo Píldoras Apiladas) */}
      <div className="lg:hidden flex flex-col items-center mb-4 px-3 space-y-2">
        {botones.map((btn) => {
          const isActive = filtro === btn.id;
          return (
            <div
              key={btn.id}
              onClick={() => onFiltroChange(btn.id)}
              className={`
                flex justify-between items-center 
                w-60 md:w-80 max-w-xs px-4 py-2 
                rounded-full border shadow-sm cursor-pointer transition-all duration-200
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
    </>
  );
};

export default ResumenAdmin;