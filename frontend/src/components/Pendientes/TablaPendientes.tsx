// 📍 src/components/Pendientes/TablaPendientes.tsx

import React, { useState, useEffect } from "react";
import { tareasService } from "../../api/tareas.service";
import type {
  Tarea,
  HistorialFecha,
  Estatus,
  Urgencia,
  ImagenTarea,
} from "../../types/tarea";
import type { Usuario } from "../../types/usuario";

// Importar los componentes hijos
import TablaPendientesMobile from "./TablaPendientesMobile";
import ModalGaleria from "../Principal/ModalGaleria";

// Tipo de vista de tareas (debe coincidir con Pendientes.tsx)
type ActiveView = "MIS_TAREAS" | "ASIGNADAS" | "TODAS";

// --- Funciones Helper (Sin cambios) ---
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

const getRowClass = (estatus: Estatus): string => {
  switch (estatus) {
    case "CONCLUIDA":
      return "bg-green-50 text-green-900 border-l-4 border-green-500";
    case "CANCELADA":
      return "bg-red-50 text-red-900 border-l-4 border-red-500";
    default: // PENDIENTE
      return "bg-blue-50 text-blue-900 border-l-4 border-blue-500";
  }
};

const getFechaFinalObj = (row: Tarea): Date | string | null => {
  if (row.historialFechas && row.historialFechas.length > 0) {
    // La fecha más reciente del historial es la nueva fecha límite
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
  hoy.setHours(0, 0, 0, 0);
  const fechaComparar = new Date(fecha);
  fechaComparar.setHours(0, 0, 0, 0);
  const diff = fechaComparar.getTime() - hoy.getTime();
  const diasRestantes = Math.round(diff / (1000 * 60 * 60 * 24));
  if (diasRestantes < 0) return "vencida";
  if (diasRestantes === 0) return "proxima";
  return "normal";
};

// --- Hook useMediaQuery (Sin cambios) ---
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
};

// 2. Definir la interfaz de Props con el nuevo viewType
interface Props {
  user: Usuario | null;
  viewType?: ActiveView; // Usamos el nuevo tipo
}

