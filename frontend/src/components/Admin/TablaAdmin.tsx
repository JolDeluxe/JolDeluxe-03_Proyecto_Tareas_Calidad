// 📍 src/components/Admin/TablaAdmin.tsx

import React, { useState, useMemo } from "react";
// 1. 🚀 Importar servicios y tipos
import { tareasService } from "../../api/tareas.service";
import type {
  Tarea,
  HistorialFecha,
  Estatus,
  ImagenTarea,
} from "../../types/tarea";
import type { Usuario } from "../../types/usuario"; // 👈 Importar Usuario
import { Rol } from "../../types/usuario"; // 👈 Importar Rol
import ModalGaleria from "../Principal/ModalGaleria";
import Acciones from "./Acciones";
import ModalEditar from "./ModalEditar";
import ModalEliminar from "./ModalEliminar";
import ModalAceptar from "./ModalAceptar";
// ✅ NUEVO: Importamos el Modal de Revisión
import ModalRevision from "./ModalRevision";
import { toast } from "react-toastify";

interface TablaProps {
  filtro: string;
  responsable: string; // Sigue siendo string (ID o "Todos")
  query: string;
  tareas: Tarea[];
  loading: boolean;
  onRecargarTareas: () => void;
  user: Usuario | null; // 👈 2. Recibir 'user' como prop
}

// ✅ TIPOS PARA EL ORDENAMIENTO
type SortKey = "asignador" | "responsables" | "urgencia" | "fechaRegistro" | "fechaLimite" | "estatus";

interface SortConfig {
  key: SortKey;
  direction: "asc" | "desc";
}

// --- FUNCIONES HELPER PARA FECHAS Y HORAS ---

/**
 * Convierte una fecha a formato HH:MM AM/PM
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
 * 🛠️ Componente Helper para Renderizar Fecha Límite con Iconos (EXISTENTE)
 */
const RenderFechaLimite = ({ fecha, vencida }: { fecha?: Date | string | null, vencida: boolean }) => {
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
  const textClass = vencida ? "text-red-600" : "text-gray-700";
  const iconClass = vencida ? "text-red-600" : "text-gray-500";

  return (
    <div className={`flex flex-col items-center justify-center leading-tight ${vencida ? "font-bold" : ""}`}>
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
      {/* Fila: Etiqueta ATRASADA */}
      {vencida && (
        <span className="text-[10px] font-extrabold text-red-600 tracking-wide mt-1">
          ATRASADA
        </span>
      )}
    </div>
  );
};

/**
 * 🆕 RenderFechaEntrega: Renderiza Fecha Entrega o Conclusión con Iconos
 */
