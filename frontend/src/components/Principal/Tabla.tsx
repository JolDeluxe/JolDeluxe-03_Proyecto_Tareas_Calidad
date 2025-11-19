import React, { useState } from "react";
import type {
  Tarea,
  ImagenTarea,
  HistorialFecha,
  ResponsableLimpio,
} from "../../types/tarea";
import type { Usuario } from "../../types/usuario";
import ModalGaleria from "./ModalGaleria";

// 2. ✅ La interfaz AHORA recibe las tareas y el loading
interface TablaProps {
  filtro: string;
  year: number;
  month: number;
  responsable: string;
  query: string;
  tareas: Tarea[];
  loading: boolean;
  user: Usuario | null;
}

const formateaFecha = (fecha?: Date | string | null): string => {
  if (!fecha) return "";
  const dateObj = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return "";
  }
  const d = String(dateObj.getDate()).padStart(2, "0");
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const y = dateObj.getFullYear();
  return `${d}/${m}/${y}`;
};

const getRowClass = (status: string): string => {
  const s = status.toLowerCase();
  if (s.includes("concluida")) return "bg-green-50 border-l-4 border-green-500";
  if (s.includes("cancelada")) return "bg-red-50 border-l-4 border-red-500";
  return "bg-blue-50 border-l-4 border-blue-500";
};

const isRetrasada = (
  limite?: Date | string | null,
  conclusion?: Date | string | null
): boolean => {
  if (!limite || !conclusion) return false;

  // Convierte ambos a objetos Date para comparar
  const limiteDate = typeof limite === "string" ? new Date(limite) : limite;
  const conclusionDate = typeof conclusion === "string" ? new Date(conclusion) : conclusion;

  if (
    !(limiteDate instanceof Date) ||
    isNaN(limiteDate.getTime()) ||
    !(conclusionDate instanceof Date) ||
    isNaN(conclusionDate.getTime())
  ) {
    return false;
  }

  // 🚀 FIX: Crear copias de las fechas y resetear la hora a 00:00:00
  // Esto asegura que comparemos solo el DÍA calendario y no la hora exacta.
  const l = new Date(limiteDate);
  l.setHours(0, 0, 0, 0);

  const c = new Date(conclusionDate);
  c.setHours(0, 0, 0, 0);

  // Ahora si: 20/11 (00:00) > 20/11 (00:00) es False (A tiempo)
  // 21/11 (00:00) > 20/11 (00:00) es True (Retrasada)
  return c.getTime() > l.getTime();
};

