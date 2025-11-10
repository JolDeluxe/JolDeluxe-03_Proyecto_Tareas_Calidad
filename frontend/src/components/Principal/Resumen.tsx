// 📍 src/components/Principal/Resumen.tsx

import React from "react";
import type { Tarea } from "../../types/tarea";
import type { Usuario } from "../../types/usuario"; // 1. Importa el tipo Usuario

// 2. Añade 'user' a la interfaz de Props
interface ResumenPrincipalProps {
  filtro: string;
  onFiltroChange: (filtro: string) => void;
  year: number;
  month: number;
  responsable: string; // Este es el 'filtroUsuarioId' (un string "Todos" o un ID)
  query: string;
  tareas: Tarea[];
  loading: boolean;
  user: Usuario | null; // <-- AÑADIDO
}

// 3. Recibe 'user' en las props (aunque no se use activamente en la lógica)
const ResumenPrincipal: React.FC<ResumenPrincipalProps> = ({
  filtro,
  onFiltroChange,
  year,
  month,
  responsable,
  query,
  tareas,
  loading,
  user, // <-- AÑADIDO
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

  const tareasFiltradas = tareas.filter((t) => {
    const pasaFecha = filtrarPorFecha(t.fechaRegistro);

    // 4. ¡CORRECCIÓN!
    //    El filtro 'responsable' es un ID (como string), no un nombre.
    //    Comparamos 'r.id' (que es un número) con 'responsable' (string).
    const pasaResponsable =
      responsable === "Todos" ||
      t.responsables.some((r) => r.id.toString() === responsable);

    const texto = `${t.tarea} ${t.observaciones || ""}`.toLowerCase();
    const pasaBusqueda =
      query.trim() === "" || texto.includes(query.toLowerCase());

    return pasaFecha && pasaResponsable && pasaBusqueda;
  });

  // 7. El resto de tu lógica de cálculo y JSX no necesita cambios
  const pendientes = tareasFiltradas.filter(
    (t) => t.estatus.toUpperCase() === "PENDIENTE"
  ).length;

  const concluidas = tareasFiltradas.filter(
    (t) => t.estatus.toUpperCase() === "CONCLUIDA"
  ).length;

  const canceladas = tareasFiltradas.filter(
    (t) => t.estatus.toUpperCase() === "CANCELADA"
  ).length;

  const total = tareasFiltradas.length;

  const botones = [
    { id: "pendientes", label: "Pendientes", color: "blue", value: pendientes },
    {
      id: "concluidas",
      label: "Concluidas",
      color: "green",
      value: concluidas,
    },
    { id: "canceladas", label: "Canceladas", color: "red", value: canceladas },
    { id: "total", label: "Total", color: "gray", value: total },
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
      {/* 💻 Versión escritorio (Sin cambios) */}
      <div className="hidden lg:grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-center font-sans">
        {botones.map((btn) => {
          const isActive = filtro === btn.id;
          const baseColors = {
            blue: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
            green:
              "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
            red: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
            gray: "bg-gray-200 border-gray-400 text-gray-800 hover:bg-gray-300",
          }[btn.color];
          const activeColors = {
            blue: "bg-blue-700 text-white border-blue-700 shadow-lg",
            green: "bg-green-700 text-white border-green-700 shadow-lg",
            red: "bg-red-700 text-white border-red-700 shadow-lg",
            gray: "bg-gray-700 text-white border-gray-700 shadow-lg",
          }[btn.color];
          return (
            <button
              key={btn.id}
              onClick={() => onFiltroChange(btn.id)}
              className={`rounded-lg p-3 border font-semibold transition-all duration-200 ${
                isActive ? activeColors : baseColors
              }`}
            >
              <div className="text-xs uppercase tracking-wide">{btn.label}</div>
              <div className="text-2xl font-extrabold">{btn.value}</div>
            </button>
          );
        })}
      </div>
      {/* 📱 Versión móvil (Sin cambios) */}
      <div className="lg:hidden grid grid-cols-2 gap-1.5 mb-2 px-3 text-[12px] md:text-[15px] font-semibold text-gray-700 text-center">
        {botones.map((btn) => {
          const isActive = filtro === btn.id;
          const colors = isActive
            ? `bg-${btn.color}-700 text-white`
            : `bg-${btn.color}-100 text-${btn.color}-700`;

          return (
            <button
              key={btn.id}
              onClick={() => onFiltroChange(btn.id)}
              className={`flex justify-between items-center w-full px-4 py-2 md:py-3 rounded-full border border-${btn.color}-300 shadow-sm transition-all duration-200 ${colors}`}
            >
              <span className="text-left">{btn.label}</span>
              <span className="text-right font-bold text-[13px] md:text-[16px] opacity-90">
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
