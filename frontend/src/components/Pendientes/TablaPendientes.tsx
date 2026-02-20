// 📍 src/components/Pendientes/TablaPendientes.tsx

import React, { useState, useEffect, useMemo } from "react";
// import { useNavigate } from "react-router-dom"; // No se usa
import type {
  Tarea,
  ImagenTarea,
  Estatus,
} from "../../types/tarea";
import type { Usuario } from "../../types/usuario";

// Importar componentes hijos
import TablaPendientesMobile from "./TablaPendientesMobile";
import ModalGaleria from "../Principal/ModalGaleria";
import ModalEntrega from "../Admin/ModalEntregar";
import ModalRevision from "../Admin/ModalRevision";

// ✅ 1. TIPOS PARA EL ORDENAMIENTO
type SortKey = "default" | "responsables" | "urgencia" | "fechaLimite";

interface SortConfig {
  key: SortKey;
  direction: "asc" | "desc";
}

// --- Funciones Helper ---

/**
 * Helper para formatear hora a 12h AM/PM
 */
const formatTimeAMPM = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // la hora '0' debe ser '12'
  const strMinutes = minutes < 10 ? '0' + minutes : minutes;
  return hours + ':' + strMinutes + ' ' + ampm;
}

/**
 * 🛠️ Componente Helper para Renderizar Fecha Límite con Iconos
 * - Icono Calendario + Fecha
 * - Icono Reloj + Hora (si no es fin del día)
 * - Texto "ATRASADA" en rojo si venció (Pendiente)
 * - Texto "ENTREGADA CON RETRASO" en naranja (En Revisión)
 */
const RenderFechaLimite = ({ fecha, vencida, entregadaTarde }: { fecha?: Date | string | null, vencida: boolean, entregadaTarde?: boolean }) => {
  if (!fecha) return <span className="text-gray-400">—</span>;

  const dateObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return <span className="text-gray-400">—</span>;

  const d = String(dateObj.getDate()).padStart(2, "0");
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const y = dateObj.getFullYear();
  const fechaStr = `${d}/${m}/${y}`;

  // Verificar hora para ver si mostramos el reloj
  const h = dateObj.getHours();
  const min = dateObj.getMinutes();
  const sec = dateObj.getSeconds();

  // Si es "Fin del día" (23:59:59), no mostramos la hora
  const hasTime = !(h === 23 && min === 59 && sec >= 58);
  const horaStr = hasTime ? formatTimeAMPM(dateObj) : null;

  // Clases de color dinámicas
  // Prioridad visual: Vencida (Rojo) > Entregada Tarde (Naranja Oscuro) > Normal (Gris)
  const textClass = vencida ? "text-red-600" : entregadaTarde ? "text-orange-700" : "text-gray-700";
  const iconClass = vencida ? "text-red-600" : entregadaTarde ? "text-orange-600" : "text-gray-500";

  return (
    <div className={`flex flex-col items-center justify-center leading-tight ${vencida || entregadaTarde ? "font-bold" : ""}`}>

      {/* Fila: Fecha */}
      <div className={`flex items-center gap-1.5 ${textClass}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className={`w-4 h-4 ${iconClass}`} fill="currentColor">
          <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-188.5-11.5Q280-423 280-440t11.5-28.5Q303-480 320-480t28.5 11.5Q360-457 360-440t-11.5 28.5Q337-400 320-400t-28.5-11.5ZM640-400q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-188.5-11.5Q280-263 280-280t11.5-28.5Q303-320 320-320t28.5 11.5Q360-297 360-280t-11.5 28.5Q337-240 320-240t-28.5-11.5ZM640-240q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z" />
        </svg>
        <span>{fechaStr}</span>
      </div>

      {/* Fila: Hora (Opcional) */}
      {horaStr && (
        <div className={`flex items-center gap-1.5 mt-0.5 text-xs opacity-90 ${textClass}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className={`w-3.5 h-3.5 ${iconClass}`} fill="currentColor">
            <path d="M582-298 440-440v-200h80v167l118 118-56 57ZM440-720v-80h80v80h-80Zm280 280v-80h80v80h-80ZM440-160v-80h80v80h-80ZM160-440v-80h80v80h-80ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
          </svg>
          <span>{horaStr}</span>
        </div>
      )}

      {/* Fila: Etiquetas de Estado */}
      {vencida && (
        <span className="text-[10px] font-extrabold text-red-600 tracking-wide mt-1">
          ATRASADA
        </span>
      )}

      {/* ✅ NUEVO: Etiqueta Entregada con Retraso (Letra chica) */}
      {!vencida && entregadaTarde && (
        <span className="text-[9px] font-extrabold text-orange-600 tracking-wide mt-1 uppercase text-center leading-none">
          ENTREGADA CON RETRASO
        </span>
      )}
    </div>
  );
};