// 4. ✅ El componente AHORA recibe las props del padre
const Tabla: React.FC<TablaProps> = ({
  filtro,
  year,
  month,
  responsable,
  query,
  tareas,
  loading,
  user,
}) => {
  const [modalImagenes, setModalImagenes] = useState<ImagenTarea[] | null>(
    null
  );

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
    const estatus = t.estatus.toUpperCase();
    const pasaEstatus =
      filtro.toUpperCase() === "TOTAL" ||
      (filtro.toUpperCase() === "PENDIENTES" && estatus === "PENDIENTE") ||
      (filtro.toUpperCase() === "CONCLUIDAS" && estatus === "CONCLUIDA") ||
      (filtro.toUpperCase() === "CANCELADAS" && estatus === "CANCELADA");

    const pasaFecha = filtrarPorFecha(t.fechaRegistro);

    const pasaResponsable =
      responsable === "Todos" ||
      (t.responsables &&
        t.responsables.some(
          (responsableObj: ResponsableLimpio) =>
            responsableObj.id.toString() === responsable
        ));

    const texto = `${t.tarea} ${t.observaciones || ""}`.toLowerCase();
    const pasaBusqueda =
      query.trim() === "" || texto.includes(query.toLowerCase());

    return pasaEstatus && pasaFecha && pasaResponsable && pasaBusqueda;
  });

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-40 text-gray-500 italic">
        {/* El Spinner */}
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>

        {/* Mensaje */}
        <span className="text-gray-600 font-semibold">Cargando tareas...</span>
      </div>
    );
  }

  return (
    <div className="w-full text-sm font-sans pb-0.5">
      {tareasFiltradas && tareasFiltradas.length > 0 ? (
        <>
          {/* 💻 VISTA ESCRITORIO */}
          <div className="hidden lg:block max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-auto rounded-lg border border-gray-300">
            <table className="w-full text-sm font-sans">
              <thead className="bg-gray-100 text-black text-xs uppercase sticky top-0 z-20 shadow-inner">
                <tr>
                  {/* 🚀 ANCHOS OPTIMIZADOS (Suman ~100% para evitar scroll horizontal innecesario) */}
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[4%]">
                    ID
                  </th>
                  <th className="px-3 py-3 text-left font-bold border-b border-gray-300 w-[14%]">
                    Tarea
                  </th>
                  {/* 🚀 NUEVA COLUMNA DE IMAGEN */}
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[5%]">
                    Img
                  </th>
                  <th className="px-3 py-3 text-left font-bold border-b border-gray-300 w-[10%]">
                    Observaciones
                  </th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[8%]">
                    Asignado por
                  </th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[13%]">
                    Responsable(s)
                  </th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[6%]">
                    Prioridad
                  </th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[7%]">
                    Registro
                  </th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[10%]">
                    Fecha límite / Historial
                  </th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[7%]">
                    Conclusión
                  </th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[7%]">
                    Estatus
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {tareasFiltradas.map((row: Tarea) => {
                  const hoy = new Date();
                  hoy.setHours(0, 0, 0, 0);

                  // Lógica de fechas (asumida)
                  const fechaLimiteObj =
                    row.historialFechas && row.historialFechas.length > 0
                      ? new Date(
                        row.historialFechas[
                          row.historialFechas.length - 1
                        ].nuevaFecha!
                      )
                      : row.fechaLimite
                        ? new Date(row.fechaLimite)
                        : null;

                  if (fechaLimiteObj) fechaLimiteObj.setHours(0, 0, 0, 0);

                  const vencida =
                    fechaLimiteObj &&
                    fechaLimiteObj < hoy &&
                    row.estatus === "PENDIENTE";

                  const retrasada = isRetrasada(
                    fechaLimiteObj,
                    row.fechaConclusion
                  );

                  const fechaLimiteFinalStr = formateaFecha(fechaLimiteObj);

                  return (
                    <tr
                      key={row.id}
                      className={`${getRowClass(row.estatus)} transition`}
                    >
                      {/* Columna ID */}
                      <td className="px-3 py-3 text-center font-semibold w-[4%]">
                        {row.id}
                      </td>

                      {/* Columna Tarea */}
                      <td className="px-3 py-3 text-left font-semibold w-[14%]">
                        {row.tarea}
                      </td>

                      {/* 🚀 Columna IMAGEN (Implementación del Badge) */}
                      <td className="px-3 py-3 text-center w-[5%]">
                        {row.imagenes && row.imagenes.length > 0 ? (
                          <button
                            onClick={() => setModalImagenes(row.imagenes)}
                            title={`Ver ${row.imagenes.length} imagen(es)`}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full 
                                           bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white 
                                           transition-colors duration-200 shadow-sm"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 -960 960 960"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z" />
                            </svg>
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Columna Observaciones */}
                      <td className="px-3 py-3 text-left text-gray-700 italic w-[10%]">
                        {row.observaciones || ""}
                      </td>

                      {/* Columna Asignado por */}
                      <td className="px-3 py-3 text-center text-amber-800 font-semibold w-[8%]">
                        {row.asignador.nombre}
                      </td>

                      {/* Columna Responsable(s) */}
                      <td className="px-3 py-3 text-center text-blue-700 font-semibold w-[13%] align-top">
                        <ul className="text-xs list-none p-0 m-0 space-y-0.5">
                          {row.responsables.map((r, i) => (
                            <li key={i} className="leading-tight">
                              {r.nombre}
                            </li>
                          ))}
                        </ul>
                      </td>

                      {/* Columna Prioridad */}
                      <td className="px-3 py-3 text-center font-semibold w-[6%]">
                        {row.urgencia === "ALTA" ? (
                          <span className="text-red-700 font-bold">Alta</span>
                        ) : row.urgencia === "MEDIA" ? (
                          <span className="text-amber-700 font-bold">
                            Media
                          </span>
                        ) : (
                          <span className="text-green-700 font-bold">Baja</span>
                        )}
                      </td>

                      {/* Columna Registro */}
                      <td className="px-3 py-3 text-center w-[7%]">
                        {formateaFecha(row.fechaRegistro)}
                      </td>

                      {/* === Celda Fecha límite e historial === */}
                      <td className="px-1 py-4 text-center font-semibold whitespace-nowrap w-[10%]">
                        <div
                          className={`flex flex-col items-center ${row.historialFechas &&
                            row.historialFechas.length > 0
                            ? "justify-start"
                            : "justify-center h-full"
                            } min-h-[50px]`}
                        >
                          <p
                            className={`font-semibold ${vencida
                              ? "text-red-600 font-bold"
                              : "text-gray-800"
                              }`}
                          >
                            {fechaLimiteFinalStr}
                            {vencida && (
                              <span className="ml-1 inline-flex items-center">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="w-3.5 h-3.5 text-red-500"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M12 2.25a9.75 9.75 0 1 1 0 19.5 9.75 9.75 0 0 1 0-19.5Zm0 1.5a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Zm.75 4.5a.75.75 0 0 0-1.5 0v4.5c0 .414.336.75.75.75h3.75a.75.75 0 0 0 0-1.5h-3V8.25Z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                            )}
                          </p>

                          {row.historialFechas &&
                            row.historialFechas.length > 0 && (
                              <details
                                className="mt-2 text-xs w-[95%] open:pb-1 transition-all duration-200"
                                style={{ backgroundColor: "transparent" }}
                              >
                                <summary
                                  className="text-blue-600 font-semibold cursor-pointer hover:underline select-none list-none flex items-center justify-center gap-1"
                                  style={{ outline: "none" }}
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-3 h-3 text-blue-500 transition-transform duration-200 group-open:rotate-180"
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

                                <div className="mt-2 text-gray-700 bg-white/70 rounded-md p-2 border border-gray-200 text-left">
                                  <ul className="space-y-1">
                                    {row.historialFechas.map((h, i) => (
                                      <li
                                        key={i}
                                        className="leading-tight border-b border-gray-100 pb-1 last:border-none"
                                      >
                                        <p>
                                          <span className="font-semibold">
                                            Modificación:
                                          </span>{" "}
                                          {formateaFecha(h.fechaCambio)}
                                        </p>
                                        <p>
                                          <span className="font-semibold">
                                            Anterior:
                                          </span>{" "}
                                          {formateaFecha(h.fechaAnterior)} →{" "}
                                          <span className="font-semibold">
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
                        </div>
                      </td>
                      {/* === FIN Celda Historial === */}

                      {/* Columna Conclusión */}
                      <td
                        className={`px-3 py-3 text-center w-[7%] ${retrasada ? "text-red-600 font-bold" : "text-gray-800"
                          }`}
                      >
                        {row.fechaConclusion
                          ? formateaFecha(row.fechaConclusion)
                          : "—"}
                      </td>

                      {/* Columna Estatus */}
                      <td className="px-4 py-4 text-center w-[7%]">
                        <span
                          className={`px-3 py-1 text-md font-bold ${row.estatus === "CONCLUIDA"
                            ? "text-green-700"
                            : row.estatus === "CANCELADA"
                              ? "text-red-700"
                              : "text-blue-700"
                            }`}
                        >
                          {row.estatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* === vISTA MOVIL === */}
          <div className="grid lg:hidden grid-cols-1 md:grid-cols-2 gap-3 p-2 items-start">
            {/* 💡 'row' es del tipo Tarea importado, con objetos Date */}
            {tareasFiltradas.map((row: Tarea) => {
              const hoy = new Date();

              // 💡 'fechaLimiteObj' es un objeto Date
              const fechaLimiteObj =
                row.historialFechas && row.historialFechas.length > 0
                  ? row.historialFechas[row.historialFechas.length - 1]
                    .nuevaFecha
                  : row.fechaLimite;

              const fechaLimiteDate =
                typeof fechaLimiteObj === "string"
                  ? new Date(fechaLimiteObj)
                  : fechaLimiteObj;

              let vencida = false;
              if (
                fechaLimiteDate instanceof Date &&
                !isNaN(fechaLimiteDate.getTime())
              ) {
                const fechaLimiteNormalizada = new Date(fechaLimiteDate);
                fechaLimiteNormalizada.setHours(0, 0, 0, 0); // Normaliza la fecha límite

                vencida =
                  fechaLimiteNormalizada < hoy && row.estatus !== "CONCLUIDA";
              }

              const retrasada = isRetrasada(row.fechaLimite, row.fechaConclusion);

              return (
                <div
                  key={row.id}
                  className={`border border-gray-300 shadow-sm p-4 ${getRowClass(
                    row.estatus
                  )} rounded-md`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-800 text-base leading-snug">
                      {row.tarea}
                    </h3>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold ${row.urgencia === "ALTA"
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

                  <div className="text-xs text-gray-600 space-y-1">
                    <p>
                      <span className="font-semibold text-gray-700">
                        Asignado por:
                      </span>{" "}
                      <span className="text-amber-700 font-semibold">
                        {row.asignador.nombre}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">
                        Responsable:
                      </span>{" "}
                      <span className="text-blue-700 font-semibold">
                        {row.responsables.map((r: any) => r.nombre).join(", ")}{" "}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">
                        Registro:
                      </span>{" "}
                      {formateaFecha(row.fechaRegistro)}
                    </p>

                    {/* 📆 Fecha límite con validación y reloj si está vencida */}
                    {/* 💡 CORREGIDO: Se elimina el IIFE y la lógica de .split() */}
                    <p className="flex items-center text-xs">
                      <span className="font-semibold text-gray-700">
                        Límite:
                      </span>{" "}
                      <span
                        className={`ml-1 font-semibold ${vencida ? "text-red-600" : "text-gray-800"
                          }`}
                      >
                        {/* 💡 CORREGIDO: Usar formateador */}
                        {formateaFecha(fechaLimiteObj)}
                      </span>
                      {vencida && (
                        <span className="ml-1 inline-flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-3.5 h-3.5 text-red-500"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12 2.25a9.75 9.75 0 1 1 0 19.5 9.75 9.75 0 0 1 0-19.5Zm0 1.5a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Zm.75 4.5a.75.75 0 0 0-1.5 0v4.5c0 .414.336.75.75.75h3.75a.75.75 0 0 0 0-1.5h-3V8.25Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </p>

                    <p>
                      <span className="font-semibold text-gray-700">
                        Estatus:
                      </span>{" "}
                      <span
                        className={`text-xs font-bold ${row.estatus === "CONCLUIDA"
                          ? "text-green-700"
                          : row.estatus === "CANCELADA"
                            ? "text-red-700"
                            : "text-blue-700"
                          }`}
                      >
                        {row.estatus}
                      </span>
                    </p>
                  </div>

                  {row.fechaConclusion && (
                    <p
                      className={`mt-2 text-xs flex items-center ${retrasada
                        ? "text-red-600 font-semibold"
                        : "text-gray-700"
                        }`}
                    >
                      <span className="font-semibold text-gray-700">
                        Conclusión:
                      </span>{" "}
                      <span className="ml-1">
                        {/* ✅ 9. CORRECCIÓN: La función ya acepta string | Date */}
                        {formateaFecha(row.fechaConclusion)}
                      </span>
                      {retrasada && (
                        <span className="ml-1 inline-flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-3.5 h-3.5 text-red-500"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12 2.25a9.75 9.75 0 1 1 0 19.5 9.75 9.75 0 0 1 0-19.5Zm0 1.5a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Zm.75 4.5a.75.75 0 0 0-1.5 0v4.5c0 .414.336.75.75.75h3.75a.75.75 0 0 0 0-1.5h-3V8.25Z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </p>
                  )}

                  {/* 🔽 Collapse — historial de cambios */}
                  {row.historialFechas && row.historialFechas.length > 0 && (
                    <details className="mt-3 text-xs transition-all duration-300 open:pb-2">
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
                              <p className="italic text-gray-600">
                                Motivo: {h.motivo}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </details>
                  )}

                  {row.imagenes && row.imagenes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-center">
                      <button
                        onClick={() => setModalImagenes(row.imagenes)}
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
        </>
      ) : (
        <div className="flex justify-center items-center h-40 text-gray-500 italic text-sm">
          No hay tareas registradas.
        </div>
      )}
      {/* 🔽 7. RENDERIZA EL MODAL (si 'modalImagenes' no es null) */}
      {modalImagenes && (
        <ModalGaleria
          imagenes={modalImagenes}
          onClose={() => setModalImagenes(null)}
        />
      )}
    </div>
  );
};

export default Tabla;
