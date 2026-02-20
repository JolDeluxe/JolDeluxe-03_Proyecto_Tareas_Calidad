// 📍 src/components/Pendientes/TablaPendientesMobile.tsx

import React from "react";
import type {
  Tarea,
  Estatus,
  HistorialFecha,
  ImagenTarea,
} from "../../types/tarea";
import type { Usuario } from "../../types/usuario";

interface TablaPendientesMobileProps {
  tareas: Tarea[];
  user: Usuario | null;
  formateaFecha: (fecha?: Date | string | null) => string;
  getRowClass: (estatus: Estatus) => string;
  getFechaFinalObj: (row: Tarea) => Date | string | null;
  getEstadoFecha: (
    fechaLimiteObj: Date | string | null
  ) => "vencida" | "proxima" | "normal";
  onVerImagenes: (imagenes: ImagenTarea[]) => void;
  onEntregar: (tarea: Tarea) => void;
  onRevisar: (tarea: Tarea) => void;
  // ✅ Props de Paginación
  page: number;
  totalPages: number;
  totalTareas: number;
  onPageChange: (page: number) => void;
}

// Helper: AM/PM
const formatTimeAMPM = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strMinutes = minutes < 10 ? '0' + minutes : minutes;
  return hours + ':' + strMinutes + ' ' + ampm;
}

// Helper: Solo fecha para registro
const formateaSoloFecha = (fecha?: Date | string | null): string => {
  if (!fecha) return "";
  const dateObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return "";
  const d = String(dateObj.getDate()).padStart(2, "0");
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const y = dateObj.getFullYear();
  return `${d}/${m}/${y}`;
};

/**
 * 📱 RenderFechaLimiteMovil: Versión en línea recta para dispositivos móviles (Idéntico a Admin)
 */
const RenderFechaLimiteMovil = ({ fecha, vencida }: { fecha?: Date | string | null, vencida: boolean }) => {
  if (!fecha) return <span className="text-gray-400">—</span>;

  const dateObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return <span className="text-gray-400">—</span>;

  const d = String(dateObj.getDate()).padStart(2, "0");
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const y = dateObj.getFullYear();
  const fechaStr = `${d}/${m}/${y}`;

  // Verificar hora
  const h = dateObj.getHours();
  const min = dateObj.getMinutes();
  const sec = dateObj.getSeconds();

  const hasTime = !(h === 23 && min === 59 && sec >= 58);
  const horaStr = hasTime ? formatTimeAMPM(dateObj) : null;

  // Clases de color dinámicas
  const textClass = vencida ? "text-red-600 font-bold" : "text-gray-700";
  const iconColor = vencida ? "#DC2626" : "#6B7280";

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${textClass}`}>
      {/* Grupo Fecha: Icono + Texto */}
      <div className="flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill={iconColor}>
          <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Z" />
        </svg>
        <span>{fechaStr}</span>
      </div>

      {/* Grupo Hora: Icono + Texto (Solo si aplica) */}
      {horaStr && (
        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill={iconColor}>
            <path d="M582-298 440-440v-200h80v167l118 118-56 57ZM440-720v-80h80v80h-80Zm280 280v-80h80v80h-80ZM440-160v-80h80v80h-80ZM160-440v-80h80v80h-80ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
          </svg>
          <span>{horaStr}</span>
        </div>
      )}

      {/* Etiqueta ATRASADA (Solo si aplica) */}
      {vencida && (
        <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.5 rounded-sm tracking-wider uppercase leading-none font-bold">
          Atrasada
        </span>
      )}
    </div>
  );
};

/**
 * 📱 RenderFechaEntregaMovil: Versión en línea recta para dispositivos móviles (Idéntico a Admin)
 */
const RenderFechaEntregaMovil = ({ fecha, estatus, entregadaTarde }: { fecha?: Date | string | null, estatus: string, entregadaTarde?: boolean }) => {
  if (!fecha) return <span className="text-gray-400">—</span>;

  const dateObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return <span className="text-gray-400">—</span>;

  const d = String(dateObj.getDate()).padStart(2, "0");
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const y = dateObj.getFullYear();
  const fechaStr = `${d}/${m}/${y}`;

  // Verificar hora
  const h = dateObj.getHours();
  const min = dateObj.getMinutes();
  const sec = dateObj.getSeconds();

  const hasTime = !(h === 23 && min === 59 && sec >= 58);
  const horaStr = hasTime ? formatTimeAMPM(dateObj) : null;

  // Clases según Estatus y Retraso
  const isEnRevision = estatus === "EN_REVISION";
  const textClass = entregadaTarde ? "text-orange-700" : isEnRevision ? "text-indigo-700" : "text-gray-700";
  const iconColor = entregadaTarde ? "#EA580C" : isEnRevision ? "#6366F1" : "#6B7280";

  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${textClass}`}>
      {/* Grupo Fecha: Icono Calendario + Texto */}
      <div className="flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill={iconColor}>
          <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Z" />
        </svg>
        <span className="font-semibold">{fechaStr}</span>
      </div>

      {/* Grupo Hora: Icono Reloj + Texto (Solo si aplica) */}
      {horaStr && (
        <div className="flex items-center gap-1 opacity-90">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-3.5 h-3.5" fill={iconColor}>
            <path d="M582-298 440-440v-200h80v167l118 118-56 57ZM440-720v-80h80v80h-80Zm280 280v-80h80v80h-80ZM440-160v-80h80v80h-80ZM160-440v-80h80v80h-80ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
          </svg>
          <span>{horaStr}</span>
        </div>
      )}

      {/* Etiqueta Entregada con Retraso (Solo si aplica) */}
      {entregadaTarde && (
        <span className="text-[9px] bg-orange-600 text-white px-1.5 py-0.5 rounded-sm tracking-wider uppercase font-extrabold leading-none">
          Retraso
        </span>
      )}
    </div>
  );
}

