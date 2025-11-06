// src/components/Pendientes/TablaPendientesMobile.tsx
import React from "react";
import type {
  Tarea,
  Estatus,
  HistorialFecha,
  ImagenTarea,
} from "../../types/tarea";

// 1. Definimos las props que recibirá este componente
interface TablaPendientesMobileProps {
  tareas: Tarea[];
  formateaFecha: (fecha?: Date | string | null) => string;
  getRowClass: (estatus: Estatus) => string;
  getFechaFinalObj: (row: Tarea) => Date | string | null;
  getEstadoFecha: (
    fechaLimiteObj: Date | string | null
  ) => "vencida" | "proxima" | "normal";
  onVerImagenes: (imagenes: ImagenTarea[]) => void;
}

const TablaPendientesMobile: React.FC<TablaPendientesMobileProps> = ({
  tareas,
  formateaFecha,
  getRowClass,
  getFechaFinalObj,
  getEstadoFecha,
  onVerImagenes,
}) => {
  // 2. Usamos el estilo de "tarjeta" que te gustó
  return (
    <div className="grid lg:hidden grid-cols-1 md:grid-cols-2 gap-3 p-2 items-start">
      {/* 3. Mapeamos sobre las 'tareas' (que son los pendientesOrdenados del padre) */}
      {tareas.map((row) => {
        // 4. Reutilizamos la misma lógica de fechas
        const fechaFinalObj = getFechaFinalObj(row);
        const estado = getEstadoFecha(fechaFinalObj);
        const vencida = estado === "vencida";
        const proxima = estado === "proxima";

        const hayObservaciones = !!row.observaciones;
        const hayHistorial =
          row.historialFechas && row.historialFechas.length > 0;
        const hayImagenes = row.imagenes && row.imagenes.length > 0;

        return (
          <div
            key={row.id}
            className={`border border-gray-300 shadow-sm p-4 ${getRowClass(
              row.estatus
            )} rounded-md`}
          >
            {/* Tarea y Prioridad */}
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-gray-800 text-base leading-snug pr-2">
                {row.tarea}
              </h3>
              <span
                className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold ${
                  row.urgencia === "ALTA"
                    ? "bg-red-100 text-red-700 border border-red-300 rounded-full"
                    : row.urgencia === "MEDIA"
                    ? "bg-amber-100 text-amber-700 border border-amber-300 rounded-full"
                    : "bg-green-100 text-green-700 border border-green-300 rounded-full"
                }`}
              >
                {/* Mostramos el valor literal */}
                {row.urgencia === "ALTA"
                  ? "Alta"
                  : row.urgencia === "MEDIA"
                  ? "Media"
                  : "Baja"}
              </span>
            </div>

            {/* Responsable */}
            <div className="text-sm text-gray-700 mb-1">
              <span className="font-semibold">Responsable:</span>
              <ul className="list-disc list-inside ml-1 text-blue-700 font-semibold">
                {row.responsables.map((r: any) => (
                  <li key={r.id}>{r.nombre}</li>
                ))}
              </ul>
            </div>

            {/* Fecha Límite */}
            <div className="text-sm text-gray-700 mb-1 flex items-center">
              <span className="font-semibold">Límite:</span>
              <span
                className={`ml-1.5 font-bold ${
                  vencida
                    ? "text-red-600"
                    : proxima
                    ? "text-amber-600"
                    : "text-gray-800"
                }`}
              >
                {formateaFecha(fechaFinalObj) || "—"}
              </span>
              {(vencida || proxima) && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className={`w-4 h-4 ml-1 ${
                    vencida ? "text-red-500" : "text-amber-500"
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

            {/* Observaciones (si existen) */}
            {row.observaciones && (
              <p className="text-sm text-gray-600 italic mt-2 pt-2 border-t border-blue-100">
                {row.observaciones}
              </p>
            )}

            {/* 6. AÑADIR BLOQUE DE HISTORIAL */}
            {row.historialFechas && row.historialFechas.length > 0 && (
              <details
                className={`mt-3 pt-3 text-xs transition-all duration-300 open:pb-2 ${
                  hayObservaciones ? "border-t border-blue-100" : ""
                }`}
              >
                <summary className="cursor-pointer select-none font-semibold text-blue-600 hover:underline flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5 text-blue-500 transition-transform duration-200 group-open:rotate-180"
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

                <div className="mt-2 bg-white/80 border border-gray-200 rounded-md p-2 text-gray-700">
                  <ul className="space-y-2">
                    {row.historialFechas.map((h: HistorialFecha, i) => (
                      <li
                        key={i}
                        className="border-b border-gray-100 pb-1 last:border-none"
                      >
                        <p>
                          <span className="font-semibold text-gray-800">
                            Modificación:
                          </span>{" "}
                          {formateaFecha(h.fechaCambio)}
                        </p>
                        <p>
                          <span className="font-semibold text-gray-800">
                            Anterior:
                          </span>{" "}
                          {formateaFecha(h.fechaAnterior)} →{" "}
                          <span className="font-semibold text-gray-800">
                            Nueva:
                          </span>{" "}
                          {formateaFecha(h.nuevaFecha)}
                        </p>
                        <p className="italic text-gray-600">
                          Por: {h.modificadoPor.nombre}
                        </p>
                        {h.motivo && (
                          <p className="italic text-gray-600">
                            Motivo: {h.motivo}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            )}
            {row.imagenes && row.imagenes.length > 0 && (
              <div
                className={`mt-3 pt-3 flex justify-center ${
                  hayObservaciones || hayHistorial || hayImagenes
                    ? "border-t border-blue-100"
                    : ""
                }`}
              >
                <button
                  onClick={() => onVerImagenes(row.imagenes)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
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
          </div>
        );
      })}
    </div>
  );
};

export default TablaPendientesMobile;
