import React, { useState, useEffect } from "react";
import { api } from "../data/api";
// 💡 1. Importa tu modelo real (ajusta la ruta si es necesario)
import type { Tarea, HistorialFecha } from "../../types/tarea";

interface TablaProps {
  filtro: string;
  year: number;
  month: number;
  responsable: string;
  query: string;
}

// 💡 2. Se eliminan las 'interface Tarea' e 'interface HistorialFecha' locales
// porque ahora usamos el modelo importado.

// 🔹 Utilidad para formatear fechas Date → dd/mm/yyyy
const formateaFecha = (fecha?: Date | null): string => {
  if (!fecha) return "";
  const d = String(fecha.getDate()).padStart(2, "0");
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const y = fecha.getFullYear();
  return `${d}/${m}/${y}`;
};

const Tabla: React.FC<TablaProps> = ({
  filtro,
  year,
  month,
  responsable,
  query,
}) => {
  // 💡 3. El estado usa el tipo 'Tarea' importado
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);

  // 🧠 Cargar tareas desde backend
  useEffect(() => {
    const fetchTareas = async () => {
      try {
        setLoading(true);
        // La API da strings (formato ISO), los recibimos como 'any' temporalmente
        const res = await api.get<any[]>("/tareas");

        // 💡 4. Convertimos los strings ISO de la API a objetos Date REALES
        const tareasConFechas = res.data.map((t: any) => ({
          ...t,
          fechaRegistro: t.fechaRegistro ? new Date(t.fechaRegistro) : null,
          fechaLimite: t.fechaLimite ? new Date(t.fechaLimite) : null,
          fechaConclusion: t.fechaConclusion
            ? new Date(t.fechaConclusion)
            : null,
          historialFechas:
            t.historialFechas?.map((h: any) => ({
              ...h,
              fechaCambio: h.fechaCambio ? new Date(h.fechaCambio) : null,
              fechaAnterior: h.fechaAnterior ? new Date(h.fechaAnterior) : null,
              nuevaFecha: h.nuevaFecha ? new Date(h.nuevaFecha) : null,
            })) || [],
        }));

        // Guardamos los datos con objetos Date en el estado
        setTareas(tareasConFechas as Tarea[]);
      } catch (error) {
        console.error("Error al cargar tareas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTareas();
  }, []);

  // 🎨 Clases según estatus
  const getRowClass = (status: string): string => {
    const s = status.toLowerCase();
    if (s.includes("concluida"))
      return "bg-green-50 border-l-4 border-green-500";
    if (s.includes("cancelada")) return "bg-red-50 border-l-4 border-red-500";
    return "bg-blue-50 border-l-4 border-blue-500";
  };

  // 🧮 Verifica si se concluyó después de la fecha límite
  // 💡 5. Lógica simple: compara objetos Date directamente
  const isRetrasada = (limite: Date, conclusion?: Date | null): boolean => {
    if (!conclusion) return false;
    return conclusion > limite;
  };

  // 📊 Aplicar filtros
  const tareasFiltradas = tareas.filter((t) => {
    // 't' es ahora del tipo 'Tarea' importado
    const estatus = t.estatus.toUpperCase();

    const pasaEstatus =
      filtro.toUpperCase() === "TOTAL" ||
      (filtro.toUpperCase() === "PENDIENTES" && estatus === "PENDIENTE") ||
      (filtro.toUpperCase() === "CONCLUIDAS" && estatus === "CONCLUIDA") ||
      (filtro.toUpperCase() === "CANCELADAS" && estatus === "CANCELADA");

    // 💡 6. El filtro funciona porque 't.fechaRegistro' ES un objeto Date
    let pasaFecha = true;
    if (t.fechaRegistro) {
      const y = t.fechaRegistro.getFullYear(); // <-- Esto ya funciona
      const m = t.fechaRegistro.getMonth() + 1;
      if (y !== year) pasaFecha = false;
      if (month !== 0 && m !== month) pasaFecha = false;
    }

    const pasaResponsable =
      responsable === "Todos" || t.responsable === responsable;

    const texto = `${t.tarea} ${t.observaciones || ""}`.toLowerCase();
    const pasaBusqueda =
      query.trim() === "" || texto.includes(query.toLowerCase());

    return pasaEstatus && pasaFecha && pasaResponsable && pasaBusqueda;
  });

  return (
    <div className="w-full text-sm font-sans pb-0.5">
      {tareasFiltradas && tareasFiltradas.length > 0 ? (
        <>
          {/* 💻 VISTA ESCRITORIO */}
          <div className="hidden md:block max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-auto rounded-lg border border-gray-300">
            <table className="w-full text-sm font-sans">
              <thead className="bg-gray-100 text-black text-xs uppercase sticky top-0 z-20 shadow-inner">
                <tr>
                  <th className="w-[3%] px-4 py-4 text-center font-bold border-b border-gray-400">
                    ID
                  </th>
                  <th className="w-[17%] px-4 py-4 text-center font-bold border-b border-gray-400">
                    Tarea
                  </th>
                  <th className="w-[17%] px-4 py-4 text-center font-bold border-b border-gray-400">
                    Observaciones
                  </th>
                  <th className="w-[12%] px-4 py-4 text-center font-bold border-b border-gray-400">
                    Asignado por
                  </th>
                  <th className="w-[12%] px-4 py-4 text-center font-bold border-b border-gray-400">
                    Responsable
                  </th>
                  <th className="w-[6%] px-4 py-4 text-center font-bold border-b border-gray-400">
                    Prioridad
                  </th>
                  <th className="w-[8%] px-4 py-4 text-center font-bold border-b border-gray-400">
                    Registro
                  </th>
                  <th className="w-[10%] px-4 py-4 text-center font-bold border-b border-gray-400">
                    Fecha Límite / Historial
                  </th>
                  <th className="w-[8%] px-4 py-4 text-center font-bold border-b border-gray-400">
                    Conclusión
                  </th>
                  <th className="w-[7%] px-4 py-4 text-center font-bold border-b border-gray-400">
                    Estatus
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {/* 💡 'row' es del tipo Tarea importado, con objetos Date */}
                {tareasFiltradas.map((row: Tarea) => {
                  const hoy = new Date();

                  // 💡 'fechaLimiteObj' es un objeto Date, no un string
                  const fechaLimiteObj =
                    row.historialFechas && row.historialFechas.length > 0
                      ? row.historialFechas[row.historialFechas.length - 1]
                          .nuevaFecha
                      : row.fechaLimite;

                  // 💡 La comparación es directa entre objetos Date
                  const vencida =
                    fechaLimiteObj &&
                    fechaLimiteObj < hoy &&
                    row.estatus !== "CONCLUIDA";

                  // 💡 'isRetrasada' ya compara objetos Date
                  const retrasada = isRetrasada(
                    row.fechaLimite,
                    row.fechaConclusion
                  );

                  return (
                    <tr
                      key={row.id}
                      className={`${getRowClass(row.estatus)} transition`}
                    >
                      <td className="px-4 py-4 text-center font-semibold">
                        {row.id}
                      </td>
                      <td className="px-4 py-4 text-left font-semibold break-words">
                        {row.tarea}
                      </td>
                      <td className="px-4 py-4 text-left italic text-gray-700">
                        {row.observaciones}
                      </td>

                      <td className="px-4 py-4 text-left">
                        <span className="px-3 py-1 text-sm font-semibold text-amber-800">
                          {row.asignador}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="px-3 py-1 text-sm font-semibold text-blue-700">
                          {row.responsable}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        {row.urgencia === "ALTA" ? (
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-300 text-xs font-bold">
                            Alta
                          </span>
                        ) : row.urgencia === "MEDIA" ? (
                          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full border border-amber-300 text-xs font-bold">
                            Media
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-300 text-xs font-bold">
                            Baja
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center font-semibold whitespace-nowrap align-middle">
                        {/* 💡 CORREGIDO: Usar el formateador */}
                        {formateaFecha(row.fechaRegistro)}
                      </td>

                      {/* === 📆 Fecha límite e historial === */}
                      <td className="px-1 py-4 text-center font-semibold whitespace-nowrap align-top">
                        <div
                          className={`flex flex-col items-center ${
                            row.historialFechas &&
                            row.historialFechas.length > 0
                              ? "justify-start"
                              : "justify-center"
                          } min-h-[90px]`}
                        >
                          {/* 💡 CORREGIDO: Se elimina el IIFE y la lógica de .split() 
                         La lógica de 'vencida' ya se hizo arriba. */}
                          <p
                            className={`font-semibold ${
                              vencida
                                ? "text-red-600 font-bold"
                                : "text-gray-800"
                            }`}
                          >
                            {/* 💡 CORREGIDO: Usar el formateador */}
                            {formateaFecha(fechaLimiteObj)}
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
                                          {/* 💡 CORREGIDO: Usar formateador */}
                                          {formateaFecha(h.fechaCambio)}
                                        </p>
                                        <p>
                                          <span className="font-semibold">
                                            Anterior:
                                          </span>{" "}
                                          {/* 💡 CORREGIDO: Usar formateador */}
                                          {formateaFecha(
                                            h.fechaAnterior
                                          )} →{" "}
                                          <span className="font-semibold">
                                            Nueva:
                                          </span>{" "}
                                          {/* 💡 CORREGIDO: Usar formateador */}
                                          {formateaFecha(h.nuevaFecha)}
                                        </p>
                                        <p className="italic text-gray-600">
                                          Modificado por: {h.modificadoPor}
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
                        </div>
                      </td>

                      <td
                        className={`px-4 py-4 text-center font-semibold whitespace-nowrap ${
                          // 💡 'retrasada' se calcula arriba
                          retrasada ? "text-red-600 font-bold" : "text-gray-800"
                        }`}
                      >
                        {/* 💡 CORREGIDO: Usar formateador */}
                        {row.fechaConclusion
                          ? formateaFecha(row.fechaConclusion)
                          : "—"}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span
                          className={`px-3 py-1 text-md font-bold ${
                            row.estatus === "CONCLUIDA"
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

          {/* === vISTA MOVIL === */}
          <div className="block md:hidden space-y-3 pb-0.5">
            {/* 💡 'row' es del tipo Tarea importado, con objetos Date */}
            {tareasFiltradas.map((row: Tarea) => {
              const hoy = new Date();

              // 💡 'fechaLimiteObj' es un objeto Date
              const fechaLimiteObj =
                row.historialFechas && row.historialFechas.length > 0
                  ? row.historialFechas[row.historialFechas.length - 1]
                      .nuevaFecha
                  : row.fechaLimite;

              // 💡 Comparamos objetos Date
              const vencida =
                fechaLimiteObj &&
                fechaLimiteObj < hoy &&
                row.estatus !== "CONCLUIDA";

              // 💡 'isRetrasada' ya compara objetos Date
              const retrasada = isRetrasada(
                row.fechaLimite,
                row.fechaConclusion
              );

              return (
                <div
                  key={row.id}
                  className={`border border-gray-300 shadow-sm p-4 ${getRowClass(
                    row.estatus
                  )} rounded-md`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono font-semibold">
                      #{row.id}
                    </span>
                  </div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-800 text-base leading-snug">
                      {row.tarea}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold ${
                        row.urgencia === "ALTA"
                          ? "text-red-700"
                          : row.urgencia === "MEDIA"
                          ? "text-amber-700"
                          : "text-green-700"
                      }`}
                    >
                      {row.urgencia}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    <p>
                      <span className="font-semibold text-gray-700">
                        Asignado por:
                      </span>{" "}
                      <span className="text-amber-700 font-semibold">
                        {row.asignador}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">
                        Responsable:
                      </span>{" "}
                      <span className="text-blue-700 font-semibold">
                        {row.responsable}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">
                        Registro:
                      </span>{" "}
                      {/* 💡 CORREGIDO: Usar formateador */}
                      {formateaFecha(row.fechaRegistro)}
                    </p>

                    {/* 📆 Fecha límite con validación y reloj si está vencida */}
                    {/* 💡 CORREGIDO: Se elimina el IIFE y la lógica de .split() */}
                    <p className="flex items-center text-xs">
                      <span className="font-semibold text-gray-700">
                        Límite:
                      </span>{" "}
                      <span
                        className={`ml-1 font-semibold ${
                          vencida ? "text-red-600" : "text-gray-800"
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
                        className={`text-xs font-bold ${
                          row.estatus === "CONCLUIDA"
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
                          {row.historialFechas.map((h, i) => (
                            <li
                              key={i}
                              className="border-b border-gray-100 pb-1 last:border-none"
                            >
                              <p>
                                <span className="font-semibold text-gray-800">
                                  Modificación:
                                </span>{" "}
                                {/* 💡 CORREGIDO: Usar formateador */}
                                {formateaFecha(h.fechaCambio)}
                              </p>
                              <p>
                                <span className="font-semibold text-gray-800">
                                  Anterior:
                                </span>{" "}
                                {/* 💡 CORREGIDO: Usar formateador */}
                                {formateaFecha(h.fechaAnterior)} →{" "}
                                <span className="font-semibold text-gray-800">
                                  Nueva:
                                </span>{" "}
                                {/* 💡 CORREGIDO: Usar formateador */}
                                {formateaFecha(h.nuevaFecha)}
                              </p>
                              <p className="italic text-gray-600">
                                Por: {h.modificadoPor}
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

                  {/* ✅ Fecha de conclusión */}
                  {/* 💡 CORREGIDO: Se elimina el IIFE y la lógica de .split() */}
                  {row.fechaConclusion && (
                    <p
                      className={`mt-2 text-xs flex items-center ${
                        // 💡 'retrasada' se calcula arriba
                        retrasada
                          ? "text-red-600 font-semibold"
                          : "text-gray-700"
                      }`}
                    >
                      <span className="font-semibold text-gray-700">
                        Conclusión:
                      </span>{" "}
                      <span className="ml-1">
                        {/* 💡 CORREGIDO: Usar formateador */}
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
    </div>
  );
};

export default Tabla;