// Helper simple para string (usado en mobile o logs)
const formateaFechaString = (fecha?: Date | string | null): string => {
  if (!fecha) return "";
  const dateObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";

  const d = String(dateObj.getDate()).padStart(2, "0");
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const y = dateObj.getFullYear();
  const fechaStr = `${d}/${m}/${y}`;

  const h = dateObj.getHours();
  const min = dateObj.getMinutes();
  const sec = dateObj.getSeconds();

  if (h === 23 && min === 59 && sec >= 58) return fechaStr;

  return `${fechaStr} ${formatTimeAMPM(dateObj)}`;
};

const getRowClass = (estatus: Estatus): string => {
  switch (estatus) {
    case "CONCLUIDA":
      return "bg-green-50 text-green-900 border-l-4 border-green-500";
    case "CANCELADA":
      return "bg-red-50 text-red-900 border-l-4 border-red-500";
    case "EN_REVISION":
      return "bg-indigo-50 text-indigo-900 border-l-4 border-indigo-500";
    default:
      return "bg-blue-50 text-blue-900 border-l-4 border-blue-500";
  }
};

const getFechaFinalObj = (row: Tarea): Date | string | null => {
  if (row.historialFechas && row.historialFechas.length > 0) {
    return row.historialFechas[row.historialFechas.length - 1].nuevaFecha;
  }
  return row.fechaLimite;
};

const getEstadoFecha = (
  fechaLimiteObj: Date | string | null
): "vencida" | "proxima" | "normal" => {
  if (!fechaLimiteObj) return "normal";
  const fecha =
    typeof fechaLimiteObj === "string"
      ? new Date(fechaLimiteObj)
      : fechaLimiteObj;
  if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
    return "normal";
  }
  const hoy = new Date();
  const diff = fecha.getTime() - hoy.getTime();

  if (diff < 0) return "vencida";
  if (diff <= 172800000) return "proxima";

  return "normal";
};

// ✅ PROPS ACTUALIZADOS PARA COINCIDIR CON Pendientes.tsx
interface Props {
  user: Usuario | null;
  tareas: Tarea[];
  filtro: string;
  loading: boolean;
  onRecargar: () => void;
}

