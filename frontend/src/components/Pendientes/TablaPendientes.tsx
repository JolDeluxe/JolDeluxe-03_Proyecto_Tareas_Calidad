// 📍 src/components/Pendientes/TablaPendientes.tsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { tareasService } from "../../api/tareas.service";
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
// ✅ NUEVO: Importamos el Modal de Revisión
import ModalRevision from "../Admin/ModalRevision";

type ActiveView = "MIS_TAREAS" | "ASIGNADAS" | "TODAS";

// --- Funciones Helper ---
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
  hoy.setHours(0, 0, 0, 0);
  const fechaComparar = new Date(fecha);
  fechaComparar.setHours(0, 0, 0, 0);
  const diff = fechaComparar.getTime() - hoy.getTime();
  const diasRestantes = Math.round(diff / (1000 * 60 * 60 * 24));
  if (diasRestantes < 0) return "vencida";
  if (diasRestantes === 0) return "proxima";
  return "normal";
};

// --- Hook useMediaQuery ---
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

interface Props {
  user: Usuario | null;
  viewType?: ActiveView;
}

const TablaPendientes: React.FC<Props> = ({ user, viewType }) => {
  const [tareasPendientes, setTareasPendientes] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Estados para Modales ---
  const [modalImagenes, setModalImagenes] = useState<ImagenTarea[] | null>(null);
  const [tipoGaleria, setTipoGaleria] = useState<"REFERENCIA" | "EVIDENCIA">("REFERENCIA");

  const [tareaParaEntregar, setTareaParaEntregar] = useState<Tarea | null>(null);
  // ✅ NUEVO ESTADO: Controla qué tarea se está revisando
  const [tareaParaRevisar, setTareaParaRevisar] = useState<Tarea | null>(null);

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // const navigate = useNavigate(); // Ya no necesitamos navegar para revisar

  const fetchTareas = async () => {
    if (!user) {
      setTareasPendientes([]);
      setLoading(false);
      return;
    }

    try {
      let tareasDesdeServicio: Tarea[] = [];

      if (viewType === "ASIGNADAS") {
        tareasDesdeServicio = await tareasService.getAsignadas();
      } else if (viewType === "MIS_TAREAS") {
        tareasDesdeServicio = await tareasService.getMisTareas();
      } else {
        tareasDesdeServicio = await tareasService.getAll();
      }

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

      // Filtro: Mostrar PENDIENTE y EN_REVISION
      const tareasFiltradas = tareasConFechas.filter(
        (t: Tarea) => t.estatus === "PENDIENTE" || t.estatus === "EN_REVISION"
      );

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
      intervalId = setInterval(() => fetchTareas(), 30000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isDesktop, user, viewType]);

  const pendientesOrdenados = [...tareasPendientes].sort((a, b) => {
    // 1️⃣ PRIORIDAD SUPREMA: Estatus "EN_REVISION" primero
    if (a.estatus === "EN_REVISION" && b.estatus !== "EN_REVISION") return -1;
    if (b.estatus === "EN_REVISION" && a.estatus !== "EN_REVISION") return 1;

    // 2️⃣ ORDENAMIENTO SECUNDARIO: Por fecha límite (Lo que ya tenías)
    const fechaA = getFechaFinalObj(a);
    const fechaB = getFechaFinalObj(b);
    const timeA = fechaA ? new Date(fechaA as any).getTime() : 0;
    const timeB = fechaB ? new Date(fechaB as any).getTime() : 0;

    // Manejo de fechas nulas/inválidas para que se vayan al final
    if (!timeA || isNaN(timeA)) return 1;
    if (!timeB || isNaN(timeB)) return -1;

    return timeA - timeB; // Orden ascendente (más cercana primero)
  });

  // --- Handlers de Modales ---

  // 1. Entrega (Responsable)
  const handleAbrirEntrega = (tarea: Tarea) => setTareaParaEntregar(tarea);
  const handleCerrarEntrega = () => setTareaParaEntregar(null);
  const handleExitoEntrega = () => {
    setTareaParaEntregar(null);
    fetchTareas();
  };

  // 2. Revisión (Admin/Asignador)
  // ✅ MODIFICADO: Ahora recibe la Tarea completa, no solo el ID
  const handleRevisar = (tarea: Tarea) => {
    setTareaParaRevisar(tarea);
  };

  const handleCerrarRevision = () => setTareaParaRevisar(null);

  const handleExitoRevision = () => {
    setTareaParaRevisar(null);
    fetchTareas(); // Recargamos para que la tarea aprobada desaparezca (si pasa a CONCLUIDA) o cambie de estado
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
            <div className="max-h-[80vh] overflow-y-auto border border-gray-200 rounded-lg shadow-md">
              <table className="w-full text-[13px] leading-tight">
                <thead className="bg-gray-100 text-gray-700 uppercase sticky top-0 z-10 text-xs">
                  <tr>
                    <th className="px-2 py-1 text-left font-bold border-b border-gray-300">Responsable</th>
                    <th className="px-2 py-1 text-left font-bold border-b border-gray-300">Tarea / Descripción</th>
                    <th className="px-2 py-1 text-center font-bold border-b border-gray-300">Prioridad</th>
                    <th className="px-2 py-1 text-center font-bold border-b border-gray-300">Fecha Límite</th>
                    <th className="px-2 py-1 text-center font-bold border-b border-gray-300">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendientesOrdenados.map((row) => {
                    const fechaFinalObj = getFechaFinalObj(row);
                    const estado = getEstadoFecha(fechaFinalObj);
                    const vencida = estado === "vencida";
                    const proxima = estado === "proxima";

                    // PERMISOS
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
                          <div className="text-gray-800 flex flex-col gap-1"> {/* Cambiado a flex-col para apilar */}

                            {/* 1. Título de la Tarea */}
                            <div className="flex items-center gap-2">
                              {row.tarea}
                              {/* Badge existente de EN_REVISION */}
                              {row.estatus === "EN_REVISION" && (
                                <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full border border-indigo-300">
                                  EN REVISIÓN
                                </span>
                              )}
                            </div>

                            {/* 🔥 2. NUEVO: Alerta Visual de Rechazo */}
                            {row.estatus === "PENDIENTE" && row.feedbackRevision && (
                              <div className="bg-red-50 border border-red-200 rounded-md p-2 mt-1 shadow-sm animation-fade-in">
                                <div className="flex items-start gap-2">

                                  {/* Icono de advertencia (SVG en lugar del emoji) */}
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    height="20px"
                                    width="20px"
                                    viewBox="0 -960 960 960"
                                    className="flex-shrink-0 fill-red-600"
                                  >
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

                          {/* Observaciones originales */}
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
                        <td className={`px-2 py-1 text-center text-lg font-bold ${vencida ? "text-red-600" : proxima ? "text-amber-600" : "text-gray-800"}`}>
                          {formateaFecha(fechaFinalObj) || "—"}
                          {(vencida || proxima) && (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-3 h-3 ml-1 inline ${vencida ? "text-red-500" : "text-amber-500"}`}>
                              <path fillRule="evenodd" d="M12 2.25a9.75 9.75 0 1 1 0 19.5 9.75 9.75 0 0 1 0-19.5Zm0 1.5a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Zm.75 4.5a.75.75 0 0 0-1.5 0v4.5c0 .414.336.75.75.75h3.75a.75.75 0 0 0 0-1.5h-3V8.25Z" clipRule="evenodd" />
                            </svg>
                          )}
                        </td>

                        <td className="px-2 py-1 text-center align-middle">
                          {/* Contenedor Flex para centrar los botones */}
                          <div className="flex items-center justify-center gap-2">

                            {/* --------------------------------------------------------- */}
                            {/* 1. BOTÓN RESPONSABLE: ENTREGAR / CORREGIR                 */}
                            {/* --------------------------------------------------------- */}
                            {isResponsable && row.estatus === "PENDIENTE" && (
                              <button
                                onClick={() => handleAbrirEntrega(row)}
                                title={
                                  row.feedbackRevision
                                    ? "Corregir y re-enviar evidencia"
                                    : "Subir evidencias y entregar"
                                }
                                className={`w-8 h-8 flex items-center justify-center rounded-md border transition-all duration-200 shadow-sm 
                                  ${row.feedbackRevision
                                    ? "border-orange-400 text-orange-600 hover:bg-orange-100 bg-orange-50"
                                    : "border-green-400 text-green-700 hover:bg-green-100 bg-green-50"
                                  }`}
                              >
                                {/* ICONO DINÁMICO */}
                                {row.feedbackRevision ? (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 -960 960 960"
                                    className="w-5 h-5 fill-current"
                                  >
                                    <path
                                      fill="#22c55e"
                                      d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />

                                    <g transform="translate(50, -450) scale(0.65)">
                                      <path
                                        fill="##742F01"
                                        d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"
                                      />
                                    </g>
                                  </svg>
                                ) : (
                                  // 🟢 ICONO ENTREGAR (Flecha Enviar)
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 -960 960 960"
                                    className="w-5 h-5 fill-current" // fill-current usa el color del texto (green-700)
                                  >
                                    <path d="M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z" />
                                  </svg>
                                )}
                              </button>
                            )}

                            {/* --------------------------------------------------------- */}
                            {/* 2. BOTÓN ADMIN/ASIGNADOR: REVISAR                         */}
                            {/* --------------------------------------------------------- */}
                            {canReview && row.estatus === "EN_REVISION" && (
                              <button
                                onClick={() => handleRevisar(row)}
                                title="Revisar evidencia y aprobar/rechazar"
                                className="w-8 h-8 flex items-center justify-center rounded-md border border-indigo-400 text-indigo-700 hover:bg-indigo-100 bg-indigo-50 transition-all duration-200 shadow-sm"
                              >
                                {/* Nuevo icono (ojo / revisión profunda) */}
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 -960 960 960"
                                  width="20px"
                                  height="20px"
                                  className="fill-indigo-700"
                                >
                                  <path d="M440-240q116 0 198-81.5T720-520q0-116-82-198t-198-82q-117 0-198.5 82T160-520q0 117 81.5 198.5T440-240Zm0-280Zm0 160q-83 0-147.5-44.5T200-520q28-70 92.5-115T440-680q82 0 146.5 45T680-520q-29 71-93.5 115.5T440-360Zm0-60q55 0 101-26.5t72-73.5q-26-46-72-73t-101-27q-56 0-102 27t-72 73q26 47 72 73.5T440-420Zm0-40q25 0 42.5-17t17.5-43q0-25-17.5-42.5T440-580q-26 0-43 17.5T380-520q0 26 17 43t43 17Zm0 300q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T80-520q0-74 28.5-139.5t77-114.5q48.5-49 114-77.5T440-880q74 0 139.5 28.5T694-774q49 49 77.5 114.5T800-520q0 64-21 121t-58 104l159 159-57 56-159-158q-47 37-104 57.5T440-160Z" />
                                </svg>
                              </button>
                            )}

                            {/* --------------------------------------------------------- */}
                            {/* 3. ESTADO DE ESPERA (Visualización Cuadrada Estática)     */}
                            {/* --------------------------------------------------------- */}
                            {isResponsable && row.estatus === "EN_REVISION" && (
                              <div
                                className="w-8 h-8 flex items-center justify-center rounded-md border border-indigo-200 bg-indigo-50 text-indigo-400 animate-pulse shadow-sm cursor-help"
                                title="Esperando revisión por parte del asignador"
                              >
                                {/* Icono de Reloj / Espera */}
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 -960 960 960"
                                  className="w-5 h-5 fill-current"
                                >
                                  <path d="M320-160h320v-120q0-66-47-113t-113-47q-66 0-113 47t-47 113v120Zm160-360q66 0 113-47t47-113v-120H320v120q0 66 47 113t113 47ZM160-80v-80h80v-120q0-61 28.5-114.5T348-480q-51-32-79.5-85.5T240-680v-120h-80v-80h640v80h-80v120q0 61-28.5 114.5T612-480q51 32 79.5 85.5T720-280v120h80v80H160Zm320-80Zm0-640Z" />
                                </svg>
                              </div>
                            )}

                            {/* --------------------------------------------------------- */}
                            {/* 4. FALLBACK (Guión si no hay acciones)                    */}
                            {/* --------------------------------------------------------- */}
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
          </div>

          {/* 📱 VISTA MÓVIL */}
          <TablaPendientesMobile
            tareas={pendientesOrdenados}
            user={user}
            formateaFecha={formateaFecha}
            getRowClass={getRowClass}
            getFechaFinalObj={getFechaFinalObj}
            getEstadoFecha={getEstadoFecha}
            onVerImagenes={(imagenes) => {
              setTipoGaleria("REFERENCIA");
              setModalImagenes(imagenes);
            }}
            onEntregar={handleAbrirEntrega}
            onRevisar={handleRevisar}
          />

          {/* 1. Modal de Galería (Se usa para ver imágenes generales y las de la revisión) */}
          {modalImagenes && (
            <ModalGaleria
              imagenes={modalImagenes}
              onClose={() => setModalImagenes(null)}
              tipo={tipoGaleria}
            />
          )}

          {/* 2. Modal de Entrega (Para Responsables) */}
          {tareaParaEntregar && (
            <ModalEntrega
              tarea={tareaParaEntregar}
              onClose={handleCerrarEntrega}
              onSuccess={handleExitoEntrega}
            />
          )}

          {/* 3. ✅ Modal de Revisión (Para Admin/Asignador) */}
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