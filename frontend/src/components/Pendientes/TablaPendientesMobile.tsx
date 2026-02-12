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
}) => {
  return (
    <div className="grid lg:hidden grid-cols-1 md:grid-cols-2 gap-3 p-2 items-start">
      {tareas.map((row) => {
        const fechaFinalObj = getFechaFinalObj(row);
        const estado =
          row.estatus === "EN_REVISION" || row.estatus === "CONCLUIDA"
            ? "normal"
            : getEstadoFecha(fechaFinalObj);
        const vencida = estado === "vencida";
        const proxima = estado === "proxima";

        const isResponsable = row.responsables.some((r) => r.id === user?.id);
        const canReview =
          row.asignadorId === user?.id ||
          user?.rol === "ADMIN" ||
          user?.rol === "SUPER_ADMIN";

        const hayObservaciones = !!row.observaciones;

        return (
          <div
            key={row.id}
            className={`border border-gray-300 shadow-sm p-4 rounded-md ${getRowClass(
              row.estatus
            )}`}
          >
            {/* --- CABECERA --- */}
            <div className="flex justify-between items-start mb-2">
              <div className="flex flex-col pr-2">
                <h3 className="font-bold text-gray-800 text-base leading-snug">
                  {row.tarea}
                </h3>
                {row.estatus === "EN_REVISION" && (
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 border border-indigo-300 px-1.5 py-0.5 rounded mt-1 w-fit">
                    EN REVISIÓN
                  </span>
                )}
                {row.estatus === "PENDIENTE" && row.feedbackRevision && (
                  <span className="text-[10px] font-bold text-red-800 bg-red-100 border border-red-300 px-1.5 py-0.5 rounded mt-1 w-fit flex items-center gap-1">
                    ⚠️ Corrección: "{row.feedbackRevision}"
                  </span>
                )}
              </div>

              <span
                className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold ${row.urgencia === "ALTA"
                  ? "bg-red-100 text-red-700 border border-red-300 rounded-full"
                  : row.urgencia === "MEDIA"
                    ? "bg-amber-100 text-amber-700 border border-amber-300 rounded-full"
                    : "bg-green-100 text-green-700 border border-green-300 rounded-full"
                  }`}
              >
                {row.urgencia === "ALTA"
                  ? "Alta"
                  : row.urgencia === "MEDIA"
                    ? "Media"
                    : "Baja"}
              </span>
            </div>

            {/* --- CUERPO --- */}
            <div className="text-xs text-gray-700 space-y-1 mb-2">
              <p>
                <span className="font-bold">Asignado por:</span>{" "}
                <span className="text-amber-800 font-semibold">
                  {row.asignador?.nombre || "N/A"}
                </span>
              </p>

              <div className="flex flex-wrap gap-1">
                <span className="font-bold">Responsable:</span>
                <span className="text-blue-800 font-semibold">
                  {row.responsables.map((r: any) => r.nombre).join(", ")}
                </span>
              </div>

              <p>
                <span className="font-bold">Registro:</span>{" "}
                {/* 🚀 SOLO FECHA */}
                {formateaSoloFecha(row.fechaRegistro)}
              </p>

              <div className="flex items-center">
                <span className="font-bold">Límite:</span>{" "}
                <span
                  className={`ml-1 font-bold ${vencida
                    ? "text-red-700"
                    : proxima
                      ? "text-amber-700"
                      : "text-gray-800"
                    }`}
                >
                  {/* 🚀 FECHA HORA (EN LÍNEA) */}
                  {formateaFecha(fechaFinalObj) || "—"}
                </span>
                {(vencida || proxima) && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`w-3.5 h-3.5 ml-1 ${vencida ? "text-red-600" : "text-amber-600"
                      }`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2.25a9.75 9.75 0 1 1 0 19.5 9.75 9.75 0 0 1 0-19.5Zm0 1.5a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Zm.75 4.5a.75.75 0 0 0-1.5 0v4.5c0 .414.336.75.75.75h3.75a.75.75 0 0 0 0-1.5h-3V8.25Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>

              <p>
                <span className="font-bold">Estatus:</span>{" "}
                <span className="font-bold uppercase opacity-90">
                  {row.estatus}
                </span>
              </p>

              {row.fechaConclusion && (
                <p>
                  <span className="font-bold">Conclusión:</span>{" "}
                  {/* Conclusión también podría llevar hora si gustas, aquí dejé la función general */}
                  {formateaFecha(row.fechaConclusion)}
                </p>
              )}
            </div>

            {/* Observaciones */}
            {row.observaciones && (
              <p className="text-sm text-gray-700 italic mt-2 pt-2 border-t border-gray-300/50">
                {row.observaciones}
              </p>
            )}

            {/* Historial */}
            {row.historialFechas && row.historialFechas.length > 0 && (
              <details
                className={`mt-2 pt-2 text-xs transition-all duration-300 open:pb-2 ${hayObservaciones ? "border-t border-gray-300/50" : ""
                  }`}
              >
                <summary className="cursor-pointer select-none font-bold text-blue-700 hover:underline flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5 text-blue-600 transition-transform duration-200 group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  Ver historial ({row.historialFechas.length})
                </summary>

                <div className="mt-2 bg-white/60 border border-gray-200 rounded-md p-2 text-gray-800">
                  <ul className="space-y-2">
                    {row.historialFechas.map((h: HistorialFecha, i) => (
                      <li
                        key={i}
                        className="border-b border-gray-200 pb-1 last:border-none"
                      >
                        <p>
                          <span className="font-bold">Modificación:</span>{" "}
                          {formateaFecha(h.fechaCambio)}
                        </p>
                        <p>
                          <span className="font-bold">Cambio:</span>{" "}
                          {formateaFecha(h.fechaAnterior)} →{" "}
                          {formateaFecha(h.nuevaFecha)}
                        </p>
                        <p className="italic">Por: {h.modificadoPor.nombre}</p>
                        {h.motivo && <p className="italic">Motivo: {h.motivo}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
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

            {/* Acciones */}
            {((isResponsable && row.estatus === "PENDIENTE") ||
              (canReview && row.estatus === "EN_REVISION") ||
              (isResponsable && row.estatus === "EN_REVISION")) && (
                <div className="flex justify-around items-center mt-4 pt-2 border-t border-gray-300/60 h-[46px]">
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
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 -960 960 960"
                          className="w-6 h-6 fill-current"
                        >
                          <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
                          <g transform="translate(400, -450) scale(0.5)">
                            <path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z" />
                          </g>
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 -960 960 960"
                          className="w-6 h-6 fill-current"
                        >
                          <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
                        </svg>
                      )}
                      <span className="text-[11px] font-bold mt-0.5">
                        {row.feedbackRevision ? "Corregir" : "Entregar"}
                      </span>
                    </button>
                  )}

                  {canReview && row.estatus === "EN_REVISION" && (
                    <button
                      onClick={() => onRevisar(row)}
                      className="flex flex-col items-center text-indigo-700 hover:text-indigo-800 transition"
                      title="Revisar"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 -960 960 960"
                        className="w-6 h-6 fill-indigo-700"
                      >
                        <path d="M440-240q116 0 198-81.5T720-520q0-116-82-198t-198-82q-117 0-198.5 82T160-520q0 117 81.5 198.5T440-240Zm0-280Zm0 160q-83 0-147.5-44.5T200-520q28-70 92.5-115T440-680q82 0 146.5 45T680-520q-29 71-93.5 115.5T440-360Zm0-60q55 0 101-26.5t72-73.5q-26-46-72-73t-101-27q-56 0-102 27t-72 73q26 47 72 73.5T440-420Zm0-40q25 0 42.5-17t17.5-43q0-25-17.5-42.5T440-580q-26 0-43 17.5T380-520q0 26 17 43t43 17Zm0 300q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T80-520q0-74 28.5-139.5t77-114.5q48.5-49 114-77.5T440-880q74 0 139.5 28.5T694-774q49 49 77.5 114.5T800-520q0 64-21 121t-58 104l159 159-57 56-159-158q-47 37-104 57.5T440-160Z" />
                      </svg>
                      <span className="text-[11px] font-bold mt-0.5">Revisar</span>
                    </button>
                  )}

                  {isResponsable && row.estatus === "EN_REVISION" && (
                    <div className="flex flex-col items-center text-indigo-600 opacity-90 animate-pulse">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 -960 960 960"
                        className="w-6 h-6 fill-current"
                      >
                        <path d="M320-160h320v-120q0-66-47-113t-113-47q-66 0-113 47t-47 113v120Zm160-360q66 0 113-47t47-113v-120H320v120q0 66 47 113t113 47ZM160-80v-80h80v-120q0-61 28.5-114.5T348-480q-51-32-79.5-85.5T240-680v-120h-80v-80h640v80h-80v120q0 61-28.5 114.5T612-480q51 32 79.5 85.5T720-280v120h80v80H160Zm320-80Zm0-640Z" />
                      </svg>
                      <span className="text-[11px] font-bold mt-0.5">
                        Esperando
                      </span>
                    </div>
                  )}

                  {!(isResponsable && row.estatus === "PENDIENTE") &&
                    !(canReview && row.estatus === "EN_REVISION") &&
                    !(isResponsable && row.estatus === "EN_REVISION") && (
                      <span className="text-gray-500 text-xs italic">
                        Solo lectura
                      </span>
                    )}
                </div>
              )}
          </div>
        );
      })}
    </div>
  );
};

export default TablaPendientesMobile;