const TablaPendientes: React.FC<Props> = ({ user, tareas, filtro, loading, onRecargar }) => {
  // --- Estados para Modales ---
  const [modalImagenes, setModalImagenes] = useState<ImagenTarea[] | null>(null);
  const [tipoGaleria, setTipoGaleria] = useState<"REFERENCIA" | "EVIDENCIA">("REFERENCIA");

  const [tareaParaEntregar, setTareaParaEntregar] = useState<Tarea | null>(null);
  const [tareaParaRevisar, setTareaParaRevisar] = useState<Tarea | null>(null);

  // ✅ ESTADOS PARA PAGINACIÓN
  const [page, setPage] = useState(1);
  const itemsPerPage = 30;

  // ✅ ESTADO DE ORDENAMIENTO (Por defecto utiliza la lógica compleja)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "default", direction: "asc" });

  // Resetea la página a 1 si el filtro o el orden cambian
  useEffect(() => {
    setPage(1);
  }, [filtro, sortConfig]);

  // ✅ 1. APLICAR EL FILTRO DE LOS BOTONES A LAS TAREAS QUE VIENEN DEL PADRE
  const tareasFiltradasPorBoton = useMemo(() => {
    return tareas.filter((t) => {
      // Si en Pendientes.tsx queremos solo Pendientes y En Revisión
      // (asumiendo que quieres filtrar Canceladas y Concluidas a menos que se pidan explicitamente)
      if (t.estatus === "CONCLUIDA" || t.estatus === "CANCELADA") return false;

      if (filtro === "pendientes") return t.estatus === "PENDIENTE";
      if (filtro === "en_revision") return t.estatus === "EN_REVISION";
      return true; // para "total"
    });
  }, [tareas, filtro]);

  // ✅ LÓGICA DE ORDENAMIENTO (Handler)
  const handleSort = (key: SortKey) => {
    // Si ya estamos ordenando por esa columna, alternamos: asc -> desc -> default -> asc
    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        setSortConfig({ key, direction: "desc" });
      } else {
        setSortConfig({ key: "default", direction: "asc" }); // Regresa al default
      }
    } else {
      setSortConfig({ key, direction: "asc" });
    }
  };

  // Helper para mostrar ícono de ordenamiento
  const getSortIcon = (columnKey: SortKey) => {
    if (sortConfig.key !== columnKey) return <span className="text-gray-300 text-[10px] ml-1">⇅</span>;
    return sortConfig.direction === "asc" ? <span className="text-blue-600 font-extrabold ml-1">↑</span> : <span className="text-blue-600 font-extrabold ml-1">↓</span>;
  };

  // ✅ 2. APLICAR ORDENAMIENTO
  const pendientesOrdenados = useMemo(() => {
    const base = [...tareasFiltradasPorBoton];

    // LÓGICA POR DEFECTO COMPLEJA (Mantenida intacta)
    if (sortConfig.key === "default") {
      return base.sort((a, b) => {
        // 1️⃣ PRIORIDAD SUPREMA: Estatus "EN_REVISION" primero
        if (a.estatus === "EN_REVISION" && b.estatus !== "EN_REVISION") return -1;
        if (b.estatus === "EN_REVISION" && a.estatus !== "EN_REVISION") return 1;

        // 2️⃣ ORDENAMIENTO SECUNDARIO: Por fecha límite
        const fechaA = getFechaFinalObj(a);
        const fechaB = getFechaFinalObj(b);
        const timeA = fechaA ? new Date(fechaA as any).getTime() : 0;
        const timeB = fechaB ? new Date(fechaB as any).getTime() : 0;

        if (!timeA || isNaN(timeA)) return 1;
        if (!timeB || isNaN(timeB)) return -1;

        return timeA - timeB;
      });
    }

    // LÓGICAS ACTIVADAS POR CLIC EN LOS HEADERS
    return base.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      switch (sortConfig.key) {
        case "responsables":
          valA = a.responsables.length;
          valB = b.responsables.length;
          // Si tienen la misma cantidad de responsables, ordenar alfabéticamente por los nombres
          if (valA === valB) {
            const nameA = a.responsables.map(r => r.nombre).join("").toLowerCase();
            const nameB = b.responsables.map(r => r.nombre).join("").toLowerCase();
            if (nameA < nameB) return sortConfig.direction === "asc" ? -1 : 1;
            if (nameA > nameB) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
          }
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;

        case "urgencia":
          const weights: Record<string, number> = { ALTA: 3, MEDIA: 2, BAJA: 1 };
          valA = weights[a.urgencia] || 0;
          valB = weights[b.urgencia] || 0;
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;

        case "fechaLimite":
          const fA = getFechaFinalObj(a);
          const fB = getFechaFinalObj(b);
          valA = fA ? new Date(fA as any).getTime() : 0;
          valB = fB ? new Date(fB as any).getTime() : 0;
          return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [tareasFiltradasPorBoton, sortConfig]);

  // ✅ 3. LÓGICA DE PAGINACIÓN
  const totalPages = Math.max(1, Math.ceil(pendientesOrdenados.length / itemsPerPage));

  const tareasPaginadas = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return pendientesOrdenados.slice(startIndex, startIndex + itemsPerPage);
  }, [pendientesOrdenados, page]);


  // --- Handlers de Modales ---
  const handleAbrirEntrega = (tarea: Tarea) => setTareaParaEntregar(tarea);
  const handleCerrarEntrega = () => setTareaParaEntregar(null);
  const handleExitoEntrega = () => {
    setTareaParaEntregar(null);
    onRecargar(); // ✅ Usamos la prop del padre
  };

  const handleRevisar = (tarea: Tarea) => {
    setTareaParaRevisar(tarea);
  };

  const handleCerrarRevision = () => setTareaParaRevisar(null);

  const handleExitoRevision = () => {
    setTareaParaRevisar(null);
    onRecargar(); // ✅ Usamos la prop del padre
  };

  return (
    <div className="w-full pb-2 text-sm font-sans">
      {loading ? (
        <div className="flex flex-col justify-center items-center h-40 text-gray-500 italic">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
          <span className="text-gray-600 font-semibold">Cargando tareas...</span>
        </div>
      ) : pendientesOrdenados.length > 0 ? (
        <>
          {/* 💻 VISTA ESCRITORIO */}
          <div className="hidden lg:block">
            <div className="max-h-[80vh] overflow-y-auto border border-gray-200 rounded-t-lg shadow-md">
              <table className="w-full text-[13px] leading-tight">
                <thead className="bg-gray-100 text-gray-700 uppercase sticky top-0 z-10 text-xs">
                  <tr>
                    <th
                      className="px-2 py-1 text-left font-bold border-b border-gray-300 cursor-pointer hover:bg-gray-200 transition select-none"
                      onClick={() => handleSort("responsables")}
                    >
                      Responsable {getSortIcon("responsables")}
                    </th>
                    <th className="px-2 py-1 text-left font-bold border-b border-gray-300">
                      Tarea / Descripción
                    </th>
                    <th
                      className="px-2 py-1 text-center font-bold border-b border-gray-300 cursor-pointer hover:bg-gray-200 transition select-none"
                      onClick={() => handleSort("urgencia")}
                    >
                      Prioridad {getSortIcon("urgencia")}
                    </th>
                    <th
                      className="px-2 py-1 text-center font-bold border-b border-gray-300 cursor-pointer hover:bg-gray-200 transition select-none"
                      onClick={() => handleSort("fechaLimite")}
                    >
                      Fecha Límite {getSortIcon("fechaLimite")}
                    </th>
                    <th className="px-2 py-1 text-center font-bold border-b border-gray-300">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tareasPaginadas.map((row) => {
                    const fechaFinalObj = getFechaFinalObj(row);
                    const estado = getEstadoFecha(fechaFinalObj);

                    // 🚀 LÓGICA DE NEGOCIO CORREGIDA:
                    // Solo es "vencida" si la fecha pasó Y sigue en PENDIENTE.
                    const vencida = estado === "vencida" && row.estatus === "PENDIENTE";

                    // 🚀 LÓGICA NUEVA: ENTREGADA CON RETRASO
                    // Si está EN_REVISION, verificamos si la fecha de entrega > fecha límite efectiva
                    let entregadaTarde = false;
                    if (row.estatus === "EN_REVISION" && row.fechaEntrega && fechaFinalObj) {
                      const dEntrega = new Date(row.fechaEntrega).getTime();
                      const dLimite = new Date(fechaFinalObj).getTime();
                      entregadaTarde = dEntrega > dLimite;
                    }

                    const isResponsable = row.responsables.some(r => r.id === user?.id);
                    const isAsignador = row.asignadorId === user?.id;
                    const isAdmin = user?.rol === "ADMIN" || user?.rol === "SUPER_ADMIN";
                    const canReview = isAsignador || isAdmin;

                    return (
                      <tr
                        key={row.id}
                        className={`${getRowClass(row.estatus)} transition ${vencida ? "bg-red-50/60" : ""}`}
                      >
                        <td className="px-2 py-1 text-left text-lg font-semibold text-blue-700">
                          <ul className="list-disc list-inside m-0 p-0">
                            {row.responsables.map((r: any) => (
                              <li key={r.id}>{r.nombre}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-3 py-1.5 text-left font-semibold text-lg align-top">
                          <div className="text-gray-800 flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              {row.tarea}
                              {row.estatus === "EN_REVISION" && (
                                <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full border border-indigo-300">
                                  EN REVISIÓN
                                </span>
                              )}
                            </div>
                            {row.estatus === "PENDIENTE" && row.feedbackRevision && (
                              <div className="bg-red-50 border border-red-200 rounded-md p-2 mt-1 shadow-sm animation-fade-in">
                                <div className="flex items-start gap-2">
                                  <svg xmlns="http://www.w3.org/2000/svg" height="20px" width="20px" viewBox="0 -960 960 960" className="flex-shrink-0 fill-red-600">
                                    <path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302 40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z" />
                                  </svg>
                                  <div className="flex flex-col">
                                    <span className="text-xs font-bold text-red-700 uppercase tracking-wide">
                                      Corrección Requerida
                                    </span>
                                    <span className="text-xs text-red-600 italic leading-tight">
                                      "{row.feedbackRevision}"
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          {row.observaciones && (
                            <p className="text-sm text-gray-500 italic mt-1 break-words max-w-xl leading-snug">
                              {row.observaciones}
                            </p>
                          )}
                        </td>
                        <td className="px-2 py-1 text-center">
                          {row.urgencia === "ALTA" ? (
                            <span className="bg-red-100 text-red-700 px-2 py-[1px] rounded-full border border-red-300 text-lg font-bold">Alta</span>
                          ) : row.urgencia === "MEDIA" ? (
                            <span className="bg-amber-100 text-amber-700 px-2 py-[1px] rounded-full border border-amber-300 text-lg font-bold">Media</span>
                          ) : (
                            <span className="bg-green-100 text-green-700 px-2 py-[1px] rounded-full border border-green-300 text-lg font-bold">Baja</span>
                          )}
                        </td>
                        {/* 🚀 FECHA LÍMITE CON FORMATO DESKTOP */}
                        <td className={`px-2 py-1 text-center text-lg font-bold`}>
                          <div className="flex flex-col items-center justify-center">
                            {/* Usamos el formateador Desktop para separar líneas */}
                            <RenderFechaLimite fecha={fechaFinalObj} vencida={vencida} entregadaTarde={entregadaTarde} />
                          </div>
                        </td>

                        <td className="px-2 py-1 text-center align-middle">
                          <div className="flex items-center justify-center gap-2">
                            {isResponsable && row.estatus === "PENDIENTE" && (
                              <button
                                onClick={() => handleAbrirEntrega(row)}
                                title={row.feedbackRevision ? "Corregir y re-enviar evidencia" : "Subir evidencias y entregar"}
                                className={`w-8 h-8 flex items-center justify-center rounded-md border transition-all duration-200 shadow-sm 
                                  ${row.feedbackRevision ? "border-orange-400 text-orange-600 hover:bg-orange-100 bg-orange-50" : "border-green-400 text-green-700 hover:bg-green-100 bg-green-50"}`}
                              >
                                {row.feedbackRevision ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-5 h-5 fill-current">
                                    <path fill="#22c55e" d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
                                    <g transform="translate(50, -450) scale(0.65)">
                                      <path fill="##742F01" d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
                                    </g>
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-5 h-5 fill-current">
                                    <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
                                  </svg>
                                )}
                              </button>
                            )}

                            {canReview && row.estatus === "EN_REVISION" && (
                              <button
                                onClick={() => handleRevisar(row)}
                                title="Revisar evidencia y aprobar/rechazar"
                                className="w-8 h-8 flex items-center justify-center rounded-md border border-indigo-400 text-indigo-700 hover:bg-indigo-100 bg-indigo-50 transition-all duration-200 shadow-sm"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" width="20px" height="20px" className="fill-indigo-700">
                                  <path d="M440-240q116 0 198-81.5T720-520q0-116-82-198t-198-82q-117 0-198.5 82T160-520q0 117 81.5 198.5T440-240Zm0-280Zm0 160q-83 0-147.5-44.5T200-520q28-70 92.5-115T440-680q82 0 146.5 45T680-520q-29 71-93.5 115.5T440-360Zm0-60q55 0 101-26.5t72-73.5q-26-46-72-73t-101-27q-56 0-102 27t-72 73q26 47 72 73.5T440-420Zm0-40q25 0 42.5-17t17.5-43q0-25-17.5-42.5T440-580q-26 0-43 17.5T380-520q0 26 17 43t43 17Zm0 300q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T80-520q0-74 28.5-139.5t77-114.5q48.5-49 114-77.5T440-880q74 0 139.5 28.5T694-774q49 49 77.5 114.5T800-520q0 64-21 121t-58 104l159 159-57 56-159-158q-47 37-104 57.5T440-160Z" />
                                </svg>
                              </button>
                            )}

                            {isResponsable && row.estatus === "EN_REVISION" && (
                              <div className="w-8 h-8 flex items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-indigo-400 animate-pulse shadow-sm cursor-help" title="Esperando revisión por parte del asignador">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-5 h-5 fill-current">
                                  <path d="M320-160h320v-120q0-66-47-113t-113-47q-66 0-113 47t-47 113v120Zm160-360q66 0 113-47t47-113v-120H320v120q0 66 47 113t113 47ZM160-80v-80h80v-120q0-61 28.5-114.5T348-480q-51-32-79.5-85.5T240-680v-120h-80v-80h640v80h-80v120q0 61-28.5 114.5T612-480q51 32 79.5 85.5T720-280v120h80v80H160Zm320-80Zm0-640Z" />
                                </svg>
                              </div>
                            )}

                            {!(isResponsable && row.estatus === "PENDIENTE") &&
                              !(canReview && row.estatus === "EN_REVISION") &&
                              !(isResponsable && row.estatus === "EN_REVISION") && (
                                <span className="text-gray-300">—</span>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* ✅ CONTADOR DE PAGINACIÓN ESCRITORIO */}
            <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-300 rounded-b-lg gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                <span className="text-xs text-gray-600 font-medium">
                  Página <span className="font-bold text-gray-900">{page}</span> de <span className="font-bold text-gray-900">{totalPages}</span>
                </span>
                <span className="hidden sm:block text-gray-300">|</span>
                <span className="text-[11px] text-gray-500 bg-gray-200/70 px-2 py-0.5 rounded-full font-medium">
                  {pendientesOrdenados.length} {pendientesOrdenados.length === 1 ? 'tarea en esta categoría' : 'tareas en total'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>

          {/* 📱 VISTA MÓVIL */}
          <TablaPendientesMobile
            tareas={tareasPaginadas} // ✅ Le pasamos la lista paginada al movil
            user={user}
            formateaFecha={formateaFechaString}
            getRowClass={getRowClass}
            getFechaFinalObj={getFechaFinalObj}
            getEstadoFecha={getEstadoFecha}
            onVerImagenes={(imagenes) => {
              setTipoGaleria("REFERENCIA");
              setModalImagenes(imagenes);
            }}
            onEntregar={handleAbrirEntrega}
            onRevisar={handleRevisar}
            // ✅ Pasamos las propiedades de paginación
            page={page}
            totalPages={totalPages}
            totalTareas={pendientesOrdenados.length}
            onPageChange={setPage}
          />

          {/* Modales... */}
          {modalImagenes && (
            <ModalGaleria
              imagenes={modalImagenes}
              onClose={() => setModalImagenes(null)}
              tipo={tipoGaleria}
            />
          )}
          {tareaParaEntregar && (
            <ModalEntrega
              tarea={tareaParaEntregar}
              onClose={handleCerrarEntrega}
              onSuccess={handleExitoEntrega}
            />
          )}
          {tareaParaRevisar && (
            <ModalRevision
              tarea={tareaParaRevisar}
              onClose={handleCerrarRevision}
              onSuccess={handleExitoRevision}
              onVerImagenes={(imagenes) => {
                setTipoGaleria("EVIDENCIA");
                setModalImagenes(imagenes);
              }}
            />
          )}
        </>
      ) : (
        <div className="flex justify-center items-center h-40 text-gray-500 italic text-sm">
          No hay tareas pendientes ni en revisión.
        </div>
      )}
    </div>
  );
};

export default TablaPendientes;