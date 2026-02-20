// 📍 src/components/Pendientes/ModalPendientesHoy.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { Tarea } from "../../types/tarea";
import { tareasService } from "../../api/tareas.service";

/**
 * Interface para las propiedades del componente.
 * Mantenemos la compatibilidad total con el componente padre Pendientes.tsx
 */
interface Props {
  tareas?: Tarea[]; // Opcional, ya no se usa porque el modal hace su propia consulta global
  onClose: () => void;
  onRecargar?: () => void;
}

// Configuración ideal para visualización en monitores 1080p o proyectores (4 columnas x 3 filas)
const ITEMS_PER_PAGE = 12;

// Helper para obtener cadena YYYY-MM-DD local
const getLocalDateString = (d: Date) => {
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
};

const ModalPendientesHoy: React.FC<Props> = ({ onClose }) => {
  // --- ESTADOS LOCALES ---
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 🔹 NUEVO ESTADO: El modal maneja sus propias tareas globales para ser independiente del rol/vista
  const [tareasGlobales, setTareasGlobales] = useState<Tarea[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Referencia para el control de la pausa en la auto-paginación
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  /**
   * --- CONSULTA INDEPENDIENTE DE TAREAS ---
   * Trae TODAS las tareas del departamento, ignorando los filtros de la vista padre.
   * Esto garantiza que el proyector siempre muestre el panorama completo.
   */
  const fetchTareasIndependiente = useCallback(async () => {
    try {
      // getAll trae todas las tareas (el backend se encarga de filtrar por departamento según el token)
      const res = await tareasService.getAll({ limit: 1000 });

      const tareasConFechas = res.data.map((t: any) => ({
        ...t,
        fechaRegistro: t.fechaRegistro ? new Date(t.fechaRegistro) : null,
        fechaLimite: t.fechaLimite ? new Date(t.fechaLimite) : null,
        fechaConclusion: t.fechaConclusion ? new Date(t.fechaConclusion) : null,
        fechaEntrega: t.fechaEntrega ? new Date(t.fechaEntrega) : null,
        historialFechas: t.historialFechas?.map((h: any) => ({
          ...h,
          fechaCambio: h.fechaCambio ? new Date(h.fechaCambio) : null,
          fechaAnterior: h.fechaAnterior ? new Date(h.fechaAnterior) : null,
          nuevaFecha: h.nuevaFecha ? new Date(h.nuevaFecha) : null,
        })) || [],
      }));
      setTareasGlobales(tareasConFechas as Tarea[]);
    } catch (error) {
      console.error("❌ Error al cargar tareas globales para el proyector:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * --- LÓGICA DE FILTRADO Y ORDENAMIENTO (VENCIDAS PRIMERO) ---
   * Filtra las tareas de hoy y las ordena de modo que las que ya pasaron su hora límite
   * aparezcan al principio de la lista.
   * ✅ IMPLEMENTACIÓN REAL-TIME: Al depender de 'currentTime', las tareas cambian a rojo
   * automáticamente en el segundo exacto en que vencen.
   */
  const tareasHoy = useMemo(() => {
    const ahora = currentTime;
    const hoyStr = getLocalDateString(ahora); // String "YYYY-MM-DD" local de hoy

    // 1. Filtrar las tareas que pertenecen al día de hoy
    const filtradas = tareasGlobales.filter((t: Tarea) => {
      // Solo queremos las pendientes o en revisión
      if (t.estatus !== "PENDIENTE" && t.estatus !== "EN_REVISION") return false;

      const fechaBaseObj = t.historialFechas && t.historialFechas.length > 0
        ? new Date(t.historialFechas[t.historialFechas.length - 1].nuevaFecha!)
        : (t.fechaLimite ? new Date(t.fechaLimite) : null);

      if (!fechaBaseObj) return false;

      // Convertimos la fecha límite de la tarea a string local "YYYY-MM-DD" para comparar
      const tareaStr = getLocalDateString(fechaBaseObj);

      // Solo mostramos si la fecha límite de la tarea cae exactamente en el día de "hoy" local
      return tareaStr === hoyStr;
    });

    // 2. Clasificar, marcar vencimiento y ordenar
    return filtradas
      .map((t) => {
        const fechaLimiteObj = t.historialFechas && t.historialFechas.length > 0
          ? new Date(t.historialFechas[t.historialFechas.length - 1].nuevaFecha!)
          : new Date(t.fechaLimite!);

        /**
         * Lógica de Vencimiento Inteligente (REPARADA):
         * Solo comparamos el milisegundo exacto de la fecha límite vs el momento actual.
         * Si la tarea no tenía hora especificada, tu backend la guardó a las 23:59:59,
         * por lo que esta comparación matemática funciona perfectamente.
         */
        const estaVencida = fechaLimiteObj.getTime() < ahora.getTime();

        // Determinar visualmente si el usuario especificó una hora (para mostrar el badge)
        const h = fechaLimiteObj.getHours();
        const m = fechaLimiteObj.getMinutes();
        const s = fechaLimiteObj.getSeconds();

        // Marcadores de "Sin Hora Específica" (23:59:59 o media noche UTC si no se parseó bien antes)
        const esFinDeDia = h === 23 && m === 59;
        const esInicioDeDiaLocal = h === 0 && m === 0 && s === 0;
        const esInicioDeDiaUTC = fechaLimiteObj.getUTCHours() === 0 && fechaLimiteObj.getUTCMinutes() === 0;

        const tieneHoraEspecifica = !esFinDeDia && !esInicioDeDiaLocal && !esInicioDeDiaUTC;

        const horaFormateada = fechaLimiteObj.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        return {
          ...t,
          estaVencida,
          tieneHoraEspecifica,
          horaFormateada
        };
      })
      .sort((a, b) => {
        // Las vencidas van primero (true -> false)
        if (a.estaVencida && !b.estaVencida) return -1;
        if (!a.estaVencida && b.estaVencida) return 1;
        // Luego por ID descendente
        return b.id - a.id;
      });
  }, [tareasGlobales, currentTime]);

  const totalPages = Math.ceil(tareasHoy.length / ITEMS_PER_PAGE) || 1;

  // 2. Reloj en tiempo real para el encabezado y actualización de lógica temporal
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // 3. Auto-Actualización de la Base de Datos (cada 60 segundos)
  useEffect(() => {
    fetchTareasIndependiente();
    const fetchInterval = setInterval(() => {
      fetchTareasIndependiente();
    }, 60000);
    return () => clearInterval(fetchInterval);
  }, [fetchTareasIndependiente]);

  // 4. Auto-Paginación (cada 15 segundos para que todos vean sus tareas)
  useEffect(() => {
    if (isPaused || totalPages <= 1) return;

    const paginationInterval = setInterval(() => {
      setCurrentPage((prev) => (prev >= totalPages ? 1 : prev + 1));
    }, 15000);

    return () => clearInterval(paginationInterval);
  }, [totalPages, isPaused]);

  // Manejar interacción manual con la paginación
  const handlePageClick = (page: number) => {
    setCurrentPage(page);
    setIsPaused(true);
    // Reanudar auto-paginación después de 30 segundos de inactividad
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => setIsPaused(false), 30000);
  };

  const paginatedTareas = tareasHoy.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalActivasHoy = tareasHoy.length;

  /**
   * Determina los colores de la etiqueta según la urgencia y si la tarea está vencida.
   */
  const getColorPrioridad = (urgencia: string, estaVencida: boolean) => {
    if (estaVencida) return "bg-red-600 text-white border-red-700 shadow-sm";

    switch (urgencia) {
      case "ALTA": return "bg-red-100 text-red-800 border-red-300";
      case "MEDIA": return "bg-orange-100 text-orange-800 border-orange-300";
      case "BAJA": return "bg-green-100 text-green-800 border-green-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-gray-100 flex flex-col font-sans h-screen overflow-hidden animate-fade-in">

      {/* HEADER (Barra Superior + Mini Resumen) */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <span className="text-blue-600 animate-pulse">●</span> TAREAS DEL DÍA
          </h1>
          <div className="text-sm md:text-lg text-gray-500 font-semibold border-l-2 pl-3 border-gray-300">
            {currentTime.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })} {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 text-center shadow-sm flex items-center gap-2">
            <p className="text-xs text-blue-700 uppercase font-bold tracking-wider hidden sm:block">Total Pendientes:</p>
            <p className="text-lg font-black text-blue-900 leading-none">
              {isLoading ? "..." : totalActivasHoy}
            </p>
          </div>
          <button
            onClick={onClose}
            className="hidden md:flex bg-red-100 text-red-700 p-1.5 rounded-full hover:bg-red-200 transition-all cursor-pointer"
            title="Cerrar proyector"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* BODY (Cuadrícula de Tareas adaptativa) */}
      <div className="flex-1 overflow-hidden p-3 lg:p-4 bg-gray-50">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 animate-spin text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-500 text-center uppercase tracking-widest">Sincronizando con el servidor...</h2>
          </div>
        ) : tareasHoy.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-24 h-24 mb-4 opacity-50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-500">Sin tareas pendientes</h2>
            <p className="text-lg mt-2 text-gray-400 font-medium">Todo está al día por el momento.</p>
          </div>
        ) : (
          /* Grid Mágico: Ordenado con vencidas al principio */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-[minmax(0,1fr)] lg:grid-rows-4 xl:grid-rows-3 gap-3 md:gap-4 h-full">
            {paginatedTareas.map((tarea: any) => (
              <div
                key={tarea.id}
                className={`bg-white rounded-xl shadow-md border p-3 md:p-4 flex flex-col min-h-0 relative overflow-hidden transition-all duration-500 ${tarea.estaVencida
                  ? "border-red-500 ring-2 ring-red-100 bg-red-50/30 shadow-red-200"
                  : (tarea.estatus === "EN_REVISION" ? "border-indigo-400 ring-2 ring-indigo-100" : "border-gray-200")
                  }`}
              >
                {/* Header Card: Etiqueta de Urgencia / Vencimiento */}
                <div className="flex justify-between items-start mb-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] md:text-xs font-black uppercase tracking-widest border ${getColorPrioridad(tarea.urgencia, tarea.estaVencida)}`}>
                    {tarea.estaVencida ? "VENCIDA" : tarea.urgencia}
                  </span>

                  {/* ✅ HORA REMARCADA si es específica */}
                  {tarea.tieneHoraEspecifica && (
                    <span className={`px-2 py-0.5 rounded-md text-[10px] md:text-xs font-black border-2 ${tarea.estaVencida ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                      {tarea.horaFormateada}
                    </span>
                  )}

                  {tarea.estatus === "EN_REVISION" && !tarea.estaVencida && (
                    <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md text-[10px] md:text-xs font-bold uppercase border border-indigo-300 animate-pulse">
                      REVISIÓN
                    </span>
                  )}
                </div>

                {/* Contenido: Tarea y Observaciones */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <h3 className={`text-sm md:text-base xl:text-lg font-bold leading-tight line-clamp-2 shrink-0 ${tarea.estaVencida ? 'text-red-700 font-black' : 'text-gray-900'}`}>
                    {tarea.tarea}
                  </h3>

                  {/* INSTRUCCIONES (Observaciones) */}
                  {tarea.observaciones ? (
                    <div className="mt-1 flex-1 min-h-0 overflow-hidden">
                      <p className={`text-xs md:text-sm font-medium leading-snug line-clamp-3 lg:line-clamp-4 ${tarea.estaVencida ? 'text-red-600/80' : 'text-gray-600'}`}>
                        <span className={`font-bold ${tarea.estaVencida ? 'text-red-700' : 'text-gray-700'}`}>Instrucciones:</span> {tarea.observaciones}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-1 flex-1 min-h-0 opacity-10">
                      <span className="text-xs uppercase font-bold italic">Sin instrucciones</span>
                    </div>
                  )}
                </div>

                {/* Footer Card: Responsables */}
                <div className={`mt-auto pt-2 border-t shrink-0 ${tarea.estaVencida ? 'border-red-200' : 'border-gray-100'}`}>
                  <div className="flex flex-wrap gap-1.5 overflow-hidden">
                    {tarea.responsables?.map((resp: any) => (
                      <span key={resp.id} className={`${tarea.estaVencida ? 'bg-red-100 text-red-700 border-red-200' : 'bg-blue-50 text-blue-800 border-blue-200'} px-1.5 py-0.5 rounded border text-[10px] md:text-xs font-bold whitespace-nowrap truncate max-w-full`}>
                        {resp.nombre}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER (Paginación) */}
      {totalPages > 1 && (
        <div className="bg-white border-t border-gray-200 py-3 flex justify-center items-center gap-2 shrink-0 shadow-inner">
          {Array.from({ length: totalPages }).map((_, index) => {
            const pageNum = index + 1;
            const isActive = currentPage === pageNum;
            return (
              <button
                key={pageNum}
                onClick={() => handlePageClick(pageNum)}
                className={`h-3 rounded-full transition-all duration-300 ${isActive ? "w-10 bg-blue-600" : "w-3 bg-gray-300 hover:bg-gray-400 cursor-pointer"}`}
                aria-label={`Página ${pageNum}`}
              />
            );
          })}
        </div>
      )}

      {/* Botón Flotante para cerrar en dispositivos táctiles/móvil */}
      <button
        onClick={onClose}
        className="md:hidden fixed bottom-6 right-6 bg-red-600 text-white p-3 rounded-full shadow-2xl z-[110] cursor-pointer active:scale-90 transition-transform"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

    </div>
  );
};

export default ModalPendientesHoy;