const RenderFechaEntrega = ({ fecha, estatus, entregadaTarde }: { fecha?: Date | string | null, estatus: string, entregadaTarde?: boolean }) => {
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

  // Clases según Estatus y Retraso
  // Si está entregada tarde, gana el color naranja
  const isEnRevision = estatus === "EN_REVISION";

  const textClass = entregadaTarde ? "text-orange-700" : isEnRevision ? "text-indigo-700" : "text-gray-700";
  const iconClass = entregadaTarde ? "text-orange-600" : isEnRevision ? "text-indigo-500" : "text-gray-500";

  return (
    <div className="flex flex-col items-center justify-center leading-tight">
      {/* Fila: Fecha con Calendario */}
      <div className={`flex items-center gap-1.5 ${textClass}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className={`w-4 h-4 ${iconClass}`} fill="currentColor">
          <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-188.5-11.5Q280-423 280-440t11.5-28.5Q303-480 320-480t28.5 11.5Q360-457 360-440t-11.5 28.5Q337-400 320-400t-28.5-11.5ZM640-400q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-188.5-11.5Q280-263 280-280t11.5-28.5Q303-320 320-320t28.5 11.5Q360-297 360-280t-11.5 28.5Q337-240 320-240t-28.5-11.5ZM640-240q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z" />
        </svg>
        <span className="font-semibold">{fechaStr}</span>
      </div>

      {/* Fila: Hora con Reloj */}
      {horaStr && (
        <div className={`flex items-center gap-1.5 mt-0.5 text-xs opacity-90 ${textClass}`}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" className={`w-3.5 h-3.5 ${iconClass}`} fill="currentColor">
            <path d="M582-298 440-440v-200h80v167l118 118-56 57ZM440-720v-80h80v80h-80Zm280 280v-80h80v80h-80ZM440-160v-80h80v80h-80ZM160-440v-80h80v80h-80ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" />
          </svg>
          <span>{horaStr}</span>
        </div>
      )}

      {/* ✅ NUEVO: Etiqueta Entregada con Retraso (Letra chica) */}
      {entregadaTarde && (
        <span className="text-[9px] font-extrabold text-orange-600 tracking-wide mt-1 uppercase text-center leading-none">
          ENTREGADA CON RETRASO
        </span>
      )}
    </div>
  );
}

// 🛠️ Helper de visualización simple para celdas donde no aplica el diseño complejo (ej. fecha simple)
const formateaFechaSimpleRender = (fechaInput?: Date | string | null) => {
  if (!fechaInput) return <span className="text-gray-400">—</span>;
  const dateObj = typeof fechaInput === "string" ? new Date(fechaInput) : fechaInput;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) return <span className="text-gray-400">—</span>;

  const d = String(dateObj.getDate()).padStart(2, "0");
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const y = dateObj.getFullYear();
  const fechaStr = `${d}/${m}/${y}`;

  // Verificar hora
  const h = dateObj.getHours();
  const min = dateObj.getMinutes();
  const sec = dateObj.getSeconds();

  if (h === 23 && min === 59 && sec >= 58) {
    return <span>{fechaStr}</span>;
  }

  const horaStr = formatTimeAMPM(dateObj);
  return (
    <div className="flex flex-col items-center leading-tight">
      <span>{fechaStr}</span>
      <span className="text-[11px] font-normal opacity-80">{horaStr}</span>
    </div>
  );
}

// Formateador simple para strings (usado en móvil o celdas simples)
const formateaFechaString = (fechaInput?: Date | string | null): string => {
  if (!fechaInput) return "";
  try {
    const dateObj = typeof fechaInput === "string" ? new Date(fechaInput) : fechaInput;
    if (isNaN(dateObj.getTime())) return "";

    const d = String(dateObj.getDate()).padStart(2, "0");
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const y = dateObj.getFullYear();
    const fechaStr = `${d}/${m}/${y}`;

    const h = dateObj.getHours();
    const min = dateObj.getMinutes();
    const sec = dateObj.getSeconds();

    // Si es fin del día, solo fecha
    if (h === 23 && min === 59 && sec >= 58) return fechaStr;

    return `${fechaStr} ${formatTimeAMPM(dateObj)}`;
  } catch {
    return "";
  }
};

// Formateador SOLO FECHA (para registro)
const formateaSoloFecha = (fechaInput?: Date | string | null): string => {
  if (!fechaInput) return "";
  try {
    const fecha = new Date(fechaInput);
    if (isNaN(fecha.getTime())) return "";
    const d = String(fecha.getDate()).padStart(2, "0");
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const y = fecha.getFullYear();
    return `${d}/${m}/${y}`;
  } catch {
    return "";
  }
};

// 🎨 Colores por estatus (sin cambios)
const getRowClass = (status: Estatus): string => {
  switch (status) {
    case "CONCLUIDA":
      return "bg-green-50 border-l-4 border-green-500";
    case "CANCELADA":
      return "bg-red-50 border-l-4 border-red-500";
    case "EN_REVISION":
      return "bg-indigo-50 border-l-4 border-indigo-500";
    default:
      return "bg-blue-50 border-l-4 border-blue-500";
  }
};

// 4. 🛠️ Utilidad de retraso robusta (maneja string o Date)
const isRetrasada = (
  limiteInput?: Date | string | null,
  conclusionInput?: Date | string | null
): boolean => {
  if (!limiteInput || !conclusionInput) return false;
  try {
    const limite = new Date(limiteInput);
    const conclusion = new Date(conclusionInput);
    // Verificar si ambas fechas son válidas
    if (isNaN(limite.getTime()) || isNaN(conclusion.getTime())) return false;

    // Comparar timestamps para mayor precisión con hora
    return conclusion.getTime() > limite.getTime();
  } catch {
    return false;
  }
};

// Helper para obtener fecha efectiva (considerando historial) para ordenamiento
const getFechaLimiteEfectiva = (tarea: Tarea): number => {
  if (tarea.historialFechas && tarea.historialFechas.length > 0) {
    const last = tarea.historialFechas[tarea.historialFechas.length - 1];
    return last.nuevaFecha ? new Date(last.nuevaFecha).getTime() : 0;
  }
  return tarea.fechaLimite ? new Date(tarea.fechaLimite).getTime() : 0;
};

const TablaAdmin: React.FC<TablaProps> = ({
  filtro,
  responsable,
  query,
  tareas,
  loading,
  onRecargarTareas,
  user,
}) => {
  // (Estados de modales se quedan)
  const [openModalEditar, setOpenModalEditar] = useState(false);
  const [openModalEliminar, setOpenModalEliminar] = useState(false);
  const [openModalAceptar, setOpenModalAceptar] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<Tarea | null>(
    null
  );
  const [modalImagenes, setModalImagenes] = useState<ImagenTarea[] | null>(
    null
  );

  // ✅ NUEVO: Estado para el modal de revisión
  const [tareaParaRevisar, setTareaParaRevisar] = useState<Tarea | null>(null);

  // ✅ NUEVO: Estado de Ordenamiento (Default: Registro Descendente)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "fechaRegistro", direction: "desc" });

  // 🧩 Modales (Funciones se quedan)
  const abrirModalAceptar = (tarea: Tarea) => {
    setTareaSeleccionada(tarea);
    setOpenModalAceptar(true);
  };

  const abrirModalEditar = (tarea: Tarea) => {
    setTareaSeleccionada(tarea);
    setOpenModalEditar(true);
  };

  const abrirModalEliminar = (tarea: Tarea) => {
    setTareaSeleccionada(tarea);
    setOpenModalEliminar(true);
  };

  // 7. 🚀 Acción de confirmar CON SERVICIO
  const confirmarFinalizacion = async () => {
    if (!tareaSeleccionada) return;

    try {
      await tareasService.complete(tareaSeleccionada.id);
      onRecargarTareas();
      setOpenModalAceptar(false);
      setTareaSeleccionada(null);
      toast.success("¡Tarea completada con éxito!");
    } catch (error) {
      console.error("Error al finalizar la tarea:", error);
      toast.error("Error al actualizar la tarea. Intenta de nuevo.");
    }
  };

  // 8. 🚀 Acción de eliminar CON SERVICIO
  const confirmarEliminacion = async () => {
    if (!tareaSeleccionada) return;
    try {
      // 🚀 ¡Llamada al nuevo servicio!
      await tareasService.cancel(tareaSeleccionada.id);

      onRecargarTareas();
      setOpenModalEliminar(false);
      setTareaSeleccionada(null);
      toast.success("Tarea cancelada correctamente.");
    } catch (error) {
      console.error("Error al cancelar la tarea:", error);
      toast.error("Error al cancelar la tarea. Intenta de nuevo.");
    }
  };

  // ✅ NUEVO: Handlers para Revisión
  const handleRevisar = (tarea: Tarea) => {
    setTareaParaRevisar(tarea);
  };

  const handleCerrarRevision = () => {
    setTareaParaRevisar(null);
  };

  const handleExitoRevision = () => {
    setTareaParaRevisar(null);
    onRecargarTareas();
  };

  // ✅ LÓGICA DE ORDENAMIENTO (Handler)
  const handleSort = (key: SortKey) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Helper para mostrar ícono de ordenamiento
  const getSortIcon = (columnKey: SortKey) => {
    if (sortConfig.key !== columnKey) return <span className="text-gray-300 text-[10px] ml-1">⇅</span>;
    return sortConfig.direction === "asc" ? <span className="text-blue-600 ml-1">↑</span> : <span className="text-blue-600 ml-1">↓</span>;
  };

  // 9. 🚀 Lógica de filtro Y ORDENAMIENTO (UseMemo)
  const tareasOrdenadas = useMemo(() => {
    // 1. Filtrado
    const filtradas = tareas.filter((t) => {
      const estatus = t.estatus;

      const pasaEstatus =
        // 🔥 CAMBIO CLAVE: Si es TOTAL, solo mostramos PENDIENTE y EN_REVISION
        (filtro.toUpperCase() === "TOTAL" && (estatus === "PENDIENTE" || estatus === "EN_REVISION")) ||
        // Filtros individuales
        (filtro.toUpperCase() === "PENDIENTES" && estatus === "PENDIENTE") ||
        (filtro.toUpperCase() === "EN_REVISION" && estatus === "EN_REVISION") ||
        (filtro.toUpperCase() === "CONCLUIDAS" && estatus === "CONCLUIDA");

      const pasaResponsable =
        responsable === "Todos" ||
        t.responsables.some((r) => r.id.toString() === responsable);

      const texto = `${t.tarea} ${t.observaciones || ""}`.toLowerCase();
      const pasaBusqueda =
        query.trim() === "" || texto.includes(query.toLowerCase());

      return pasaEstatus && pasaResponsable && pasaBusqueda;
    });

    // 2. Ordenamiento
    if (sortConfig) {
      filtradas.sort((a, b) => {
        let valA: any = "";
        let valB: any = "";

        switch (sortConfig.key) {
          case "asignador":
            valA = (a.asignador?.nombre || "").toLowerCase();
            valB = (b.asignador?.nombre || "").toLowerCase();
            break;
          case "responsables":
            // Ordenamos por el string unido de nombres
            valA = a.responsables.map(r => r.nombre).join("").toLowerCase();
            valB = b.responsables.map(r => r.nombre).join("").toLowerCase();
            break;
          case "urgencia":
            // Pesos: ALTA(3) > MEDIA(2) > BAJA(1)
            const weights = { ALTA: 3, MEDIA: 2, BAJA: 1 };
            valA = weights[a.urgencia] || 0;
            valB = weights[b.urgencia] || 0;
            // Para números, retornamos directamente la diferencia
            return sortConfig.direction === "asc" ? valA - valB : valB - valA;
          case "fechaRegistro":
            valA = a.fechaRegistro ? new Date(a.fechaRegistro).getTime() : 0;
            valB = b.fechaRegistro ? new Date(b.fechaRegistro).getTime() : 0;
            return sortConfig.direction === "asc" ? valA - valB : valB - valA;
          case "fechaLimite":
            valA = getFechaLimiteEfectiva(a);
            valB = getFechaLimiteEfectiva(b);
            return sortConfig.direction === "asc" ? valA - valB : valB - valA;
          case "estatus":
            valA = a.estatus;
            valB = b.estatus;
            break;
          default:
            return 0;
        }

        // Comparación por defecto para strings
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtradas;
  }, [tareas, filtro, responsable, query, sortConfig]);

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
      {tareasOrdenadas.length > 0 ? (
        <>
          {/* 💻 VISTA ESCRITORIO */}
          <div className="hidden lg:block max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-auto rounded-lg border border-gray-300">
            <table className="w-full text-sm font-sans">
              <thead className="bg-gray-100 text-black text-xs uppercase sticky top-0 z-20 shadow-inner">
                <tr>
                  {/* TAREA - SIN FILTRO */}
                  <th className="px-3 py-3 text-left font-bold border-b border-gray-300 w-[10%] break-words">
                    Tarea
                  </th>
                  {/* IMG - SIN FILTRO */}
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[4%]">
                    Img
                  </th>
                  {/* OBSERVACIONES - SIN FILTRO */}
                  <th className="px-3 py-3 text-left font-bold border-b border-gray-300 w-[20%] break-words">
                    Observaciones
                  </th>
                  {/* ASIGNADO POR - CON FILTRO */}
                  <th
                    className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[7%] cursor-pointer hover:bg-gray-200 transition select-none"
                    onClick={() => handleSort("asignador")}
                  >
                    Asignado por {getSortIcon("asignador")}
                  </th>
                  {/* RESPONSABLE(S) - CON FILTRO */}
                  <th
                    className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[13%] cursor-pointer hover:bg-gray-200 transition select-none"
                    onClick={() => handleSort("responsables")}
                  >
                    Responsable(s) {getSortIcon("responsables")}
                  </th>
                  {/* PRIORIDAD - CON FILTRO */}
                  <th
                    className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[6%] cursor-pointer hover:bg-gray-200 transition select-none"
                    onClick={() => handleSort("urgencia")}
                  >
                    Prioridad {getSortIcon("urgencia")}
                  </th>
                  {/* REGISTRO - CON FILTRO */}
                  <th
                    className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[6%] cursor-pointer hover:bg-gray-200 transition select-none"
                    onClick={() => handleSort("fechaRegistro")}
                  >
                    Registro {getSortIcon("fechaRegistro")}
                  </th>
                  {/* FECHA LIMITE / HISTORIAL - CON FILTRO */}
                  <th
                    className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[10%] cursor-pointer hover:bg-gray-200 transition select-none"
                    onClick={() => handleSort("fechaLimite")}
                  >
                    Fecha límite / Historial {getSortIcon("fechaLimite")}
                  </th>
                  {/* ENTREGA / CONCLUSION - CAMBIO DE TÍTULO */}
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[7%]">
                    Entrega / Conclusión
                  </th>
                  {/* ESTATUS - CON FILTRO */}
                  <th
                    className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[7%] cursor-pointer hover:bg-gray-200 transition select-none"
                    onClick={() => handleSort("estatus")}
                  >
                    Estatus {getSortIcon("estatus")}
                  </th>
                  {/* ACCIONES - SIN FILTRO */}
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[7%]">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {tareasOrdenadas.map((row: Tarea) => {
                  const hoy = new Date();

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

                  let vencida = false;
                  if (fechaLimiteObj) {
                    // Comprobación de vencimiento
                    vencida = fechaLimiteObj.getTime() < hoy.getTime() && row.estatus === "PENDIENTE";
                  }

                  const retrasada = isRetrasada(
                    row.fechaLimite,
                    row.fechaConclusion
                  );

                  // 💡 LÓGICA FECHA A MOSTRAR (Entrega o Conclusión)
                  let fechaParaColumna: Date | string | null = null;
                  if (row.estatus === "EN_REVISION") {
                    fechaParaColumna = row.fechaEntrega || null;
                  } else if (row.estatus === "CONCLUIDA") {
                    fechaParaColumna = row.fechaConclusion || null;
                  }

                  // 🚀 LÓGICA NUEVA: ENTREGADA CON RETRASO
                  // Si está EN_REVISION, verificamos si la fecha de entrega > fecha límite efectiva
                  let entregadaTarde = false;
                  if (row.estatus === "EN_REVISION" && row.fechaEntrega && fechaLimiteObj) {
                    const dEntrega = new Date(row.fechaEntrega).getTime();
                    const dLimite = new Date(fechaLimiteObj).getTime();
                    entregadaTarde = dEntrega > dLimite;
                  }

                  return (
                    <tr
                      key={row.id}
                      className={`${getRowClass(row.estatus)} transition`}
                    >

                      {/* Columna Tarea */}
                      <td className="px-3 py-3 text-left font-semibold w-[18%] break-words">
                        {row.tarea}
                        {row.estatus === "EN_REVISION" && (
                          <span className="block text-[10px] text-indigo-700 font-bold bg-indigo-100 w-fit px-1 rounded mt-1">
                            EN REVISIÓN
                          </span>
                        )}
                        {/* Feedback Rechazo */}
                        {row.estatus === "PENDIENTE" && row.feedbackRevision && (
                          <span className="block text-[10px] text-red-700 font-bold bg-red-100 w-fit px-1 rounded mt-1 border border-red-200">
                            ⚠️ Corrección req.
                          </span>
                        )}
                      </td>

                      {/* 🚀 Columna IMAGEN */}
                      <td className="px-3 py-3 text-center w-[4%]">
                        {row.imagenes && row.imagenes.length > 0 ? (
                          <button
                            onClick={() => setModalImagenes(row.imagenes)}
                            title={`Ver ${row.imagenes.length} imagen(es)`}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full
                                      bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white
                                      transition-colors duration-200 shadow-sm cursor-pointer"
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
                      <td className="px-3 py-3 text-left text-gray-700 italic w-[12%] break-words">
                        {row.observaciones || ""}
                      </td>

                      {/* Columna Asignado por */}
                      <td className="px-3 py-3 text-center text-amber-800 font-semibold w-[7%]">
                        {row.asignador.nombre}
                      </td>

                      {/* Columna Responsable(s) */}
                      <td className="px-3 py-3 text-center text-blue-700 font-semibold w-[13%] align-top break-words">
                        <ul className="text-xs list-none p-0 m-0 space-y-0.5 break-words">
                          {row.responsables.map((r, i) => (
                            // Aplicamos break-words en el li también por seguridad
                            <li key={i} className="leading-tight break-words">
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

                      {/* Columna Registro (Solo Fecha) */}
                      <td className="px-3 py-3 text-center w-[6%]">
                        {formateaSoloFecha(row.fechaRegistro)}
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
                          <div
                            className={`font-semibold ${vencida
                              ? "text-red-600 font-bold"
                              : "text-gray-800"
                              }`}
                          >
                            {/* 🚀 AQUI USAMOS EL NUEVO RENDERIZADOR */}
                            <RenderFechaLimite fecha={fechaLimiteObj} vencida={vencida} />
                          </div>

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
                                  Historial ({row.historialFechas.length})
                                </summary>

                                <div className="mt-2 text-gray-700 bg-white/80 rounded-md p-2 border border-gray-200 text-left relative z-50 shadow-md">
                                  <ul className="space-y-2">
                                    {row.historialFechas.map(
                                      (h: any, i: number) => (
                                        <li
                                          key={i}
                                          className="border-b border-gray-100 pb-1 last:border-none"
                                        >
                                          <div className="text-[10px]">
                                            <span className="font-bold">Nueva:</span> {formateaFechaSimpleRender(h.nuevaFecha)}
                                          </div>
                                          <div className="text-[10px] text-gray-500">
                                            Por: {h.modificadoPor.nombre}
                                          </div>
                                          {h.motivo && (
                                            <div className="text-[10px] italic text-gray-500">
                                              "{h.motivo}"
                                            </div>
                                          )}
                                        </li>
                                      )
                                    )}
                                  </ul>
                                </div>
                              </details>
                            )}
                        </div>
                      </td>
                      {/* === FIN Celda Historial === */}

                      {/* 🚀 Columna Entrega / Conclusión - MODIFICADA */}
                      <td
                        className={`px-3 py-3 text-center w-[7%] ${retrasada ? "text-red-600 font-bold" : "text-gray-800"
                          }`}
                      >
                        {/* Usamos el NUEVO componente RenderFechaEntrega */}
                        <RenderFechaEntrega
                          fecha={fechaParaColumna}
                          estatus={row.estatus}
                          entregadaTarde={entregadaTarde}
                        />
                      </td>

                      {/* Columna Estatus */}
                      <td className="px-4 py-4 text-center w-[7%]">
                        <span
                          className={`px-3 py-1 text-md font-bold ${row.estatus === "CONCLUIDA"
                            ? "text-green-700"
                            : row.estatus === "CANCELADA"
                              ? "text-red-700"
                              : row.estatus === "EN_REVISION"
                                ? "text-indigo-700"
                                : "text-blue-700"
                            }`}
                        >
                          {row.estatus === "EN_REVISION" ? "EN REVISIÓN" : row.estatus}
                        </span>
                      </td>

                      {/* Columna Acciones */}
                      <td className="px-3 py-3 text-center font-bold border-b border-gray-300 w-[7%]">
                        {user && (
                          <Acciones
                            tarea={row}
                            user={user}
                            onCompletar={() => abrirModalAceptar(row)}
                            onEditar={() => abrirModalEditar(row)}
                            onBorrar={() => abrirModalEliminar(row)}
                            // ✅ NUEVO: Pasamos la función de revisar
                            onRevisar={() => handleRevisar(row)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 📱 VISTA MÓVIL */}
          <div className="grid lg:hidden grid-cols-1 md:grid-cols-2 gap-3 p-2 items-start">
            {tareasOrdenadas.map((row: Tarea) => {
              // Lógica de fechas
              const hoy = new Date();
              hoy.setHours(0, 0, 0, 0);

              const fechaLimiteObj =
                row.historialFechas && row.historialFechas.length > 0
                  ? row.historialFechas[row.historialFechas.length - 1].nuevaFecha
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
                // Comprobación de vencimiento con hora real
                vencida =
                  fechaLimiteDate.getTime() < new Date().getTime() &&
                  row.estatus !== "CONCLUIDA" &&
                  row.estatus !== "EN_REVISION";
              }

              const retrasada = isRetrasada(
                row.fechaLimite,
                row.fechaConclusion
              );

              // Permisos para móvil
              const puedeValidar =
                user &&
                (user.rol === Rol.SUPER_ADMIN ||
                  user.rol === Rol.ADMIN ||
                  (user.rol === Rol.ENCARGADO && row.asignadorId === user.id));

              const puedeCancelar =
                user &&
                (user.rol === Rol.SUPER_ADMIN ||
                  user.rol === Rol.ADMIN ||
                  (user.rol === Rol.ENCARGADO && row.asignadorId === user.id));

              const asignadorEsAdmin =
                row.asignador?.rol === Rol.ADMIN ||
                row.asignador?.rol === Rol.SUPER_ADMIN;

              const puedeEditar =
                user &&
                (user.rol === Rol.SUPER_ADMIN ||
                  user.rol === Rol.ADMIN ||
                  (user.rol === Rol.ENCARGADO && !asignadorEsAdmin));

              // 💡 LÓGICA FECHA A MOSTRAR (Móvil)
              let fechaParaColumna: Date | string | null = null;
              let labelColumna = "Conclusión";

              if (row.estatus === "EN_REVISION") {
                fechaParaColumna = row.fechaEntrega || null;
                labelColumna = "Entrega";
              } else if (row.estatus === "CONCLUIDA") {
                fechaParaColumna = row.fechaConclusion || null;
              }

              // 🚀 LÓGICA NUEVA: ENTREGADA CON RETRASO
              let entregadaTarde = false;
              if (row.estatus === "EN_REVISION" && row.fechaEntrega && fechaLimiteObj) {
                const dEntrega = new Date(row.fechaEntrega).getTime();
                const dLimite = new Date(fechaLimiteObj).getTime();
                entregadaTarde = dEntrega > dLimite;
              }

              return (
                <div
                  key={row.id}
                  className={`border border-gray-300 shadow-sm p-4 ${getRowClass(
                    row.estatus
                  )} rounded-md`}
                >
                  {/* CABECERA: Título y Prioridad */}
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800 text-base leading-snug w-[75%] break-words">
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
                      {row.urgencia === "ALTA"
                        ? "Alta"
                        : row.urgencia === "MEDIA"
                          ? "Media"
                          : "Baja"}
                    </span>
                  </div>

                  {/* OBSERVACIONES (Nuevo) */}
                  {row.observaciones && (
                    <div className="mb-3 bg-white/50 p-2 rounded border border-gray-200 text-xs italic text-gray-700 break-words">
                      <span className="font-bold not-italic">Obs: </span>
                      {row.observaciones}
                    </div>
                  )}

                  {/* DATOS GENERALES */}
                  <div className="text-xs text-gray-600 space-y-2">
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
                      <span className="text-blue-700 font-semibold break-words">
                        {row.responsables.map((r) => r.nombre).join(", ")}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">
                        Registro:
                      </span>{" "}
                      {formateaSoloFecha(row.fechaRegistro)}
                    </p>

                    {/* FECHA LÍMITE (Con Iconos y Color Rojo) */}
                    <div className="flex items-start">
                      <span className="font-semibold text-gray-700 mt-1 mr-2">
                        Límite:
                      </span>
                      <div className="bg-white/60 rounded px-2 py-1 border border-gray-100 shadow-sm">
                        <RenderFechaLimite
                          fecha={fechaLimiteObj}
                          vencida={vencida}
                        />
                      </div>
                    </div>

                    <p>
                      <span className="font-semibold text-gray-700">
                        Estatus:
                      </span>{" "}
                      <span
                        className={`text-xs font-bold ${row.estatus === "CONCLUIDA"
                          ? "text-green-700"
                          : row.estatus === "CANCELADA"
                            ? "text-red-700"
                            : row.estatus === "EN_REVISION"
                              ? "text-indigo-700"
                              : "text-blue-700"
                          }`}
                      >
                        {row.estatus === "EN_REVISION"
                          ? "EN REVISIÓN"
                          : row.estatus}
                      </span>
                    </p>
                  </div>

                  {/* CONCLUSIÓN / ENTREGA (Móvil) */}
                  {fechaParaColumna && (
                    <div className={`mt-2 text-xs flex items-center ${retrasada ? "text-red-600 font-semibold" : "text-gray-700"}`}>
                      <span className="font-semibold text-gray-700 mr-2">
                        {labelColumna}:
                      </span>
                      {/* Reutilizamos el RenderFechaEntrega aunque sea un poco grande para móvil, se adapta bien por flex */}
                      <RenderFechaEntrega
                        fecha={fechaParaColumna}
                        estatus={row.estatus}
                        entregadaTarde={entregadaTarde}
                      />
                      {retrasada && labelColumna === "Conclusión" && (
                        <span className="ml-1 inline-flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-red-500">
                            <path fillRule="evenodd" d="M12 2.25a9.75 9.75 0 1 1 0 19.5 9.75 9.75 0 0 1 0-19.5Zm0 1.5a8.25 8.25 0 1 0 0 16.5 8.25 8.25 0 0 0 0-16.5Zm.75 4.5a.75.75 0 0 0-1.5 0v4.5c0 .414.336.75.75.75h3.75a.75.75 0 0 0 0-1.5h-3V8.25Z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                  )}

                  {/* HISTORIAL (Nuevo Diseño) */}
                  {row.historialFechas && row.historialFechas.length > 0 && (
                    <details className="mt-3 text-xs transition-all duration-300 open:pb-2">
                      <summary className="cursor-pointer select-none font-semibold text-blue-600 hover:underline flex items-center gap-1">
                        {/* SVG Historial */}
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
                          {row.historialFechas.map(
                            (h: HistorialFecha, i: number) => (
                              <li
                                key={i}
                                className="border-b border-gray-100 pb-1 last:border-none"
                              >
                                <p>
                                  <span className="font-semibold text-gray-800">
                                    Modificación:
                                  </span>{" "}
                                  {formateaFechaString(h.fechaCambio)}
                                </p>
                                <p>
                                  <span className="font-semibold text-gray-800">
                                    Anterior:
                                  </span>{" "}
                                  {formateaFechaString(h.fechaAnterior)} →{" "}
                                  <span className="font-semibold text-gray-800">
                                    Nueva:
                                  </span>{" "}
                                  {formateaFechaString(h.nuevaFecha)}
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
                            )
                          )}
                        </ul>
                      </div>
                    </details>
                  )}

                  {/* IMÁGENES */}
                  {row.imagenes && row.imagenes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-center">
                      <button
                        onClick={() => setModalImagenes(row.imagenes)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
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

                  {/* BOTONES DE ACCIÓN */}
                  <div className="flex justify-around items-center mt-4 pt-2 border-t border-gray-200 h-[46px]">
                    {/* CANCELAR */}
                    {puedeCancelar && (
                      <button
                        onClick={() => abrirModalEliminar(row)}
                        className="flex flex-col items-center text-red-700 hover:text-red-800 transition cursor-pointer"
                        title="Cancelar tarea"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 -960 960 960"
                          className="w-6 h-6 text-red-700"
                          fill="currentColor"
                        >
                          <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                        </svg>
                        <span className="text-[11px] font-semibold">
                          Cancelar
                        </span>
                      </button>
                    )}

                    {/* EDITAR */}
                    {puedeEditar && (
                      <button
                        onClick={() => abrirModalEditar(row)}
                        className="flex flex-col items-center text-amber-700 hover:text-amber-800 transition cursor-pointer"
                        title="Editar tarea"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 -960 960 960"
                          className="w-6 h-6 text-amber-700"
                          fill="currentColor"
                        >
                          <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                        </svg>
                        <span className="text-[11px] font-semibold">
                          Editar
                        </span>
                      </button>
                    )}

                    {/* VALIDAR */}
                    {row.estatus === "PENDIENTE" && puedeValidar && (
                      <button
                        onClick={() => abrirModalAceptar(row)}
                        className="flex flex-col items-center text-green-700 hover:text-green-800 transition cursor-pointer"
                        title="Marcar como completada"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 -960 960 960"
                          className="w-6 h-6 text-green-700"
                          fill="currentColor"
                        >
                          <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Z" />
                        </svg>
                        <span className="text-[11px] font-semibold">
                          Validar
                        </span>
                      </button>
                    )}

                    {/* REVISAR */}
                    {row.estatus === "EN_REVISION" && puedeValidar ? (
                      <button
                        onClick={() => handleRevisar(row)}
                        className="flex flex-col items-center text-indigo-700 hover:text-indigo-800 transition cursor-pointer"
                        title="Revisar evidencia"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 -960 960 960"
                          className="w-6 h-6 fill-indigo-700"
                        >
                          <path d="M440-240q116 0 198-81.5T720-520q0-116-82-198t-198-82q-117 0-198.5 82T160-520q0 117 81.5 198.5T440-240Zm0-280Zm0 160q-83 0-147.5-44.5T200-520q28-70 92.5-115T440-680q82 0 146.5 45T680-520q-29 71-93.5 115.5T440-360Zm0-60q55 0 101-26.5t72-73.5q-26-46-72-73t-101-27q-56 0-102 27t-72 73q26 47 72 73.5T440-420Zm0-40q25 0 42.5-17t17.5-43q0-25-17.5-42.5T440-580q-26 0-43 17.5T380-520q0 26 17 43t43 17Zm0 300q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T80-520q0-74 28.5-139.5t77-114.5q48.5-49 114-77.5T440-880q74 0 139.5 28.5T694-774q49 49 77.5 114.5T800-520q0 64-21 121t-58 104l159 159-57 56-159-158q-47 37-104 57.5T440-160Z" />
                        </svg>
                        <span className="text-[11px] font-semibold">
                          Revisar
                        </span>
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {openModalEditar && tareaSeleccionada && (
            <ModalEditar
              onClose={() => setOpenModalEditar(false)}
              tarea={tareaSeleccionada}  // ✅ Asegúrate que no sea null
              // ✅ FIX: Corregido el nombre de la prop
              onSuccess={onRecargarTareas}
              user={user}
            />
          )}
          {openModalEliminar && tareaSeleccionada && (
            <ModalEliminar
              onClose={() => setOpenModalEliminar(false)}
              onConfirm={confirmarEliminacion}
              tareaNombre={tareaSeleccionada.tarea}
            />
          )}
          {openModalAceptar && tareaSeleccionada && (
            <ModalAceptar
              onClose={() => setOpenModalAceptar(false)}
              onConfirm={confirmarFinalizacion}
              tareaNombre={tareaSeleccionada.tarea}
            />
          )}
          {modalImagenes && (
            <ModalGaleria
              imagenes={modalImagenes}
              onClose={() => setModalImagenes(null)}
            />
          )}
          {/* ✅ NUEVO: Modal de Revisión */}
          {tareaParaRevisar && (
            <ModalRevision
              tarea={tareaParaRevisar}
              onClose={handleCerrarRevision}
              onSuccess={handleExitoRevision}
              onVerImagenes={(imagenes) => {
                setModalImagenes(imagenes);
              }}
            />
          )}
        </>
      ) : (
        <div className="flex justify-center items-center h-40 text-gray-500 italic text-sm">
          No hay tareas registradas que coincidan con los filtros.
        </div>
      )}
    </div>
  );
};

export default TablaAdmin;