const TablaPendientesMobile: React.FC<TablaPendientesMobileProps> = ({
  tareas,
  user,
  formateaFecha,
  getRowClass,
  getFechaFinalObj,
  getEstadoFecha,
  onVerImagenes,
  onEntregar,
  onRevisar,
  page,
  totalPages,
  totalTareas,
  onPageChange,
}) => {
  return (
    <div className="lg:hidden flex flex-col w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-2 items-start">
        {tareas.map((row) => {
          const fechaLimiteDate = getFechaFinalObj(row);

          // 🚀 LÓGICA DE NEGOCIO CORREGIDA PARA MÓVIL:
          // Si el estatus es EN_REVISION o CONCLUIDA, NO se considera vencida
          const estado =
            row.estatus === "EN_REVISION" || row.estatus === "CONCLUIDA"
              ? "normal"
              : getEstadoFecha(fechaLimiteDate);

          const vencida = estado === "vencida" && row.estatus === "PENDIENTE";

          // 🚀 LÓGICA NUEVA: ENTREGADA CON RETRASO
          let entregadaTarde = false;
          let fechaParaColumna: Date | string | null = null;
          let labelColumna = "Conclusión";

          if (row.estatus === "EN_REVISION") {
            fechaParaColumna = row.fechaEntrega || null;
            labelColumna = "Entrega";
            if (fechaParaColumna && fechaLimiteDate) {
              entregadaTarde = new Date(fechaParaColumna).getTime() > new Date(fechaLimiteDate).getTime();
            }
          } else if (row.estatus === "CONCLUIDA") {
            fechaParaColumna = row.fechaConclusion || null;
            const fechaReferencia = row.fechaEntrega || row.fechaConclusion;
            if (fechaReferencia && fechaLimiteDate) {
              entregadaTarde = new Date(fechaReferencia).getTime() > new Date(fechaLimiteDate).getTime();
            }
          } else if (row.estatus === "CANCELADA") {
            fechaParaColumna = row.fechaConclusion || null;
            labelColumna = "Cancelación";
          }

          const isResponsable = row.responsables.some((r) => r.id === user?.id);
          const canReview =
            row.asignadorId === user?.id ||
            user?.rol === "ADMIN" ||
            user?.rol === "SUPER_ADMIN";

          return (
            <div
              key={row.id}
              className={`border border-gray-300 shadow-sm p-4 rounded-md ${getRowClass(row.estatus)}`}
            >
              {/* --- CABECERA (Como en Admin) --- */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800 text-base leading-snug w-[75%] break-words">
                  {row.tarea}
                </h3>
                <span
                  className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold ${row.urgencia === "ALTA"
                    ? "bg-red-100 text-red-700 border-red-300"
                    : row.urgencia === "MEDIA"
                      ? "bg-amber-100 text-amber-700 border-amber-300"
                      : "bg-green-100 text-green-700 border-green-300"
                    } rounded-full border`}
                >
                  {row.urgencia.charAt(0) + row.urgencia.slice(1).toLowerCase()}
                </span>
              </div>

              {/* OBSERVACIONES */}
              {row.observaciones && (
                <div className="mb-3 bg-white/50 p-2 rounded border border-gray-200 text-xs italic text-gray-700 break-words">
                  <span className="font-bold not-italic">Instrucciones: </span>
                  {row.observaciones}
                </div>
              )}

              {/* --- CUERPO --- */}
              <div className="text-xs text-gray-600 space-y-2">
                <p>
                  <span className="font-semibold text-gray-700">Asignado por:</span>{" "}
                  <span className="text-amber-700 font-semibold">
                    {row.asignador?.nombre || "N/A"}
                  </span>
                </p>

                <p>
                  <span className="font-semibold text-gray-700">Responsable:</span>{" "}
                  <span className="text-blue-700 font-semibold">
                    {row.responsables.map((r: any) => r.nombre).join(", ")}
                  </span>
                </p>

                <p>
                  <span className="font-semibold text-gray-700">Registro:</span>{" "}
                  {formateaSoloFecha(row.fechaRegistro)}
                </p>

                {/* FECHA LÍMITE (En una sola línea, igual que Admin) */}
                <div className="flex items-start">
                  <span className="font-semibold text-gray-700 mt-1 mr-2">Límite:</span>
                  <RenderFechaLimiteMovil fecha={fechaLimiteDate} vencida={vencida} />
                </div>

                {/* Historial (Con detalles desplegables) */}
                {row.historialFechas && row.historialFechas.length > 0 && (
                  <details className="mt-1 text-[11px] transition-all duration-300">
                    <summary className="cursor-pointer select-none font-semibold text-blue-600 hover:underline flex items-center gap-1">
                      Historial ({row.historialFechas.length})
                    </summary>
                    <div className="mt-2 bg-white/40 border border-gray-200 rounded p-2 text-gray-700">
                      <ul className="space-y-1">
                        {row.historialFechas.map((h: any, i) => (
                          <li key={i} className="border-b border-gray-100 last:border-none pb-1">
                            <div className="font-bold text-[10px]">Nueva: {formateaFecha(h.nuevaFecha)}</div>
                            <div className="text-[10px] text-gray-500">Por: {h.modificadoPor.nombre}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                )}

                <p>
                  <span className="font-semibold text-gray-700">Estatus:</span>{" "}
                  <span className={`text-xs font-bold ${row.estatus === "CONCLUIDA" ? "text-green-700" : row.estatus === "CANCELADA" ? "text-red-700" : row.estatus === "EN_REVISION" ? "text-indigo-700" : "text-blue-700"}`}>
                    {row.estatus === "EN_REVISION" ? "EN REVISIÓN" : row.estatus}
                  </span>
                </p>

                {/* Nota de corrección si la rechazaron */}
                {row.estatus === "PENDIENTE" && row.feedbackRevision && (
                  <p className="flex flex-col mt-1">
                    <span className="text-[10px] font-bold text-red-800 bg-red-100 border border-red-300 px-1.5 py-0.5 rounded w-fit flex items-center gap-1">
                      ⚠️ Corrección: "{row.feedbackRevision}"
                    </span>
                  </p>
                )}
              </div>

              {/* FECHA ENTREGA/CONCLUSIÓN */}
              {fechaParaColumna && (
                <div className={`mt-2 text-xs flex items-center`}>
                  <span className="font-semibold text-gray-700 mr-2">{labelColumna}:</span>
                  <RenderFechaEntregaMovil fecha={fechaParaColumna} estatus={row.estatus} entregadaTarde={entregadaTarde} />
                </div>
              )}

              {/* Imágenes */}
              {row.imagenes && row.imagenes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-300/50 flex justify-center">
                  <button
                    onClick={() => onVerImagenes(row.imagenes)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z" />
                    </svg>
                    Ver Imágenes ({row.imagenes.length})
                  </button>
                </div>
              )}

              {/* --- ACCIONES --- */}
              {((isResponsable && row.estatus === "PENDIENTE") ||
                (canReview && row.estatus === "EN_REVISION") ||
                (isResponsable && row.estatus === "EN_REVISION")) && (
                  <div className="flex justify-around items-center mt-4 pt-2 border-t border-gray-200 h-[46px]">

                    {/* ENTREGAR / CORREGIR */}
                    {isResponsable && row.estatus === "PENDIENTE" && (
                      <button
                        onClick={() => onEntregar(row)}
                        className={`flex flex-col items-center transition ${row.feedbackRevision
                          ? "text-orange-700 hover:text-orange-800"
                          : "text-green-700 hover:text-green-800"
                          }`}
                        title={row.feedbackRevision ? "Corregir" : "Entregar"}
                      >
                        {row.feedbackRevision ? (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-6 h-6 fill-current">
                            <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
                            <g transform="translate(400, -450) scale(0.5)">
                              <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
                            </g>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-6 h-6 fill-current">
                            <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
                          </svg>
                        )}
                        <span className="text-[11px] font-bold mt-0.5">
                          {row.feedbackRevision ? "Corregir" : "Entregar"}
                        </span>
                      </button>
                    )}

                    {/* REVISAR */}
                    {canReview && row.estatus === "EN_REVISION" && (
                      <button
                        onClick={() => onRevisar(row)}
                        className="flex flex-col items-center text-indigo-700 hover:text-indigo-800 transition"
                        title="Revisar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-6 h-6 fill-current">
                          <path d="M440-240q116 0 198-81.5T720-520q0-116-82-198t-198-82q-117 0-198.5 82T160-520q0 117 81.5 198.5T440-240Zm0-280Zm0 160q-83 0-147.5-44.5T200-520q28-70 92.5-115T440-680q82 0 146.5 45T680-520q-29 71-93.5 115.5T440-360Zm0-60q55 0 101-26.5t72-73.5q-26-46-72-73t-101-27q-56 0-102 27t-72 73q26 47 72 73.5T440-420Zm0-40q25 0 42.5-17t17.5-43q0-25-17.5-42.5T440-580q-26 0-43 17.5T380-520q0 26 17 43t43 17Zm0 300q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T80-520q0-74 28.5-139.5t77-114.5q48.5-49 114-77.5T440-880q74 0 139.5 28.5T694-774q49 49 77.5 114.5T800-520q0 64-21 121t-58 104l159 159-57 56-159-158q-47 37-104 57.5T440-160Z" />
                        </svg>
                        <span className="text-[11px] font-bold mt-0.5">Revisar</span>
                      </button>
                    )}

                    {/* ESPERANDO REVISIÓN (Animación) */}
                    {isResponsable && row.estatus === "EN_REVISION" && !canReview && (
                      <div className="flex flex-col items-center text-indigo-600 opacity-90 animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className="w-6 h-6 fill-current">
                          <path d="M320-160h320v-120q0-66-47-113t-113-47q-66 0-113 47t-47 113v120Zm160-360q66 0 113-47t47-113v-120H320v120q0 66 47 113t113 47ZM160-80v-80h80v-120q0-61 28.5-114.5T348-480q-51-32-79.5-85.5T240-680v-120h-80v-80h640v80h-80v120q0 61-28.5 114.5T612-480q51 32 79.5 85.5T720-280v120h80v80H160Zm320-80Zm0-640Z" />
                        </svg>
                        <span className="text-[11px] font-bold mt-0.5">
                          Esperando
                        </span>
                      </div>
                    )}
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {/* ✅ BARRA DE PAGINACIÓN */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg gap-3 mx-2 mb-2 shadow-sm">
        {/* Contenedor Izquierdo: Info de Página y Cantidad */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <span className="text-xs text-gray-600 font-medium">
            Página <span className="font-bold text-gray-900">{page}</span> de <span className="font-bold text-gray-900">{totalPages}</span>
          </span>
          <span className="hidden sm:block text-gray-300">|</span>
          <span className="text-[11px] text-gray-500 bg-gray-200/70 px-2 py-0.5 rounded-full font-medium">
            {totalTareas} {totalTareas === 1 ? 'tarea en esta categoría' : 'tareas en total'}
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Anterior
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablaPendientesMobile;