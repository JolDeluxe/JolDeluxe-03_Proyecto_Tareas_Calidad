// 📍 src/components/Admin/TablaAdmin.tsx

import React, { useState } from "react";
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

// 3. 🛠️ Utilidad de fecha robusta (maneja string o Date)
const formateaFecha = (fechaInput?: Date | string | null): string => {
  if (!fechaInput) return "";
  try {
    const fecha = new Date(fechaInput);
    // Verificar si la fecha es válida
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
    default: // PENDIENTE
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

    // Comparar solo la fecha (ignorando la hora)
    limite.setHours(0, 0, 0, 0);
    conclusion.setHours(0, 0, 0, 0);

    return conclusion > limite;
  } catch {
    return false;
  }
};

const TablaAdmin: React.FC<TablaProps> = ({
  filtro,
  responsable,
  query,
  tareas,
  loading,
  onRecargarTareas,
  user, // 👈 5. Recibir 'user'
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

  // 9. 🚀 Lógica de filtro (Esta lógica es correcta)
  const tareasFiltradas = tareas.filter((t) => {
    const estatus = t.estatus;

    const pasaEstatus =
      filtro.toUpperCase() === "TOTAL" ||
      (filtro.toUpperCase() === "PENDIENTES" && estatus === "PENDIENTE") ||
      (filtro.toUpperCase() === "CONCLUIDAS" && estatus === "CONCLUIDA") ||
      (filtro.toUpperCase() === "CANCELADAS" && estatus === "CANCELADA");

    const pasaResponsable =
      responsable === "Todos" ||
      t.responsables.some((r) => r.id.toString() === responsable);

    const texto = `${t.tarea} ${t.observaciones || ""}`.toLowerCase();
    const pasaBusqueda =
      query.trim() === "" || texto.includes(query.toLowerCase());

    return pasaEstatus && pasaResponsable && pasaBusqueda;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32 text-gray-500 italic">
        Cargando tareas...
      </div>
    );
  }

  return (
    <div className="w-full text-sm font-sans pb-0.5">
      {tareasFiltradas.length > 0 ? (
        <>
          {/* 💻 VISTA ESCRITORIO */}
          <div className="hidden lg:block max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-auto rounded-lg border border-gray-300">
            <table className="w-full text-sm font-sans">
              <thead className="bg-gray-100 text-black text-xs uppercase sticky top-0 z-20 shadow-inner">
                <tr>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300">
                    ID
                  </th>
                  <th className="px-3 py-3 text-left font-bold border-b border-gray-300">
                    Tarea
                  </th>
                  <th className="px-3 py-3 text-left font-bold border-b border-gray-300">
                    Observaciones
                  </th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300">
                    Asignado por
                  </th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300">
                    Responsable(s)
                  </th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300">
                    Prioridad
                  </th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300">
                    Registro
                  </th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300">
                    Fecha límite / Historial
                  </th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300">
                    Conclusión
                  </th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300">
                    Estatus
                  </th>
                  <th className="px-3 py-3 text-center font-bold border-b border-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {tareasFiltradas.map((row: Tarea) => {
                  const hoy = new Date();
                  hoy.setHours(0, 0, 0, 0);

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
                      <td className="px-3 py-3 text-center font-semibold">
                        {row.id}
                      </td>
                      <td className="px-3 py-3 text-left font-semibold">
                        {row.tarea}
                        {row.imagenes && row.imagenes.length > 0 && (
                          <button
                            onClick={() => setModalImagenes(row.imagenes)}
                            className="ml-2 inline-flex align-middle text-blue-600 hover:text-blue-800"
                            title="Ver imágenes"
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
                        )}
                      </td>
                      <td className="px-3 py-3 text-left text-gray-700 italic">
                        {row.observaciones || ""}
                      </td>
                      <td className="px-3 py-3 text-center text-amber-800 font-semibold">
                        {row.asignador.nombre}
                      </td>
                      <td className="px-3 py-3 text-center text-blue-700 font-semibold">
                        {row.responsables.map((r) => r.nombre).join(", ")}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold">
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
                      <td className="px-3 py-3 text-center">
                        {formateaFecha(row.fechaRegistro)}
                      </td>

                      {/* === 📆 Fecha límite e historial (VISTA ESCRITORIO) === */}
                      <td className="px-1 py-4 text-center font-semibold whitespace-nowrap align-top">
                        <div
                          className={`flex flex-col items-center ${
                            row.historialFechas &&
                            row.historialFechas.length > 0
                              ? "justify-start"
                              : "justify-center h-full"
                          } min-h-[50px]`}
                        >
                          <p
                            className={`font-semibold ${
                              vencida
                                ? "text-red-600 font-bold"
                                : "text-gray-800"
                            }`}
                          >
                            {fechaLimiteFinalStr}
                            {vencida && (
                              <span className="ml-1 inline-flex items-center">
                                {/* SVG Vencida */}
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
                                  {/* SVG Historial */}
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

                      <td
                        className={`px-3 py-3 text-center ${
                          retrasada ? "text-red-600 font-bold" : "text-gray-800"
                        }`}
                      >
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
                      {user && (
                        <Acciones
                          tarea={row}
                          user={user}
                          onCompletar={() => abrirModalAceptar(row)}
                          onEditar={() => abrirModalEditar(row)}
                          onBorrar={() => abrirModalEliminar(row)}
                        />
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 📱 VISTA MÓVIL */}
          <div className="grid lg:hidden grid-cols-1 md:grid-cols-2 gap-3 p-2 items-start">
            {tareasFiltradas.map((row: Tarea) => {
              // Lógica de fechas (similar a la de escritorio)
              const hoy = new Date();
              hoy.setHours(0, 0, 0, 0);

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

              const retrasada = isRetrasada(
                row.fechaLimite,
                row.fechaConclusion
              );

              const fechaLimiteFinalStr = formateaFecha(fechaLimiteObj);

              // 🚀 ✅ SOLUCIÓN (VISTA MÓVIL):
              //   Calculamos los permisos aquí también para que la lógica sea IDÉNTICA
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
                        {row.responsables.map((r) => r.nombre).join(", ")}
                      </span>
                    </p>
                    <p>
                      <span className="font-semibold text-gray-700">
                        Registro:
                      </span>{" "}
                      {formateaFecha(row.fechaRegistro)}
                    </p>

                    <p className="flex items-center text-xs">
                      <span className="font-semibold text-gray-700">
                        Límite:
                      </span>{" "}
                      <span
                        className={`ml-1 font-semibold ${
                          vencida ? "text-red-600" : "text-gray-800"
                        }`}
                      >
                        {fechaLimiteFinalStr}
                      </span>
                      {vencida && (
                        <span className="ml-1 inline-flex items-center">
                          {/* SVG Vencida */}
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

                    {row.fechaConclusion && (
                      <p
                        className={`mt-2 text-xs flex items-center ${
                          retrasada
                            ? "text-red-600 font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        <span className="font-semibold text-gray-700">
                          Conclusión:
                        </span>{" "}
                        <span className="ml-1">
                          {formateaFecha(row.fechaConclusion)}
                        </span>
                        {retrasada && (
                          <span className="ml-1 inline-flex items-center">
                            {/* SVG Retrasada */}
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
                              )
                            )}
                          </ul>
                        </div>
                      </details>
                    )}
                  </div>

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

                  {/* ⚙️ Acciones (Móvil) - LÓGICA CORREGIDA */}
                  <div className="flex justify-around items-center mt-4 pt-2 border-t border-gray-200 h-[46px]">
                    {row.estatus === "PENDIENTE" && (
                      <>
                        {/* 🚀 BOTÓN CANCELAR (Ahora visible para todos) */}
                        {puedeCancelar && (
                          <button
                            onClick={() => abrirModalEliminar(row)}
                            className="flex flex-col items-center text-red-700 hover:text-red-800 transition"
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

                        {/* 🚀 BOTÓN EDITAR (Visible para todos) */}
                        <button
                          onClick={() => abrirModalEditar(row)}
                          className="flex flex-col items-center text-amber-700 hover:text-amber-800 transition"
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

                        {/* 🚀 BOTÓN VALIDAR (Usa la nueva lógica 'puedeValidar') */}
                        {puedeValidar && (
                          <button
                            onClick={() => abrirModalAceptar(row)}
                            className="flex flex-col items-center text-green-700 hover:text-green-800 transition"
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
                      </>
                    )}
                    {row.estatus === "CONCLUIDA" && (
                      <div
                        className="flex flex-col items-center text-green-700 opacity-80"
                        title="Tarea completada"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 -960 960 960"
                          className="w-6 h-6 text-green-700"
                          fill="currentColor"
                        >
                          <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q8 0 15 1.5t14 4.5l-74 74H200v560h560v-266l80-80v346q0 33-23.5 56.5T760-120H200Zm261-160L235-506l56-56 170 170 367-367 57 55-424 424Z" />
                        </svg>
                        <span className="text-[11px] font-semibold">Hecha</span>
                      </div>
                    )}
                    {row.estatus === "CANCELADA" && (
                      <div
                        className="flex flex-col items-center text-red-700 opacity-80"
                        title="Tarea cancelada"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          className="w-6 h-6 text-red-700"
                        >
                          <path d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" />
                        </svg>
                        <span className="text-[11px] font-semibold">
                          Cancelada
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🪟 Modales */}
          {openModalEditar && tareaSeleccionada && (
            <ModalEditar
              onClose={() => setOpenModalEditar(false)}
              tarea={tareaSeleccionada}
              onTareaActualizada={onRecargarTareas}
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
