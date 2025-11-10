// 📍 src/components/Admin/ResumenAdmin.tsx

import React from "react";
import type { Tarea } from "../../types/tarea";
import type { Usuario } from "../../types/usuario";

// 3. 💅 Interfaz de Props actualizada
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
  user,
}) => {
  // ❌ No hay estados de 'tareas' o 'loading'
  // ❌ No hay 'useEffect'
  // El componente ahora es "tonto", solo muestra datos.

  // 📊 Lógica de filtrado (se ejecuta en cada render)
  const tareasFiltradas = tareas.filter((t) => {
    // 4. 🚀 Lógica de Responsable CORREGIDA
    // Verificamos si la Tarea (t) tiene *algun* responsable
    // cuyo ID coincida con el filtro 'responsable' (que es un string "id")
    const pasaResponsable =
      responsable === "Todos" ||
      t.responsables.some((r) => r.id.toString() === responsable);

    // El filtro de búsqueda por texto (sin cambios, estaba bien)
    const texto = `${t.tarea} ${t.observaciones || ""}`.toLowerCase();
    const pasaBusqueda =
      query.trim() === "" || texto.includes(query.toLowerCase());

    return pasaResponsable && pasaBusqueda;
  });

  // El resto del cálculo de contadores (sin cambios, estaba bien)
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
      {/* 💻 Versión escritorio (Tailwind Purge-safe) */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-center font-sans">
        {botones.map((btn) => {
          const isActive = filtro === btn.id;

          // Mapeo de estilos base y activos
          const colorStyles: {
            [key: string]: { base: string; active: string };
          } = {
            blue: {
              base: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
              active: "bg-blue-700 text-white border-blue-700 shadow-lg",
            },
            green: {
              base: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
              active: "bg-green-700 text-white border-green-700 shadow-lg",
            },
            red: {
              base: "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
              active: "bg-red-700 text-white border-red-700 shadow-lg",
            },
            gray: {
              base: "bg-gray-200 border-gray-400 text-gray-800 hover:bg-gray-300",
              active: "bg-gray-700 text-white border-gray-700 shadow-lg",
            },
          };

          const styles = colorStyles[btn.color] || colorStyles.gray;

          return (
            <button
              key={btn.id}
              onClick={() => onFiltroChange(btn.id)}
              className={`rounded-lg p-3 border font-semibold transition-all duration-200 ${
                isActive ? styles.active : styles.base
              }`}
            >
              <div className="text-xs uppercase tracking-wide">{btn.label}</div>
              <div className="text-2xl font-extrabold">{btn.value}</div>
            </button>
          );
        })}
      </div>

      {/* 📱 Versión móvil (Tailwind Purge-safe) */}
      <div className="sm:hidden grid grid-cols-2 gap-1.5 mb-2 px-3 text-[12px] font-semibold text-gray-700 text-center">
        {botones.map((btn) => {
          const isActive = filtro === btn.id;

          // Mapeo de estilos para móvil
          const mobileColorStyles: {
            [key: string]: { base: string; active: string };
          } = {
            blue: {
              base: "bg-blue-100 text-blue-700 border-blue-300",
              active: "bg-blue-700 text-white border-blue-700",
            },
            green: {
              base: "bg-green-100 text-green-700 border-green-300",
              active: "bg-green-700 text-white border-green-700",
            },
            red: {
              base: "bg-red-100 text-red-700 border-red-300",
              active: "bg-red-700 text-white border-red-700",
            },
            gray: {
              base: "bg-gray-100 text-gray-700 border-gray-300",
              active: "bg-gray-700 text-white border-gray-700",
            },
          };

          const styles = mobileColorStyles[btn.color] || mobileColorStyles.gray;

          return (
            <button
              key={btn.id}
              onClick={() => onFiltroChange(btn.id)}
              className={`flex justify-between items-center w-full px-4 py-2 rounded-full border shadow-sm transition-all duration-200 ${
                isActive ? styles.active : styles.base
              }`}
            >
              <span className="text-left">{btn.label}</span>
              <span className="text-right font-bold text-[13px] opacity-90">
                {btn.value}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

export default ResumenAdmin;