// 3. Aplicar la interfaz y desestructurar 'user' y 'viewType'
const TablaPendientes: React.FC<Props> = ({ user, viewType }) => {
  // 4. Renombrar 'tareas' a 'tareasPendientes' para mayor claridad (según tu código)
  const [tareasPendientes, setTareasPendientes] = useState<Tarea[]>([]);
  const [pagina, setPagina] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalImagenes, setModalImagenes] = useState<ImagenTarea[] | null>(
    null
  );

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // 5. Modificar fetchTareas para que use el endpoint correcto
  const fetchTareas = async () => {
    if (!user) {
      setTareasPendientes([]);
      setLoading(false);
      return;
    }

    try {
      let tareasDesdeServicio: Tarea[] = [];
      const filters = { estatus: "PENDIENTE" as const };

      // 💡 LÓGICA CLAVE: Seleccionar el endpoint del servicio
      if (viewType === "ASIGNADAS") {
        tareasDesdeServicio = await tareasService.getAsignadas(filters);
      } else if (viewType === "MIS_TAREAS") {
        tareasDesdeServicio = await tareasService.getMisTareas(filters);
      } else {
        // "TODAS" (o undefined si por error no se pasa, lo cual usa getAll)
        tareasDesdeServicio = await tareasService.getAll(filters);
      }

      // (Tu lógica de mapeo de fechas es correcta)
      const tareasConFechas = tareasDesdeServicio.map((t: any) => ({
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
        imagenes: t.imagenes || [],
        responsables: t.responsables || [],
      }));

      // 💡 ÚNICO FILTRO NECESARIO: Filtrar por estatus PENDIENTE en el cliente.
      const tareasFiltradas = tareasConFechas.filter(
        (t: Tarea) => t.estatus === "PENDIENTE"
      );

      // 5c. Guardar en el estado la lista ya filtrada
      setTareasPendientes(tareasFiltradas as Tarea[]);
    } catch (error) {
      console.error("❌ Error al cargar tareas:", error);
      setTareasPendientes([]);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchTareas().finally(() => setLoading(false));

    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (isDesktop) {
      intervalId = setInterval(() => {
        // console.log("🔄 [Desktop] Recargando tareas pendientes...");
        fetchTareas();
      }, 30000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isDesktop, user, viewType]); // 💡 CAMBIO: Dependencia de user y viewType

  const pendientesOrdenados = [...tareasPendientes].sort((a, b) => {
    const fechaA = getFechaFinalObj(a);
    const fechaB = getFechaFinalObj(b);
    const timeA = fechaA ? new Date(fechaA as any).getTime() : 0;
    const timeB = fechaB ? new Date(fechaB as any).getTime() : 0;
    if (!timeA || isNaN(timeA)) return 1;
    if (!timeB || isNaN(timeB)) return -1;
    return timeA - timeB;
  });

  const itemsPorPagina = 8;
  const totalPaginas = Math.ceil(pendientesOrdenados.length / itemsPorPagina);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    if (isDesktop && totalPaginas > 1) {
      intervalId = setInterval(() => {
        setPagina((prev) => (prev + 1) % totalPaginas);
      }, 15000);
    } else {
      setPagina(0);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [totalPaginas, isDesktop]);

  const visibles = pendientesOrdenados.slice(
    pagina * itemsPorPagina,
    (pagina + 1) * itemsPorPagina
  );

  return (
    <div className="w-full pb-2 text-sm font-sans">
      {/* 9. El resto del render usa 'pendientesOrdenados', lo cual es correcto */}
      {loading ? (
        // ✅ CAMBIO: Aquí integramos el Spinner animado
        <div className="flex flex-col justify-center items-center h-40 text-gray-500 italic">
          {/* El Spinner */}
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>

          {/* Mensaje */}
          <span className="text-gray-600 font-semibold">
            Cargando tareas...
          </span>
        </div>
      ) : pendientesOrdenados.length > 0 ? (
        <>
          {/* 💻 VISTA ESCRITORIO (Usa la lista paginada 'visibles') */}
          <div className="hidden lg:block">
            <table className="w-full border border-gray-200 rounded-lg shadow-md text-[13px] leading-tight">
              {/* ... (Tu <thead> de escritorio) ... */}
              <thead className="bg-gray-100 text-gray-700 uppercase sticky top-0 z-10 text-xs">
                <tr>
                  <th className="px-2 py-1 text-left font-bold border-b border-gray-300">
                    Responsable
                  </th>
                  <th className="px-2 py-1 text-left font-bold border-b border-gray-300">
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
                {visibles.map((row) => {
                  const fechaFinalObj = getFechaFinalObj(row);
                  const estado = getEstadoFecha(fechaFinalObj);
                  const vencida = estado === "vencida";
                  const proxima = estado === "proxima";

                  return (
                    <tr
                      key={row.id}
                      className={`${getRowClass(row.estatus)} transition ${vencida ? "bg-red-50/60" : ""
                        }`}
                    >
                      <td className="px-2 py-1 text-left text-lg font-semibold text-blue-700">
                        <ul className="list-disc list-inside m-0 p-0">
                          {row.responsables.map((r: any) => (
                            <li key={r.id}>{r.nombre}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-1.5 text-left font-semibold text-lg align-top">
                        <div className="text-gray-800">{row.tarea}</div>
                        {row.observaciones && (
                          <p className="text-sm text-gray-500 italic mt-1 break-words max-w-xl leading-snug">
                            {row.observaciones}
                          </p>
                        )}
                      </td>
                      <td className="px-2 py-1 text-center">
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
                        className={`px-2 py-1 text-center text-lg font-bold ${vencida
                          ? "text-red-600"
                          : proxima
                            ? "text-amber-600"
                            : "text-gray-800"
                          }`}
                      >
                        {formateaFecha(fechaFinalObj) || "—"}
                        {(vencida || proxima) && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className={`w-3 h-3 ml-1 inline ${vencida ? "text-red-500" : "text-amber-500"
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

            {/* ✅ MODIFICACIÓN: Paginación Interactiva */}
            {totalPaginas > 1 && (
              <div className="flex justify-center mt-2 space-x-1">
                {Array.from({ length: totalPaginas }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPagina(i)}
                    className={`w-4 h-4 rounded-full focus:outline-none ${i === pagina
                      ? "bg-amber-700 scale-110"
                      : "bg-gray-300 hover:bg-gray-400"
                      } transition-all duration-300 cursor-pointer`}
                    title={`Ir a página ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* 📱 VISTA MÓVIL (Usa la lista COMPLETA 'pendientesOrdenados') */}
          <TablaPendientesMobile
            tareas={pendientesOrdenados} // Pasa la lista filtrada y ordenada
            formateaFecha={formateaFecha}
            getRowClass={getRowClass}
            getFechaFinalObj={getFechaFinalObj}
            getEstadoFecha={getEstadoFecha}
            onVerImagenes={(imagenes) => setModalImagenes(imagenes)}
          />

          {/* Renderiza el modal */}
          {modalImagenes && (
            <ModalGaleria
              imagenes={modalImagenes}
              onClose={() => setModalImagenes(null)}
            />
          )}
        </>
      ) : (
        <div className="flex justify-center items-center h-40 text-gray-500 italic text-sm">
          No hay tareas pendientes.
        </div>
      )}
    </div>
  );
};

export default TablaPendientes;