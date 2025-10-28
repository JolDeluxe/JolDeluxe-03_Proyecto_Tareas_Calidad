import React, { useState, useEffect } from "react";
import { api } from "../data/api"; // 👈 Asegúrate que esta ruta a la API sea correcta
// 💡 1. Importa tus tipos reales (ajusta la ruta si es necesario)
import type {
  Tarea,
  HistorialFecha,
  Estatus,
  Urgencia,
} from "../../types/tarea";

// 🔹 Utilidad para formatear fechas Date → dd/mm/yyyy
const formateaFecha = (fecha?: Date | null): string => {
  if (!fecha) return "";
  try {
    // Verifica si ya es un objeto Date válido
    if (!(fecha instanceof Date) || isNaN(fecha.getTime())) {
      // Si no lo es, intenta convertirlo (puede venir de la API como string)
      const parsedDate = new Date(fecha as any);
      if (isNaN(parsedDate.getTime())) return ""; // Si falla, retorna vacío
      fecha = parsedDate;
    }
    const d = String(fecha.getDate()).padStart(2, "0");
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const y = fecha.getFullYear();
    return `${d}/${m}/${y}`;
  } catch {
    return ""; // En caso de cualquier error inesperado
  }
};

// 🎨 Colores por estatus (basado en ENUM/tipo importado)
const getRowClass = (estatus: Estatus): string => {
  switch (estatus) {
    case "CONCLUIDA": // Usar los valores del tipo
      return "bg-green-50 text-green-900 border-l-4 border-green-500";
    case "CANCELADA":
      return "bg-red-50 text-red-900 border-l-4 border-red-500";
    default: // PENDIENTE
      return "bg-blue-50 text-blue-900 border-l-4 border-blue-500";
  }
};

// 🧭 Obtiene el objeto Date final (última del historial si existe)
const getFechaFinalObj = (row: Tarea): Date | null => {
  if (row.historialFechas && row.historialFechas.length > 0) {
    const ultimaFechaHistorial =
      row.historialFechas[row.historialFechas.length - 1].nuevaFecha;
    return ultimaFechaHistorial instanceof Date &&
      !isNaN(ultimaFechaHistorial.getTime())
      ? ultimaFechaHistorial
      : row.fechaLimite instanceof Date && !isNaN(row.fechaLimite.getTime())
      ? row.fechaLimite
      : null;
  }
  return row.fechaLimite instanceof Date && !isNaN(row.fechaLimite.getTime())
    ? row.fechaLimite
    : null;
};

