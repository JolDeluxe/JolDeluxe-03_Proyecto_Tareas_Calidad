// // 📍 src/components/Principal/ResumenDash.tsx

// import React from "react";
// import type { Tarea } from "../../types/tarea";
// import type { Usuario } from "../../types/usuario";

// interface ResumenPrincipalPropsDash {
//   year: number;
//   month: number;
//   responsable: string;
//   query: string;
//   tareas: Tarea[];
//   loading: boolean;
//   user: Usuario | null;
// }

// const ResumenPrincipalDash: React.FC<ResumenPrincipalPropsDash> = ({
//   year,
//   month,
//   responsable,
//   query,
//   tareas,
//   loading,
//   user,
// }) => {
//   // --- 1. Lógica de Filtrado ---
//   const filtrarPorFecha = (fecha: Date | string | null): boolean => {
//     if (!fecha) return false;
//     const dateObj = fecha instanceof Date ? fecha : new Date(fecha);
//     if (isNaN(dateObj.getTime())) return false;
//     const y = dateObj.getFullYear();
//     const m = dateObj.getMonth() + 1;
//     if (y !== year) return false;
//     if (month !== 0 && m !== month) return false;
//     return true;
//   };

//   // 🚀 FILTRO MAESTRO: Aquí eliminamos las CANCELADAS desde la raíz
//   const tareasFiltradas = tareas.filter((t) => {
//     const pasaFecha = filtrarPorFecha(t.fechaRegistro);
//     const pasaResponsable =
//       responsable === "Todos" ||
//       t.responsables.some((r) => r.id.toString() === responsable);

//     const texto = `${t.tarea} ${t.observaciones || ""}`.toLowerCase();
//     const pasaBusqueda =
//       query.trim() === "" || texto.includes(query.toLowerCase());

//     // Ignoramos las canceladas por completo para las métricas de rendimiento
//     const noEsCancelada = t.estatus.toUpperCase() !== "CANCELADA";

//     return pasaFecha && pasaResponsable && pasaBusqueda && noEsCancelada;
//   });

//   // --- 2. Cálculos Numéricos Exactos ---
//   // Este es nuestro nuevo 100% (solo tareas vivas o terminadas con éxito)
//   const totalSanas = tareasFiltradas.length;

//   // Pendientes Reales: Están en Pendiente y aún NO tienen fecha de entrega
//   const pendientes = tareasFiltradas.filter(
//     (t) => t.estatus.toUpperCase() === "PENDIENTE" && !t.fechaEntrega
//   ).length;

//   // En Revisión: Siguen Pendientes, pero el usuario ya las entregó (esperan validación)
//   const enRevision = tareasFiltradas.filter(
//     (t) => t.estatus.toUpperCase() === "PENDIENTE" && !!t.fechaEntrega
//   ).length;

//   // Concluidas: Ya fueron validadas y cerradas
//   const concluidas = tareasFiltradas.filter(
//     (t) => t.estatus.toUpperCase() === "CONCLUIDA"
//   ).length;

//   // 🚀 Cálculo de Porcentaje Exacto
//   const getPercent = (val: number) => {
//     if (totalSanas === 0) return 0;
//     return Math.round((val / totalSanas) * 100);
//   };

//   // Definición de las tarjetas
//   const botones = [
//     {
//       id: "total",
//       label: "Total Tareas", // Excluye canceladas
//       color: "indigo",
//       value: totalSanas,
//       percent: 100,
//     },
//     {
//       id: "pendientes",
//       label: "Pendientes",
//       color: "blue",
//       value: pendientes,
//       percent: getPercent(pendientes),
//     },
//     {
//       id: "en_revision",
//       label: "En Revisión",
//       color: "amber",
//       value: enRevision,
//       percent: getPercent(enRevision),
//     },
//     {
//       id: "concluidas",
//       label: "Concluidas",
//       color: "green",
//       value: concluidas,
//       percent: getPercent(concluidas),
//     }
//   ];

//   if (loading) {
//     return (
//       <div className="text-2xl font-extrabold text-blue-900 flex justify-center items-center text-center animate-pulse mt-4 mb-6 h-24 bg-gray-50 rounded-xl border border-gray-100">
//         Calculando métricas...
//       </div>
//     );
//   }

//   return (
//     <>
//       {/* 💻 Versión Escritorio (Tablets en adelante) */}
//       <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 text-center font-sans">
//         {botones.map((btn) => {
//           const styleMap: Record<string, string> = {
//             indigo: "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 hover:shadow-indigo-100",
//             blue: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 hover:shadow-blue-100",
//             amber: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300 hover:shadow-amber-100",
//             green: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 hover:shadow-green-100",
//           };

//           return (
//             <div
//               key={btn.id}
//               className={`
//                 rounded-xl p-4 border
//                 transition-all duration-300 ease-in-out
//                 transform hover:-translate-y-1 hover:shadow-lg
//                 cursor-default select-none
//                 ${styleMap[btn.color]}
//               `}
//             >
//               <div className="text-xs uppercase tracking-wider font-bold opacity-70 mb-1">
//                 {btn.label}
//               </div>
//               <div className="flex items-baseline justify-center gap-2">
//                 <span className="text-4xl font-black tracking-tight">
//                   {btn.value}
//                 </span>
//                 <span className="text-lg font-semibold opacity-60">
//                   ({btn.percent}%)
//                 </span>
//               </div>
//             </div>
//           );
//         })}
//       </div>

//       {/* 📱 Versión Móvil (Teléfonos) */}
//       <div className="md:hidden grid grid-cols-2 gap-2 mb-4 px-1 text-[12px] font-semibold text-center">
//         {botones.map((btn) => {
//           const mobileStyleMap: Record<string, string> = {
//             indigo: "bg-indigo-50 border-indigo-200 text-indigo-800 active:bg-indigo-100",
//             blue: "bg-blue-50 border-blue-200 text-blue-800 active:bg-blue-100",
//             amber: "bg-amber-50 border-amber-200 text-amber-800 active:bg-amber-100",
//             green: "bg-green-50 border-green-200 text-green-800 active:bg-green-100",
//           };

//           return (
//             <div
//               key={btn.id}
//               className={`
//                 flex flex-col justify-center items-center
//                 w-full py-3 rounded-lg border shadow-sm
//                 transition-colors duration-200
//                 ${mobileStyleMap[btn.color]}
//               `}
//             >
//               <span className="opacity-80 text-[11px] uppercase mb-0.5">
//                 {btn.label}
//               </span>
//               <div className="flex items-baseline gap-1">
//                 <span className="font-bold text-2xl leading-none">
//                   {btn.value}
//                 </span>
//                 <span className="text-xs font-medium opacity-70">
//                   ({btn.percent}%)
//                 </span>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </>
//   );
// };

// export default ResumenPrincipalDash;