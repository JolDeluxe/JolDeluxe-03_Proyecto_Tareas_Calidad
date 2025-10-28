import React, { useEffect, useState } from "react";
import { api } from "../data/api";

interface ResumenPrincipalProps {
  filtro: string;
  onFiltroChange: (filtro: string) => void;
  // year: number;
  // month: number;
  responsable: string;
  query: string;
  // 👇 AÑADIMOS LAS PROPS DEL PADRE
  tareas: any[]; // Usamos any[] porque en este componente no necesitas el tipo Date convertido
  loading: boolean;
}

const ResumenAdmin: React.FC<ResumenPrincipalProps> = ({
  filtro,
  onFiltroChange,
  // year,
  // month,
  responsable,
  query,
  // 👇 RECIBIMOS LAS PROPS
  tareas,
  loading,
}) => {
  // ❌ ELIMINAMOS ESTOS ESTADOS:
  // const [tareas, setTareas] = useState<any[]>([]);
  // const [loading, setLoading] = useState(true);

  // ❌ ELIMINAMOS ESTE useEffect:
  // useEffect(() => {
  //   const fetchTareas = async () => {
  //     try {
  //       setLoading(true);
  //       const res = await api.get("/tareas");
  //       setTareas(res.data);
  //     } catch (error) {
  //       console.error("Error al cargar tareas:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchTareas();
  // }, []);

  // ... (El resto de funciones se quedan igual)

  // const formatDate = (iso: string): string => {
  //   if (!iso) return "";
  //   const date = new Date(iso);
  //   const d = String(date.getDate()).padStart(2, "0");
  //   const m = String(date.getMonth() + 1).padStart(2, "0");
  //   const y = date.getFullYear();
  //   return `${d}/${m}/${y}`;
  // };

  // const filtrarPorFecha = (fecha: string): boolean => {
  //   if (!fecha) return false;
  //   const [d, m, y] = formatDate(fecha).split("/").map(Number);
  //   if (y !== year) return false;
  //   if (month !== 0 && m !== month) return false;
  //   return true;
  // };

  // 📊 AHORA USA las 'tareas' de las props
  const tareasFiltradas = tareas.filter((t) => {
    // Nota: Si 't.fechaRegistro' ya viene como objeto Date del componente Admin.tsx,
    // esta función 'filtrarPorFecha' fallará. Asumiremos que viene como string ISO,
    // o que Admin.tsx debe pasarte las tareas filtradas si no puedes usar objetos Date aquí.
    // Usaremos la versión que usa el string ISO.
    // const pasaFecha = filtrarPorFecha(t.fechaRegistro);
    const pasaResponsable =
      responsable === "Todos" || t.responsable === responsable;

    const texto = `${t.tarea} ${t.observaciones || ""}`.toLowerCase();
    const pasaBusqueda =
      query.trim() === "" || texto.includes(query.toLowerCase());

    // return pasaFecha && pasaResponsable && pasaBusqueda;
    return pasaResponsable && pasaBusqueda;
  });

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
      {/* 💻 Versión escritorio */}
      <div className="hidden sm:grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-center font-sans">
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
      <div className="sm:hidden grid grid-cols-2 gap-1.5 mb-2 px-3 text-[12px] font-semibold text-gray-700 text-center">
        {botones.map((btn) => {
          const isActive = filtro === btn.id;
          const colors = isActive
            ? `bg-${btn.color}-700 text-white`
            : `bg-${btn.color}-100 text-${btn.color}-700`;

          return (
            <button
              key={btn.id}
              onClick={() => onFiltroChange(btn.id)}
              className={`flex justify-between items-center w-full px-4 py-2 rounded-full border border-${btn.color}-300 shadow-sm transition-all duration-200 ${colors}`}
            >
              {/* 🔹 Texto a la izquierda */}
              <span className="text-left">{btn.label}</span>

              {/* 🔸 Número a la derecha */}
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