// ⏰ Clasifica si está vencida o es HOY el día límite
const getEstadoFecha = (
  fechaLimiteObj: Date | null
): "vencida" | "proxima" | "normal" => {
  if (!fechaLimiteObj) return "normal";

  if (!(fechaLimiteObj instanceof Date) || isNaN(fechaLimiteObj.getTime())) {
    return "normal";
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaComparar = new Date(fechaLimiteObj);
  fechaComparar.setHours(0, 0, 0, 0);

  const diff = fechaComparar.getTime() - hoy.getTime();
  const diasRestantes = Math.round(diff / (1000 * 60 * 60 * 24));

  if (diasRestantes < 0) return "vencida";
  if (diasRestantes === 0) return "proxima";
  return "normal";
};

const TablaPendientes: React.FC = () => {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [pagina, setPagina] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🔹 FUNCIÓN DE CARGA DE TAREAS (Recarga el estado de tareas)
  const fetchTareas = async () => {
    try {
      // No modificamos loading aquí, lo hace el useEffect para la carga inicial
      const res = await api.get<any[]>("/tareas");

      // 💡 Convertimos strings ISO a objetos Date REALES
      const tareasConFechas = res.data.map((t: any) => ({
        ...t,
        fechaRegistro: t.fechaRegistro ? new Date(t.fechaRegistro) : null,
        fechaLimite: t.fechaLimite ? new Date(t.fechaLimite) : null,
        fechaConclusion: t.fechaConclusion ? new Date(t.fechaConclusion) : null,
        historialFechas:
          t.historialFechas?.map((h: any) => ({
            ...h,
            fechaCambio: h.fechaCambio ? new Date(h.fechaCambio) : null,
            fechaAnterior: h.fechaAnterior ? new Date(h.fechaAnterior) : null,
            nuevaFecha: h.nuevaFecha ? new Date(h.nuevaFecha) : null,
          })) || [],
      }));

      // Guardamos los datos, lo que dispara el re-renderizado
      setTareas(tareasConFechas as Tarea[]);
    } catch (error) {
      console.error("❌ Error al cargar tareas:", error);
    }
  };

  // 🔄 POLLING: Cargar tareas inicialmente y luego cada 30 segundos
  useEffect(() => {
    // 1. Carga inicial
    setLoading(true);
    fetchTareas().finally(() => setLoading(false));

    // 2. Configurar el intervalo de recarga (Polling)
    const intervalId = setInterval(() => {
      console.log("🔄 Recargando tareas pendientes automáticamente...");
      fetchTareas();
    }, 30000); // 30000 ms = 30 segundos

    // 3. Limpieza: Detener el intervalo cuando el componente se desmonte
    return () => clearInterval(intervalId);
  }, []);

  // 🔹 Solo tareas pendientes y ordenadas (Lógica de filtrado y orden)
  const pendientes = tareas.filter((t) => t.estatus === "PENDIENTE");

  const pendientesOrdenados = [...pendientes].sort((a, b) => {
    const fechaA = getFechaFinalObj(a);
    const fechaB = getFechaFinalObj(b);

    if (!fechaA) return 1;
    if (!fechaB) return -1;

    return fechaA.getTime() - fechaB.getTime();
  });

  // --- Rotación automática (se mantiene) ---
  const itemsPorPagina = 8;
  const totalPaginas = Math.ceil(pendientesOrdenados.length / itemsPorPagina);

  useEffect(() => {
    // Este useEffect ahora solo se encarga de la rotación
    if (totalPaginas > 1) {
      const interval = setInterval(() => {
        setPagina((prev) => (prev + 1) % totalPaginas);
      }, 15000); // Rota cada 15 segundos
      return () => clearInterval(interval);
    }
    // Si totalPaginas es 1 o 0, asegura que la página sea 0 y detiene el intervalo.
    setPagina(0);
  }, [totalPaginas]); // Depende solo de totalPaginas

  const visibles = pendientesOrdenados.slice(
    pagina * itemsPorPagina,
    (pagina + 1) * itemsPorPagina
  );
  // --- Fin Rotación ---

  return (
    <div className="w-full pb-2 text-sm font-sans">
      {loading ? (
        <div className="flex justify-center items-center h-40 text-gray-500 italic">
          Cargando tareas...
        </div>
      ) : pendientesOrdenados.length > 0 ? (
        <div className="hidden md:block">
          <table className="w-full border border-gray-200 rounded-lg shadow-md text-[13px] leading-tight">
            <thead className="bg-gray-100 text-gray-700 uppercase sticky top-0 z-10 text-xs">
              {/* Encabezados sin cambios */}
              <tr>
                <th className="px-2 py-1 text-center font-bold border-b border-gray-300">
                  Responsable
                </th>
                <th className="px-2 py-1 text-center font-bold border-b border-gray-300">
                  Tarea / Descripción
                </th>
                <th className="px-2 py-1 text-center font-bold border-b border-gray-300">
                  Prioridad
                </th>
                <th className="px-2 py-1 text-center font-bold border-b border-gray-300">
                  Fecha Límite
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {/* 💡 9. Dentro del map, usamos los objetos Date y formateamos al mostrar */}
              {visibles.map((row) => {
                // Obtenemos el objeto Date final
                const fechaFinalObj = getFechaFinalObj(row);
                // Obtenemos el estado (vencida, proxima, normal) a partir del objeto Date
                const estado = getEstadoFecha(fechaFinalObj);
                const vencida = estado === "vencida";
                const proxima = estado === "proxima";

                return (
                  <tr
                    key={row.id}
                    // getRowClass recibe el tipo Estatus
                    className={`${getRowClass(row.estatus)} transition ${
                      vencida ? "bg-red-50/60" : ""
                    }`}
                  >
                    <td className="px-2 py-1 text-center text-lg font-semibold text-blue-700">
                      {row.responsable}
                    </td>

                    <td className="px-3 py-1.5 text-left font-semibold text-lg">
                      {row.tarea}
                      {row.observaciones && ( // Mostrar observaciones solo si existen
                        <p className="text-md text-gray-600 italic">
                          {row.observaciones}
                        </p>
                      )}
                    </td>

                    <td className="px-2 py-1 text-center">
                      {/* Lógica de urgencia sin cambios */}
                      {row.urgencia === "ALTA" ? (
                        <span className="bg-red-100 text-red-700 px-2 py-[1px] rounded-full border border-red-300 text-lg font-bold">
                          Alta
                        </span>
                      ) : row.urgencia === "MEDIA" ? (
                        <span className="bg-amber-100 text-amber-700 px-2 py-[1px] rounded-full border border-amber-300 text-lg font-bold">
                          Media
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-700 px-2 py-[1px] rounded-full border border-green-300 text-lg font-bold">
                          Baja
                        </span>
                      )}
                    </td>

                    <td
                      className={`px-2 py-1 text-center text-lg font-bold ${
                        vencida
                          ? "text-red-600"
                          : proxima
                          ? "text-amber-600"
                          : "text-gray-800"
                      }`}
                    >
                      {/* 💡 CORREGIDO: Formatear el objeto Date al mostrar */}
                      {formateaFecha(fechaFinalObj) || "—"}
                      {(vencida || proxima) && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className={`w-3 h-3 ml-1 inline ${
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 🔸 Indicador visual de páginas (sin cambios) */}
          {totalPaginas > 1 && (
            <div className="flex justify-center mt-2 space-x-1">
              {Array.from({ length: totalPaginas }).map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full ${
                    i === pagina ? "bg-amber-700" : "bg-gray-300"
                  } transition-all duration-500`}
                ></div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center items-center h-40 text-gray-500 italic text-sm">
          No hay tareas pendientes.
        </div>
      )}
    </div>
  );
};

export default TablaPendientes;
